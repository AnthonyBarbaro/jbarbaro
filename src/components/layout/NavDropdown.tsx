"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavDropdownLink = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
};

export type NavDropdownMedia = {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
};

type NavDropdownProps = {
  align?: "left" | "center" | "right";
  description: string;
  links: NavDropdownLink[];
  media: NavDropdownMedia;
  title: string;
};

export function NavDropdown({ align = "center", description, links, media, title }: NavDropdownProps) {
  return (
    <div
      className={cn(
        "invisible pointer-events-none absolute top-full z-[110] pt-4 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100",
        align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
      )}
    >
      <div className="grid w-[860px] grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 rounded-[2rem] border border-ink/10 bg-white p-6 shadow-[0_38px_110px_-52px_rgba(14,23,38,0.42)]">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-smoke uppercase">Shop Highlights</p>
          <h3 className="mt-3 font-heading text-[2.2rem] leading-tight text-ink">{title}</h3>
          <p className="mt-3 max-w-xl text-sm leading-7 text-smoke">{description}</p>

          <ul className="mt-6 grid grid-cols-2 gap-3">
            {links.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="flex h-full items-start justify-between rounded-[1.35rem] border border-ink/8 bg-[#fcfbf8] px-4 py-4 transition-all duration-200 hover:border-gold/35 hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-ink uppercase">{link.label}</p>
                    {link.description ? <p className="mt-2 text-sm leading-6 text-smoke">{link.description}</p> : null}
                  </div>
                  <MoveUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-smoke" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-[1.7rem]">
          <Image
            src={media.imageSrc}
            alt={media.imageAlt}
            fill
            sizes="360px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/28 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">{media.eyebrow}</p>
            <h4 className="mt-3 max-w-xs font-heading text-[2rem] leading-tight">{media.title}</h4>
            <p className="mt-3 max-w-sm text-sm leading-6 text-ivory/82">{media.description}</p>
            <Link
              href={media.ctaHref}
              className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors hover:text-gold"
            >
              {media.ctaLabel}
              <MoveUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
