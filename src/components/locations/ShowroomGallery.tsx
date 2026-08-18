"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { ShowroomPhoto } from "@/data/showroom-gallery";
import { cn } from "@/lib/utils";

const galleryBlurDataUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3Crect width='16' height='10' fill='%23e8e2d8'/%3E%3C/svg%3E";

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
  const stagedPhotoIndexes =
    activeIndex === null
      ? []
      : Array.from(
          new Set([
            activeIndex,
            (activeIndex + 1) % photos.length,
            (activeIndex - 1 + photos.length) % photos.length,
          ]),
        );

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
          "grid grid-cols-2 gap-px overflow-hidden border border-ink/10 bg-ink/10 md:grid-cols-12 md:auto-rows-[13rem] lg:auto-rows-[15rem]",
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
                "group relative overflow-hidden bg-product-canvas text-left focus-visible:z-[1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-deep-teal",
                isLeadPhoto
                  ? "col-span-2 aspect-[4/3] md:col-span-8 md:row-span-2 md:aspect-auto"
                  : "aspect-[4/3] md:col-span-4 md:aspect-auto",
                !isLeadPhoto && visiblePhotos.length > 3 && index >= 3 && "md:col-span-3",
              )}
              aria-label={`Open showroom photo ${index + 1} of ${photos.length}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                quality={75}
                placeholder="blur"
                blurDataURL={galleryBlurDataUrl}
                decoding="async"
                sizes={
                  isLeadPhoto ? "(max-width: 768px) 100vw, 67vw" : "(max-width: 768px) 50vw, 33vw"
                }
                className="object-cover transition-[filter,transform] duration-500 ease-out group-hover:brightness-[0.94] motion-safe:group-hover:scale-[1.018] motion-reduce:transition-none"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-75 transition-opacity duration-300 group-hover:opacity-100" />
              {isLeadPhoto ? (
                <span className="absolute bottom-4 left-4 max-w-[70%] font-heading text-2xl leading-tight text-white sm:bottom-5 sm:left-5 sm:text-3xl">
                  The Partridge Creek showroom
                </span>
              ) : null}
              <span className="absolute right-3 bottom-3 inline-flex min-h-10 items-center gap-2 border border-white/30 bg-ink/70 px-3 text-xs font-semibold tracking-[0.12em] text-white uppercase backdrop-blur-sm transition-colors group-hover:bg-ivory group-hover:text-ink">
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
            {stagedPhotoIndexes.map((photoIndex) => {
              const photo = photos[photoIndex];
              const isActive = photoIndex === activeIndex;

              return (
                <Image
                  key={photo.src}
                  src={photo.src}
                  alt={isActive ? photo.alt : ""}
                  aria-hidden={!isActive}
                  fill
                  quality={92}
                  sizes="100vw"
                  loading="eager"
                  placeholder="blur"
                  blurDataURL={galleryBlurDataUrl}
                  className={cn(
                    "object-contain p-2 transition-opacity duration-150 sm:p-4 motion-reduce:transition-none",
                    isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
                  )}
                />
              );
            })}

            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute top-1/2 left-3 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/65 text-white backdrop-blur transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 sm:left-5"
                  aria-label="Show previous showroom photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute top-1/2 right-3 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/65 text-white backdrop-blur transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 sm:right-5"
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
