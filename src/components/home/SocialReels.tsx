"use client";

import Image from "next/image";
import { ArrowUpRight, ChevronLeft, ChevronRight, Instagram, Music2, Play } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ReelViewer } from "@/components/home/ReelViewer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { SocialReelsContent } from "@/lib/cms-defaults";
import { resolveSocialReel, resolveTikTokProfile } from "@/lib/social-reels";

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
  const railRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [edges, setEdges] = useState({ previous: false, next: false });
  const profile = resolveTikTokProfile(content.tiktokHref ?? "");
  const instagramHref = instagramProfile(content.instagramHref);
  const clips = content.clips
    .flatMap((clip) => {
      const resolved = resolveSocialReel(clip.href);
      return resolved ? [{ ...clip, ...resolved }] : [];
    })
    .slice(0, 4);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    function updateEdges(): void {
      if (!rail) return;
      setEdges({
        previous: rail.scrollLeft > 2,
        next: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2,
      });
    }
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(rail);
    rail.addEventListener("scroll", updateEdges, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", updateEdges);
    };
  }, [clips.length]);

  function scrollRail(direction: number): void {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left:
        direction * (rail.firstElementChild?.getBoundingClientRect().width ?? 280) + direction * 16,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <section
      aria-labelledby={`${sectionId}-title`}
      className="border-t border-ink/10 bg-product-canvas py-12 sm:py-14 lg:py-16"
    >
      <Container className="max-w-[100rem] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-deep-teal uppercase">
              {content.eyebrow}
            </p>
            <h2
              id={`${sectionId}-title`}
              className="mt-3 font-heading text-4xl text-ink sm:text-5xl"
            >
              {content.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-ink/65 sm:text-base">
              {content.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {profile ? (
              <a
                href={profile.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink ${focusClass}`}
              >
                <Music2 className="h-4 w-4" aria-hidden /> TikTok{" "}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
            {instagramHref ? (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink ${focusClass}`}
              >
                <Instagram className="h-4 w-4" aria-hidden /> Instagram{" "}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        {clips.length > 0 ? (
          <>
            <ul
              id={`${sectionId}-clips`}
              ref={railRef}
              aria-label="J. Barbaro videos"
              className="mt-8 flex snap-x snap-mandatory scroll-px-1.5 gap-4 overflow-x-auto overscroll-x-contain p-1.5 pb-4 [scrollbar-width:thin]"
            >
              {clips.map((clip, index) => (
                <li
                  key={clip.id}
                  className="w-[80%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Watch ${clip.title} on ${clip.platform === "tiktok" ? "TikTok" : "Instagram"}`}
                    aria-haspopup="dialog"
                    className={`group block w-full cursor-pointer rounded-lg text-left ${focusClass}`}
                  >
                    <span className="relative block aspect-[9/16] overflow-hidden rounded-lg bg-ink">
                      <Image
                        src={localPoster(clip.poster)}
                        alt={clip.posterAlt}
                        fill
                        sizes="(max-width:640px) 80vw, (max-width:1024px) 50vw, (max-width:1600px) 25vw, 360px"
                        className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
                      />
                      <span
                        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/95 via-ink/60 to-transparent"
                        aria-hidden
                      />
                      <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-white">
                        {clip.platform === "tiktok" ? (
                          <Music2 className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <Instagram className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {clip.platform === "tiktok" ? "TikTok" : "Instagram"}
                      </span>
                      <span className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
                        <span className="inline-flex h-18 w-18 items-center justify-center rounded-full bg-white text-ink shadow-[0_6px_24px_rgba(0,0,0,0.25)] transition-colors duration-200 group-hover:bg-gold group-focus-visible:bg-gold">
                          <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
                        </span>
                        <span className="rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white">
                          Play video
                        </span>
                      </span>
                      <span className="absolute inset-x-4 bottom-5 text-white sm:inset-x-5">
                        <span className="mt-1.5 line-clamp-2 text-base leading-6 font-semibold text-white sm:text-lg sm:leading-7">
                          {clip.title}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-xs text-ink/65">
                Select a video to watch.<span className="lg:hidden"> Swipe to explore.</span>
              </p>
              <div className="flex gap-2 lg:hidden">
                {([-1, 1] as const).map((direction) => (
                  <button
                    key={direction}
                    type="button"
                    onClick={() => scrollRail(direction)}
                    disabled={direction === -1 ? !edges.previous : !edges.next}
                    aria-label={direction === -1 ? "Previous videos" : "More videos"}
                    aria-controls={`${sectionId}-clips`}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 ${focusClass}`}
                  >
                    {direction === -1 ? (
                      <ChevronLeft className="h-5 w-5" aria-hidden />
                    ) : (
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                ))}
              </div>
            </div>
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
