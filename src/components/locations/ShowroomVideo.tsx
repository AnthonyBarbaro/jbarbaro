"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/components/ui/AccessibilityProvider";
import type { ShowroomVideoAsset } from "@/data/showroom-gallery";

const visibleFraction = 0.25;

export function ShowroomVideo({ src, poster, width, height }: ShowroomVideoAsset) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < visibleFraction) return;

        observer.disconnect();
        if (video.paused && video.currentTime === 0) {
          void video.play().catch(() => {
            // The player controls remain available when the browser blocks autoplay.
          });
        }
      },
      { threshold: visibleFraction },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <video
      ref={videoRef}
      aria-label="Store video"
      className="mt-8 block h-auto w-full rounded-lg bg-ink"
      controls
      muted
      playsInline
      preload="none"
      poster={poster}
      width={width}
      height={height}
    >
      <source src={src} type="video/mp4" />
      <a href={src}>Open the store video</a>
    </video>
  );
}
