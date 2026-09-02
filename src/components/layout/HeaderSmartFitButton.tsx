"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { FieldLabel, Input, Select } from "@/components/ui/Field";
import {
  buildFitProfile,
  FIT_PROFILE_STORAGE_KEY,
  isSmartFitPreferenceEnabled,
  parseFitProfile,
  SMART_FIT_ENABLED_STORAGE_KEY,
  type FitBuild,
  type FitProfile,
} from "@/lib/fit-profile";

type FitDraft = {
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
  build: FitBuild | "";
};

const EMPTY_DRAFT: FitDraft = {
  heightFeet: "",
  heightInches: "",
  weightLbs: "",
  build: "",
};

const BUILD_OPTIONS: Array<{ label: string; value: FitBuild }> = [
  { label: "Slim", value: "slim" },
  { label: "Average", value: "average" },
  { label: "Athletic", value: "athletic" },
  { label: "Broad", value: "broad" },
  { label: "Full", value: "full" },
];

function draftFromProfile(profile: FitProfile): FitDraft {
  return {
    heightFeet: profile.heightFeet ? String(profile.heightFeet) : "",
    heightInches:
      typeof profile.heightInches === "number" ? String(profile.heightInches) : "",
    weightLbs: profile.weightLbs ? String(profile.weightLbs) : "",
    build: profile.build ?? "",
  };
}

export function HeaderSmartFitButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [profile, setProfile] = useState<FitProfile | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [draft, setDraft] = useState<FitDraft>(EMPTY_DRAFT);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const storedProfile = parseFitProfile(window.localStorage.getItem(FIT_PROFILE_STORAGE_KEY));
    const storedEnabled = isSmartFitPreferenceEnabled(
      window.localStorage.getItem(SMART_FIT_ENABLED_STORAGE_KEY),
    );
    const frameId = window.requestAnimationFrame(() => {
      setIsEnabled(storedEnabled);
      setProfile(storedProfile);
      if (storedProfile) {
        setDraft(draftFromProfile(storedProfile));
        setIsEditing(false);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const frameId = window.requestAnimationFrame(() => panelRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
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

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen]);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextProfile = buildFitProfile({
      heightFeet: Number(draft.heightFeet),
      heightInches: Number(draft.heightInches),
      weightLbs: Number(draft.weightLbs),
      build: draft.build || undefined,
      knownSuitSize: profile?.knownSuitSize,
      knownTopSize: profile?.knownTopSize,
      knownDressShirtSize: profile?.knownDressShirtSize,
      knownWaistSize: profile?.knownWaistSize,
      shoeSize: profile?.shoeSize,
    });

    window.localStorage.setItem(FIT_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setIsEditing(false);
  }

  function openSmartFit() {
    setIsOpen(true);
  }

  function toggleSmartFit() {
    const nextEnabled = !isEnabled;
    window.localStorage.setItem(SMART_FIT_ENABLED_STORAGE_KEY, String(nextEnabled));
    setIsEnabled(nextEnabled);
  }

  const hasCompleteDraft = Boolean(
    draft.heightFeet && draft.heightInches && draft.weightLbs && draft.build,
  );

  return (
    <>
      <button
        type="button"
        onClick={openSmartFit}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-deep-teal/20 bg-deep-teal/8 text-deep-teal transition-colors hover:bg-deep-teal/12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/20 lg:hidden"
        aria-label="Open Smart Fit"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Sparkles className="h-[18px] w-[18px]" aria-hidden />
        {profile && isEnabled ? (
          <span
            className="absolute top-1 right-1 h-2 w-2 rounded-full border border-white bg-deep-teal"
            aria-hidden
          />
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[190] lg:hidden" role="presentation">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="smart-fit-backdrop absolute inset-0 bg-ink/45 backdrop-blur-[6px]"
            aria-label="Close Smart Fit"
          />
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="header-smart-fit-title"
            tabIndex={-1}
            className="smart-fit-sheet absolute inset-x-0 top-0 flex max-h-[min(45rem,94dvh)] flex-col overflow-hidden rounded-b-2xl border-b border-white/70 bg-white shadow-[0_28px_80px_-26px_rgba(11,15,20,0.75)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-deep-teal/10 text-deep-teal">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-[0.12em] text-deep-teal uppercase">
                    Smart Fit
                  </p>
                  <h2 id="header-smart-fit-title" className="text-lg font-semibold text-ink">
                    Find your starting size
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/20"
                aria-label="Close Smart Fit"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="mb-5 flex items-center justify-between gap-4 rounded-lg bg-stone px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Smart Fit recommendations</p>
                  <p className="mt-0.5 text-xs leading-5 text-smoke">
                    Automatically match products to your saved sizes.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={toggleSmartFit}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/20 ${
                    isEnabled ? "bg-deep-teal" : "bg-ink/20"
                  }`}
                  aria-label="Smart Fit recommendations"
                >
                  <span
                    className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {profile && !isEditing ? (
                <div>
                  <p className="text-sm leading-6 text-smoke">
                    Your profile is ready. We&apos;ll match these starting sizes against available
                    products while you shop.
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Suit", profile.estimate.suit],
                      ["Top", profile.estimate.alpha],
                      ["Waist", profile.estimate.waist],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-stone px-2 py-3">
                        <p className="text-xs font-semibold text-smoke">{label}</p>
                        <p className="mt-1 text-base font-bold text-ink">{value}</p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/shop?fit=1"
                    onClick={() => {
                      window.localStorage.setItem(SMART_FIT_ENABLED_STORAGE_KEY, "true");
                      setIsEnabled(true);
                      setIsOpen(false);
                    }}
                    className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 text-sm font-semibold tracking-[0.08em] text-white uppercase focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Shop my fit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-deep-teal"
                  >
                    Update measurements
                  </button>
                </div>
              ) : (
                <form onSubmit={saveProfile}>
                  <p className="text-sm leading-6 text-smoke">
                    Four quick answers create a private fit profile saved only in this browser.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="header-fit-feet">Height (feet)</FieldLabel>
                      <Select
                        id="header-fit-feet"
                        value={draft.heightFeet}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, heightFeet: event.target.value }))
                        }
                        required
                      >
                        <option value="">Feet</option>
                        {[4, 5, 6, 7].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <FieldLabel htmlFor="header-fit-inches">Inches</FieldLabel>
                      <Select
                        id="header-fit-inches"
                        value={draft.heightInches}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, heightInches: event.target.value }))
                        }
                        required
                      >
                        <option value="">Inches</option>
                        {Array.from({ length: 12 }, (_, value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <FieldLabel htmlFor="header-fit-weight">Weight (lb)</FieldLabel>
                      <Input
                        id="header-fit-weight"
                        type="number"
                        inputMode="numeric"
                        min={95}
                        max={340}
                        value={draft.weightLbs}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, weightLbs: event.target.value }))
                        }
                        placeholder="For example, 180"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel htmlFor="header-fit-build">Build</FieldLabel>
                      <Select
                        id="header-fit-build"
                        value={draft.build}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            build: event.target.value as FitBuild | "",
                          }))
                        }
                        required
                      >
                        <option value="">Select your build</option>
                        {BUILD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!hasCompleteDraft}
                    className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 text-sm font-semibold tracking-[0.08em] text-white uppercase transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30 disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-smoke"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Show my sizes
                  </button>
                  {profile ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-smoke"
                    >
                      Cancel changes
                    </button>
                  ) : null}
                </form>
              )}
              <p className="mt-4 text-xs leading-5 text-smoke">
                Smart Fit is a starting estimate. Brand fit and tailoring can vary by garment.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
