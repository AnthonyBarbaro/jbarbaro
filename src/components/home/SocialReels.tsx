"use client";

import Image from "next/image";
import { ArrowUpRight, Clapperboard, Instagram, Music2, Play } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ReelViewer } from "@/components/home/ReelViewer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { SocialReelsContent } from "@/lib/cms-defaults";
import { resolveSocialReel, resolveTikTokProfile } from "@/lib/social-reels";

const profileAvatar = "/images/social/tiktok/jason-barbaro-profile.jpg";
const fallbackPoster = "/images/campaign/ss26/canali-coastal-tailoring-portrait-hero.webp";
const focusClass =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2";

type InstagramWindow = Window & { instgrm?: { Embeds?: { process?: () => void } } };
let instagramSdkPromise: Promise<void> | null = null;

function loadInstagramSdk(): Promise<void> {
  if ((window as InstagramWindow).instgrm?.Embeds?.process) return Promise.resolve();
  if (!instagramSdkPromise) {
    instagramSdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.instagram.com/embed.js";
      script.onload = () => resolve();
      script.onerror = () => {
        instagramSdkPromise = null;
        script.remove();
        reject(new Error("Instagram embed script unavailable"));
      };
      document.body.append(script);
    });
  }
  return instagramSdkPromise;
}

function localPoster(src: string): string {
  return /^\/images\/[a-zA-Z0-9/_.-]+\.(?:webp|png|jpe?g|avif)$/i.test(src) &&
    !src.split("/").includes("..")
    ? src
    : fallbackPoster;
}

function instagramProfile(href: string): string | null {
  try {
    const url = new URL(href);
    return url.protocol === "https:" &&
      ["instagram.com", "www.instagram.com"].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^\/[a-zA-Z0-9._]+\/?$/.test(url.pathname)
      ? `https://www.instagram.com${url.pathname.replace(/\/$/, "")}/`
      : null;
  } catch {
    return null;
  }
}

function ProviderEmbed({
  href,
  platform,
  handle,
}: {
  href: string;
  platform: "instagram" | "tiktok";
  handle?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // The provider replaces this markup. Keep its DOM outside React's children.
    const quote = document.createElement("blockquote");
    quote.className = platform === "tiktok" ? "tiktok-embed" : "instagram-media";
    quote.style.margin = "0 auto";
    quote.style.maxWidth = "720px";
    quote.style.width = "100%";
    if (platform === "tiktok" && handle) {
      quote.cite = href;
      quote.dataset.uniqueId = handle;
      quote.dataset.embedType = "creator";
      quote.dataset.embedFrom = "oembed";
      quote.style.minWidth = "288px";
    } else {
      quote.dataset.instgrmPermalink = href;
      quote.dataset.instgrmVersion = "14";
    }
    const section = document.createElement("section");
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = handle ? `@${handle}` : "Watch on Instagram";
    section.append(link);
    quote.append(section);
    container.append(quote);

    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    if (platform === "instagram") {
      void loadInstagramSdk()
        .then(() => {
          if (cancelled) return;
          const embeds = (window as InstagramWindow).instgrm?.Embeds;
          if (embeds?.process) embeds.process();
          else setFailed(true);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    } else {
      script = document.createElement("script");
      script.async = true;
      script.src = "https://www.tiktok.com/embed.js";
      script.onerror = () => {
        if (!cancelled) setFailed(true);
      };
      container.append(script);
    }

    return () => {
      cancelled = true;
      if (script) script.onerror = null;
      container.replaceChildren();
    };
  }, [href, platform, handle]);

  return (
    <div className="min-w-0">
      <div ref={containerRef} className="overflow-x-auto bg-white text-ink" />
      <p
        className="px-4 pt-4 text-center text-xs leading-6 text-smoke"
        role={failed ? "status" : undefined}
      >
        {failed
          ? "The player couldn’t load. Use the link below to watch."
          : "If the player doesn’t appear, use the link below to watch."}
      </p>
    </div>
  );
}

export function SocialReels({ content }: { content: SocialReelsContent }) {
  const sectionId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const profile = resolveTikTokProfile(content.tiktokHref ?? "");
  const instagramHref = instagramProfile(content.instagramHref);
  const clips = content.clips
    .flatMap((clip) => {
      const resolved = resolveSocialReel(clip.href);
      return resolved ? [{ ...clip, ...resolved }] : [];
    })
    .slice(0, 12);
  const featuredClips = clips.slice(0, 4);

  const creatorHref = profile?.href ?? instagramHref;
  const creatorHandle = profile?.handle ?? instagramHref?.split("/")[3];

  return (
    <section
      aria-labelledby={`${sectionId}-title`}
      className="border-y border-ink/10 bg-white py-8 sm:py-10 lg:py-12"
    >
      <Container className="max-w-[100rem] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <Image
                src={profileAvatar}
                alt="Jason Barbaro in a light blue jacket"
                width={64}
                height={64}
                data-social-profile-avatar
                className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-16 sm:w-16"
              />
              <div className="min-w-0">
                <p className="text-lg leading-6 font-bold text-ink sm:text-2xl sm:leading-8">
                  {content.eyebrow}
                </p>
                {creatorHref && creatorHandle ? (
                  <a
                    href={creatorHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-0.5 inline-flex min-h-6 max-w-full items-center text-sm text-ink/65 hover:underline ${focusClass}`}
                  >
                    <span className="truncate">@{creatorHandle}</span>
                  </a>
                ) : null}
              </div>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink/70">{content.description}</p>
          </div>
          <div className="flex shrink-0 gap-2 sm:pt-2">
            {profile ? (
              <a
                href={profile.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink/85 sm:flex-none ${focusClass}`}
              >
                <Music2 className="h-4 w-4" aria-hidden /> Follow on TikTok
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
            {instagramHref ? (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit J. Barbaro on Instagram"
                className={`inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-ink/15 px-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 ${focusClass}`}
              >
                <Instagram className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-b border-ink/15">
          <div className="-mb-px flex min-h-12 items-center gap-2 border-b-2 border-ink px-1">
            <Clapperboard className="h-5 w-5 text-ink" aria-hidden />
            <h2 id={`${sectionId}-title`} className="text-sm font-semibold text-ink">
              {content.title}
            </h2>
          </div>
          {clips.length > 0 ? (
            <span className="text-xs text-ink/65">
              {clips.length} {clips.length === 1 ? "reel" : "reels"}
            </span>
          ) : null}
        </div>

        {featuredClips.length > 0 ? (
          <>
            <ul
              aria-label="J. Barbaro videos"
              className="mt-1 grid grid-cols-2 gap-1 sm:gap-1.5 md:grid-cols-4"
            >
              {featuredClips.map((clip, index) => (
                <li key={clip.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Watch ${clip.title} on ${clip.platform === "tiktok" ? "TikTok" : "Instagram"}`}
                    aria-haspopup="dialog"
                    className={`group block w-full cursor-pointer text-left ${focusClass}`}
                  >
                    <span className="relative block aspect-[9/16] overflow-hidden rounded-sm bg-ink">
                      <Image
                        src={localPoster(clip.poster)}
                        alt={clip.posterAlt}
                        fill
                        sizes="(max-width:767px) 50vw, (max-width:1600px) 25vw, 380px"
                        className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
                      />
                      <span
                        className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/90 to-transparent"
                        aria-hidden
                      />
                      <Clapperboard
                        className="absolute top-3 right-3 h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                        aria-hidden
                      />
                      <span
                        className="absolute top-1/2 left-1/2 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-transform group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none sm:h-12 sm:w-12"
                        aria-hidden
                      >
                        <Play className="ml-0.5 h-5 w-5 fill-current" />
                      </span>
                      <span className="absolute inset-x-3 bottom-3 line-clamp-2 text-sm leading-5 font-semibold text-white sm:inset-x-4 sm:bottom-4 sm:text-base sm:leading-6">
                        {clip.title}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-6 text-ink/65">
              <span className="md:hidden">Tap a reel, then swipe for more.</span>
              <span className="hidden md:inline">
                Open a reel to watch{clips.length > 1 ? ` all ${clips.length}` : ""}.
              </span>
            </p>
          </>
        ) : (
          <div className="mt-8 grid overflow-hidden rounded-lg bg-ink lg:grid-cols-[0.65fr_1.35fr]">
            <div className="relative hidden min-h-[30rem] lg:block">
              <Image
                src={localPoster(content.fallbackImage)}
                alt={content.fallbackImageAlt}
                fill
                sizes="35vw"
                className="object-cover object-top"
              />
            </div>
            <div
              className={`flex min-w-0 flex-col justify-center ${feedLoaded ? "bg-white py-6" : "px-6 py-12 text-white sm:px-12 sm:py-16"}`}
            >
              {profile ? (
                feedLoaded ? (
                  <>
                    <ProviderEmbed href={profile.href} platform="tiktok" handle={profile.handle} />
                    <a
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mx-auto mt-3 inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-deep-teal ${focusClass}`}
                    >
                      Watch on TikTok <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </a>
                  </>
                ) : (
                  <div className="mx-auto w-full max-w-lg">
                    <Music2 className="h-8 w-8 text-gold" aria-hidden />
                    <p className="mt-6 font-heading text-3xl leading-tight sm:text-4xl">
                      Meet us on your feed.
                    </p>
                    <p className="mt-3 text-base font-semibold break-all text-white">
                      @{profile.handle}
                    </p>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-white/80">
                      Explore our recent TikToks, right here.
                    </p>
                    <Button onClick={() => setFeedLoaded(true)} className="mt-6">
                      Load TikTok videos <Play className="h-4 w-4" aria-hidden />
                    </Button>
                    <p className="mt-4 max-w-sm text-xs leading-6 text-white/70">
                      Loading connects to TikTok. Videos may play automatically.
                    </p>
                  </div>
                )
              ) : (
                <div className="mx-auto w-full max-w-lg">
                  <Instagram className="h-8 w-8 text-gold" aria-hidden />
                  <p className="mt-6 font-heading text-3xl leading-tight sm:text-4xl">
                    Follow along with J. Barbaro.
                  </p>
                  {instagramHref ? (
                    <a
                      href={instagramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white underline underline-offset-4 ${focusClass}`}
                    >
                      Visit our Instagram <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
      {activeIndex !== null && clips[activeIndex] ? (
        <ReelViewer
          clips={clips}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
        >
          {clips[activeIndex].platform === "instagram" ? (
            <ProviderEmbed
              key={clips[activeIndex].href}
              href={clips[activeIndex].href}
              platform="instagram"
            />
          ) : null}
        </ReelViewer>
      ) : null}
    </section>
  );
}
