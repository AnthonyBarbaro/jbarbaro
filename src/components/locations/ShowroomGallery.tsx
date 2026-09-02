"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Pause, Play, X } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import type { ShowroomPhoto } from "@/data/showroom-gallery";
import { cn } from "@/lib/utils";

const galleryBlurDataUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3Crect width='16' height='10' fill='%23e8e2d8'/%3E%3C/svg%3E";

const swipeThreshold = 44;

type ShowroomGalleryProps = {
  photos: ShowroomPhoto[];
  className?: string;
};

function getStagedPhotoIndexes(activeIndex: number, photoCount: number) {
  if (photoCount === 0) return [];

  return Array.from(
    new Set([
      activeIndex,
      (activeIndex + 1) % photoCount,
      (activeIndex - 1 + photoCount) % photoCount,
    ]),
  );
}

function centerThumbnailInRail(rail: HTMLDivElement | null, element: HTMLButtonElement | null) {
  if (!rail || !element) return;

  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  const railRect = rail.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const left =
    rail.scrollLeft +
    elementRect.left -
    railRect.left -
    (rail.clientWidth - element.clientWidth) / 2;

  rail.scrollTo({ left, behavior });
}

export function ShowroomGallery({ photos, className }: ShowroomGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isAutoplaying, setIsAutoplaying] = useState(true);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);
  const hasSelectedPhotoChanged = useRef(false);
  const inlineThumbnailRailRef = useRef<HTMLDivElement | null>(null);
  const inlineThumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lightboxThumbnailRailRef = useRef<HTMLDivElement | null>(null);
  const lightboxThumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const photoCount = photos.length;
  const currentIndex = Math.min(selectedIndex, Math.max(photoCount - 1, 0));
  const currentPhoto = photos[currentIndex] ?? null;
  const activePhoto = lightboxIndex === null ? null : (photos[lightboxIndex] ?? null);
  const stagedPreviewIndexes = getStagedPhotoIndexes(currentIndex, photoCount);
  const stagedLightboxIndexes =
    lightboxIndex === null ? [] : getStagedPhotoIndexes(lightboxIndex, photoCount);
  const isLightboxOpen = lightboxIndex !== null;

  function selectPhoto(index: number) {
    setSelectedIndex(index);
  }

  function showPreviousPreview() {
    if (photoCount < 2) return;
    selectPhoto((currentIndex - 1 + photoCount) % photoCount);
  }

  function showNextPreview() {
    if (photoCount < 2) return;
    selectPhoto((currentIndex + 1) % photoCount);
  }

  function openLightbox(index: number) {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setLightboxIndex(index);
  }

  function closeLightbox() {
    didSwipe.current = false;
    setLightboxIndex(null);
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }

  function selectLightboxPhoto(index: number) {
    setLightboxIndex(index);
    requestAnimationFrame(() =>
      centerThumbnailInRail(lightboxThumbnailRailRef.current, lightboxThumbnailRefs.current[index]),
    );
  }

  function showPreviousLightbox() {
    if (lightboxIndex === null || photoCount < 2) return;
    selectLightboxPhoto((lightboxIndex - 1 + photoCount) % photoCount);
  }

  function showNextLightbox() {
    if (lightboxIndex === null || photoCount < 2) return;
    selectLightboxPhoto((lightboxIndex + 1) % photoCount);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") return;

    didSwipe.current = false;
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(
    event: ReactPointerEvent<HTMLElement>,
    showPrevious: () => void,
    showNext: () => void,
  ) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    didSwipe.current = true;
    if (deltaX > 0) showPrevious();
    else showNext();
  }

  useEffect(() => {
    if (!hasSelectedPhotoChanged.current) {
      hasSelectedPhotoChanged.current = true;
      return;
    }

    const frame = requestAnimationFrame(() =>
      centerThumbnailInRail(
        inlineThumbnailRailRef.current,
        inlineThumbnailRefs.current[currentIndex],
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, [currentIndex]);

  useEffect(() => {
    if (!isAutoplaying || isLightboxOpen || photoCount < 2) return;

    const timer = window.setTimeout(() => {
      setSelectedIndex((current) => (current + 1) % photoCount);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [currentIndex, isAutoplaying, isLightboxOpen, photoCount]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        didSwipe.current = false;
        setLightboxIndex(null);
        requestAnimationFrame(() => previousFocusRef.current?.focus());
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setLightboxIndex((current) =>
          current === null ? null : (current - 1 + photoCount) % photoCount,
        );
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setLightboxIndex((current) => (current === null ? null : (current + 1) % photoCount));
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        lightboxRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, photoCount]);

  if (!currentPhoto) return null;

  return (
    <>
      <section className={cn("border-y border-ink/15 bg-white", className)}>
        <div className="relative isolate h-[clamp(20rem,46vw,42rem)] overflow-hidden bg-product-canvas">
          <button
            type="button"
            onClick={() => {
              if (didSwipe.current) {
                didSwipe.current = false;
                return;
              }
              openLightbox(currentIndex);
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={(event) => handlePointerUp(event, showPreviousPreview, showNextPreview)}
            onPointerCancel={() => {
              didSwipe.current = false;
              pointerStart.current = null;
            }}
            className="absolute inset-0 touch-pan-y text-left focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-deep-teal"
            aria-label={`Open showroom photo ${currentIndex + 1} of ${photoCount} full screen`}
          >
            {stagedPreviewIndexes.map((photoIndex) => {
              const photo = photos[photoIndex];
              const isActive = photoIndex === currentIndex;

              return (
                <Image
                  key={photo.src}
                  src={photo.src}
                  alt={isActive ? photo.alt : ""}
                  aria-hidden={!isActive}
                  fill
                  quality={75}
                  sizes="100vw"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={galleryBlurDataUrl}
                  className={cn(
                    "object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none",
                    isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
                  )}
                />
              );
            })}

            <span className="absolute inset-0 z-20 bg-gradient-to-t from-ink/70 via-transparent to-ink/10" />
            <span className="absolute top-3 right-3 z-30 inline-flex h-11 w-11 items-center justify-center border border-white/35 bg-ink/70 text-white sm:top-5 sm:right-5">
              <Expand className="h-4 w-4" aria-hidden />
            </span>
            <span className="absolute bottom-5 left-4 z-30 max-w-[60%] font-heading text-2xl leading-tight text-white sm:left-6 sm:text-3xl">
              The Partridge Creek showroom
            </span>
          </button>

          {photoCount > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setIsAutoplaying((current) => !current)}
                className="absolute top-3 left-3 z-40 inline-flex h-11 w-11 items-center justify-center border border-white/30 bg-ink/72 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50 sm:top-5 sm:left-5"
                aria-label={isAutoplaying ? "Pause showroom slideshow" : "Play showroom slideshow"}
              >
                {isAutoplaying ? (
                  <Pause className="h-4 w-4" aria-hidden />
                ) : (
                  <Play className="h-4 w-4" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={showPreviousPreview}
                className="absolute top-1/2 left-3 z-40 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/30 bg-ink/72 text-white transition-colors hover:bg-ivory hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50 sm:left-5 sm:h-14 sm:w-14"
                aria-label="Show previous showroom photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNextPreview}
                className="absolute top-1/2 right-3 z-40 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/30 bg-ink/72 text-white transition-colors hover:bg-ivory hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50 sm:right-5 sm:h-14 sm:w-14"
                aria-label="Show next showroom photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        <div className="flex items-start justify-between gap-5 border-t border-ink/10 px-4 py-3 sm:items-center sm:px-5">
          <p className="max-w-4xl text-xs leading-5 text-smoke sm:text-sm">{currentPhoto.alt}</p>
          <p className="shrink-0 text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase">
            {String(currentIndex + 1).padStart(2, "0")} / {String(photoCount).padStart(2, "0")}
          </p>
        </div>
      </section>

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-deep-teal uppercase">
            All showroom photos
          </p>
          <p className="text-xs text-smoke">Select any view</p>
        </div>
        <div
          ref={inlineThumbnailRailRef}
          className="grid snap-x snap-mandatory grid-flow-col auto-cols-[28%] gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] sm:auto-cols-[20%] lg:grid-flow-row lg:grid-cols-7"
          aria-label="Showroom photo thumbnails"
        >
          {photos.map((photo, index) => {
            const isSelected = index === currentIndex;

            return (
              <button
                key={photo.src}
                ref={(element) => {
                  inlineThumbnailRefs.current[index] = element;
                }}
                type="button"
                onClick={() => selectPhoto(index)}
                className={cn(
                  "relative h-20 snap-start overflow-hidden border bg-product-canvas text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/35 sm:h-24 lg:h-28",
                  isSelected ? "border-deep-teal ring-1 ring-deep-teal" : "border-ink/15",
                )}
                aria-label={`Show showroom photo ${index + 1} of ${photoCount}`}
                aria-current={isSelected ? "true" : undefined}
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  quality={75}
                  sizes="(max-width: 640px) 28vw, (max-width: 1024px) 20vw, 14vw"
                  placeholder="blur"
                  blurDataURL={galleryBlurDataUrl}
                  className={cn(
                    "object-cover transition-[filter] duration-300 ease-out motion-reduce:transition-none",
                    isSelected && "brightness-[0.9]",
                  )}
                />
                <span
                  className={cn(
                    "absolute top-2 left-2 inline-flex h-6 min-w-6 items-center justify-center px-1.5 text-[10px] font-semibold",
                    isSelected ? "bg-deep-teal text-white" : "bg-ivory/90 text-ink",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activePhoto && lightboxIndex !== null ? (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[180] flex h-dvh flex-col bg-[#080c10] text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Partridge Creek showroom gallery"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/55 uppercase">
                Partridge Creek Showroom
              </p>
              <p className="mt-1 text-xs font-medium text-white/85">
                Photo {lightboxIndex + 1} of {photoCount}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeLightbox}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/8 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
              aria-label="Close showroom gallery"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="relative min-h-0 flex-1 touch-pan-y bg-black/20"
            onPointerDown={handlePointerDown}
            onPointerUp={(event) => handlePointerUp(event, showPreviousLightbox, showNextLightbox)}
            onPointerCancel={() => {
              didSwipe.current = false;
              pointerStart.current = null;
            }}
          >
            {stagedLightboxIndexes.map((photoIndex) => {
              const photo = photos[photoIndex];
              const isActive = photoIndex === lightboxIndex;

              return (
                <Image
                  key={photo.src}
                  src={photo.src}
                  alt={isActive ? photo.alt : ""}
                  aria-hidden={!isActive}
                  fill
                  quality={75}
                  sizes="100vw"
                  loading="eager"
                  placeholder="blur"
                  blurDataURL={galleryBlurDataUrl}
                  className={cn(
                    "object-contain p-2 transition-opacity duration-200 ease-out sm:p-4 motion-reduce:transition-none",
                    isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
                  )}
                />
              );
            })}

            {photoCount > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPreviousLightbox}
                  className="absolute top-1/2 left-3 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 bg-ink/72 text-white transition-colors hover:bg-ivory hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 sm:left-5 sm:h-14 sm:w-14"
                  aria-label="Show previous showroom photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={showNextLightbox}
                  className="absolute top-1/2 right-3 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 bg-ink/72 text-white transition-colors hover:bg-ivory hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 sm:right-5 sm:h-14 sm:w-14"
                  aria-label="Show next showroom photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-[#0c1116] px-3 py-3 sm:px-6">
            <div
              ref={lightboxThumbnailRailRef}
              className="mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]"
              aria-label="Full-screen showroom photo thumbnails"
            >
              {photos.map((photo, index) => {
                const isSelected = index === lightboxIndex;

                return (
                  <button
                    key={photo.src}
                    ref={(element) => {
                      lightboxThumbnailRefs.current[index] = element;
                    }}
                    type="button"
                    onClick={() => selectLightboxPhoto(index)}
                    className={cn(
                      "relative h-14 w-20 shrink-0 overflow-hidden border bg-black/30 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40 sm:h-16 sm:w-24",
                      isSelected
                        ? "border-gold ring-1 ring-gold"
                        : "border-white/15 hover:border-white/55",
                    )}
                    aria-label={`Show photo ${index + 1} of ${photoCount}`}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <Image
                      src={photo.src}
                      alt=""
                      fill
                      quality={75}
                      sizes="96px"
                      className={cn("object-cover", !isSelected && "opacity-70")}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mx-auto mt-1 max-w-4xl text-center text-xs leading-5 text-white/65">
              {activePhoto.alt}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
