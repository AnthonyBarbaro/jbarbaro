"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

import { TikTokReelPlayer } from "@/components/home/TikTokReelPlayer";
import { getAdjacentReelIndex, getReelSwipeDirection } from "@/lib/reel-navigation";

type ViewerClip = {
  id: string;
  title: string;
  href: string;
  platform: "instagram" | "tiktok";
  embedSrc?: string;
};

type ReelViewerProps = {
  clips: ViewerClip[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  children?: ReactNode;
};

const controlClass =
  "inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40";

export function ReelViewer({ clips, index, onIndexChange, onClose, children }: ReelViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pointerRef = useRef<{
    id: number;
    x: number;
    y: number;
    target: Element;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const titleId = useId();
  const hintId = useId();
  const clip = clips[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function clearPointer(): void {
    const pointer = pointerRef.current;
    pointerRef.current = null;
    if (pointer?.target.hasPointerCapture(pointer.id)) {
      pointer.target.releasePointerCapture(pointer.id);
    }
  }

  function navigate(direction: -1 | 1): void {
    clearPointer();
    if (clips.length < 2) return;
    const restoreGestureFocus =
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("[data-reel-gesture]");
    if (restoreGestureFocus) {
      closeButtonRef.current?.focus({ preventScroll: true });
    }
    onIndexChange(getAdjacentReelIndex(index, direction, clips.length));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.pointerType === "mouse") return;
    if (!event.isPrimary) {
      clearPointer();
      return;
    }
    suppressClickRef.current = false;
    const target = event.target instanceof Element ? event.target : event.currentTarget;
    const gestureSurface = target.closest("[data-reel-gesture]");
    if (!gestureSurface && target.closest("button, a, input, select, textarea")) return;
    const captureTarget = gestureSurface ?? event.currentTarget;
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      target: captureTarget,
    };
    captureTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const deltaX = event.clientX - pointer.x;
    const deltaY = event.clientY - pointer.y;
    const direction = getReelSwipeDirection(deltaX, deltaY);
    clearPointer();
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) <= 12) return;
    suppressClickRef.current = true;
    if (direction) navigate(direction);
    requestAnimationFrame(() => {
      suppressClickRef.current = false;
    });
  }

  if (!clip) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={hintId}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key)) {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1);
        }
      }}
      className="m-auto h-dvh max-h-none w-screen max-w-none overflow-hidden bg-ink p-0 text-white backdrop:bg-ink/85 sm:h-[min(94dvh,58rem)] sm:w-[min(calc(100vw-2rem),34rem)] sm:rounded-lg"
    >
      <div
        className="grid h-full min-h-0 touch-pinch-zoom grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={clearPointer}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          suppressClickRef.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <h3 id={titleId} className="truncate text-sm font-semibold text-white">
              {clip.title}
            </h3>
            <p id={hintId} className="mt-1 text-xs text-white/75">
              {index + 1} / {clips.length}
              {clips.length > 1 ? (
                <span>
                  {clip.platform === "tiktok"
                    ? " · Swipe center ↑↓ or ←→"
                    : " · Use arrows to change video"}
                </span>
              ) : null}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            aria-label="Close video"
            className={controlClass}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="grid min-h-0 min-w-0 place-items-center overflow-hidden bg-black [container-type:size]">
          <div className="relative h-[min(100cqh,177.7778cqw)] w-[min(100cqw,56.25cqh)] overflow-hidden">
            {clip.platform === "tiktok" && clip.embedSrc ? (
              <TikTokReelPlayer key={clip.id} src={clip.embedSrc} title={clip.title} />
            ) : (
              <div className="h-full overflow-hidden bg-white text-ink">{children}</div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/15 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={clips.length < 2}
            aria-label="Previous video"
            className={controlClass}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <a
            href={clip.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 px-2 text-center text-xs font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
          >
            Watch on {clip.platform === "tiktok" ? "TikTok" : "Instagram"}
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </a>
          <button
            type="button"
            onClick={() => navigate(1)}
            disabled={clips.length < 2}
            aria-label="Next video"
            className={controlClass}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </footer>
      </div>
    </dialog>
  );
}
