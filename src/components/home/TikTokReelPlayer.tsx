"use client";

import { Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { parseTikTokPlayerEvent } from "@/lib/tiktok-player";

type PlayerCommand = "play" | "pause" | "unMute";
type PlaybackState = "starting" | "buffering" | "playing" | "paused";

const playerOrigin = "https://www.tiktok.com";

function autoplaySource(src: string): string | null {
  try {
    const url = new URL(src);
    if (
      url.origin !== playerOrigin ||
      url.username ||
      url.password ||
      !/^\/player\/v1\/[0-9]+\/?$/.test(url.pathname)
    ) {
      return null;
    }
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("muted", "0");
    return url.href;
  } catch {
    return null;
  }
}

export function TikTokReelPlayer({ src, title }: { src: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const confirmedPlayingRef = useRef(false);
  const playbackIntentRef = useRef(true);
  const initialSoundRequestedRef = useRef(false);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>("starting");
  const [error, setError] = useState<string | null>(null);
  const source = autoplaySource(src);

  const sendCommand = useCallback((type: PlayerCommand): void => {
    iframeRef.current?.contentWindow?.postMessage({ type, "x-tiktok-player": true }, playerOrigin);
  }, []);

  const clearPlaybackTimeout = useCallback((): void => {
    if (playbackTimeoutRef.current !== null) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
  }, []);

  const requestPlayback = useCallback((): void => {
    clearPlaybackTimeout();
    playbackIntentRef.current = true;
    setPlayback("starting");
    setError(null);
    sendCommand("play");
    playbackTimeoutRef.current = setTimeout(() => {
      playbackTimeoutRef.current = null;
      playbackIntentRef.current = false;
      setPlayback("paused");
      setError("Tap Play to start the video.");
    }, 8000);
  }, [clearPlaybackTimeout, sendCommand]);

  useEffect(() => {
    if (!source) return;

    function handleMessage(event: MessageEvent<unknown>): void {
      const message = parseTikTokPlayerEvent(event, iframeRef.current?.contentWindow);
      if (!message) return;

      switch (message.type) {
        case "ready":
          setReady(true);
          if (!initialSoundRequestedRef.current) {
            initialSoundRequestedRef.current = true;
            sendCommand("unMute");
          }
          if (!confirmedPlayingRef.current && playbackIntentRef.current) requestPlayback();
          break;
        case "state":
          if (message.value === 1) {
            clearPlaybackTimeout();
            confirmedPlayingRef.current = true;
            playbackIntentRef.current = true;
            setPlayback("playing");
            setError(null);
          } else if (message.value === 0 || message.value === 2) {
            clearPlaybackTimeout();
            confirmedPlayingRef.current = false;
            playbackIntentRef.current = false;
            setPlayback("paused");
          } else if (message.value === 3) {
            setPlayback(
              confirmedPlayingRef.current
                ? "buffering"
                : playbackIntentRef.current
                  ? "starting"
                  : "paused",
            );
          }
          break;
        case "mute":
          break;
        case "error":
          confirmedPlayingRef.current = false;
          clearPlaybackTimeout();
          playbackIntentRef.current = false;
          setPlayback("paused");
          setError(
            message.code === 3002
              ? "Tap Play to start the video with sound."
              : "Try Play, or use Watch on TikTok below.",
          );
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      clearPlaybackTimeout();
    };
  }, [source, requestPlayback, sendCommand, clearPlaybackTimeout]);

  function togglePlayback(): void {
    if (confirmedPlayingRef.current) {
      clearPlaybackTimeout();
      confirmedPlayingRef.current = false;
      playbackIntentRef.current = false;
      setPlayback("paused");
      setError(null);
      sendCommand("pause");
    } else {
      requestPlayback();
    }
  }

  const showPlay = playback === "paused";
  const isPlaying = playback === "playing" || playback === "buffering";

  return (
    <div className="relative h-full w-full bg-black">
      {source ? (
        <iframe
          ref={iframeRef}
          src={source}
          title={title}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <p role="status" className="p-4 text-center text-sm text-white">
          This video couldn’t load. Use Watch on TikTok below.
        </p>
      )}
      {ready ? (
        <button
          type="button"
          data-reel-gesture="true"
          aria-label={isPlaying ? "Pause video" : "Play video"}
          onClick={togglePlayback}
          className="absolute top-[20%] right-[22%] bottom-[20%] left-0 flex touch-none cursor-pointer flex-col items-center justify-center gap-3 border-0 bg-transparent text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
        >
          {showPlay ? (
            <>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink">
                <Play className="ml-1 h-6 w-6 fill-current" aria-hidden />
              </span>
              <span className="rounded bg-black/80 px-3 py-2 text-sm font-semibold">
                Play video
              </span>
            </>
          ) : null}
          {error ? (
            <span role="status" className="max-w-52 rounded bg-black/85 px-3 py-2 text-xs">
              {error}
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
