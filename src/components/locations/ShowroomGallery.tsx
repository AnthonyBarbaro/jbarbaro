"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { ShowroomPhoto } from "@/data/showroom-gallery";
import { cn } from "@/lib/utils";

type ShowroomGalleryProps = {
  photos: ShowroomPhoto[];
  visibleCount?: number;
  className?: string;
};

export function ShowroomGallery({
  photos,
  visibleCount = photos.length,
  className,
}: ShowroomGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visiblePhotos = photos.slice(0, visibleCount);
  const activePhoto = activeIndex === null ? null : (photos[activeIndex] ?? null);

  function showPrevious() {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current - 1 + photos.length) % photos.length;
    });
  }

  function showNext() {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current + 1) % photos.length;
    });
  }

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? null : (current - 1 + photos.length) % photos.length,
        );
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current === null ? null : (current + 1) % photos.length));
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, photos.length]);

  if (visiblePhotos.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-12 md:auto-rows-[12rem] lg:auto-rows-[14rem]",
          className,
        )}
      >
        {visiblePhotos.map((photo, index) => {
          const isLeadPhoto = index === 0;
          const isLastPreviewPhoto =
            visibleCount < photos.length && index === visiblePhotos.length - 1;

          return (
            <button
              key={photo.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "group relative overflow-hidden rounded-lg border border-ink/10 bg-stone text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/35",
                isLeadPhoto
                  ? "col-span-2 aspect-[3/2] md:col-span-7 md:row-span-2 md:aspect-auto"
                  : "aspect-square md:col-span-5 md:aspect-auto",
                !isLeadPhoto && visiblePhotos.length > 3 && index >= 3 && "md:col-span-3",
              )}
              aria-label={`Open showroom photo ${index + 1} of ${photos.length}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                quality={92}
                sizes={
                  isLeadPhoto ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 50vw, 42vw"
                }
                className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
              <span className="absolute right-3 bottom-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-white/25 bg-ink/65 px-3 text-[10px] font-semibold tracking-[0.12em] text-white uppercase backdrop-blur">
                {isLastPreviewPhoto ? (
                  <>
                    <Images className="h-3.5 w-3.5" />
                    View all {photos.length}
                  </>
                ) : (
                  <>
                    <Expand className="h-3.5 w-3.5" />
                    View
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {activePhoto && activeIndex !== null ? (
        <div
          className="fixed inset-0 z-[180] flex h-dvh flex-col bg-[#080c10] text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Partridge Creek showroom gallery"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/55 uppercase">
                Partridge Creek Showroom
              </p>
              <p className="mt-1 text-xs font-medium text-white/85">
                {activeIndex + 1} / {photos.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/8 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
              aria-label="Close showroom gallery"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative min-h-0 flex-1 bg-black/20">
            <Image
              src={activePhoto.src}
              alt={activePhoto.alt}
              fill
              quality={92}
              sizes="100vw"
              priority
              className="object-contain p-2 sm:p-5"
            />

            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute top-1/2 left-3 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/65 text-white backdrop-blur transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 sm:left-5"
                  aria-label="Show previous showroom photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute top-1/2 right-3 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/65 text-white backdrop-blur transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 sm:right-5"
                  aria-label="Show next showroom photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          <p className="px-4 py-3 text-center text-xs leading-5 text-white/65 sm:px-6">
            {activePhoto.alt}
          </p>
        </div>
      ) : null}
    </>
  );
}
