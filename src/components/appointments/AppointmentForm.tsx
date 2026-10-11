"use client";

import { CalendarClock, CheckCircle2, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { editAppointmentPhone, getEmailSuggestions } from "@/lib/appointments/contact-input";
import type { Location } from "@/types/site";

type AppointmentFormProps = {
  locations: Location[];
  services: string[];
};

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      message: string;
      dateLabel: string;
      timeWindow: string;
      email: string;
    }
  | { status: "error"; message: string; retryAllowed: boolean };

type QuickDate = {
  value: string;
  weekday: string;
  label: string;
};

const INPUT_CLASS =
  "w-full min-w-0 rounded-md border border-ink/20 bg-white px-3.5 py-3 text-base text-ink " +
  "placeholder:text-smoke focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20";

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUpcomingDates(days = 8): QuickDate[] {
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      value: toIsoDate(date),
      weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
    };
  });
}

function formatSelectedDate(dateValue: string): string {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function AppointmentForm({ locations, services }: AppointmentFormProps) {
  const quickDates = useMemo(() => getUpcomingDates(8), []);
  const selectedLocation = locations[0];
  const locationSlug = selectedLocation?.slug ?? "";
  const [quickDateAvailability, setQuickDateAvailability] = useState<
    Record<string, boolean | null>
  >({});
  const availableQuickDates = quickDates.filter(
    (date) => quickDateAvailability[date.value] === true,
  );

  const [serviceType, setServiceType] = useState(services[0] || "");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeWindow, setPreferredTimeWindow] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotStatus, setSlotStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [slotMessage, setSlotMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const submissionInFlight = useRef(false);
  const requestAttempt = useRef<{ id: string; fields: string } | null>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const confirmationRef = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const emailSuggestions = getEmailSuggestions(email);

  const selectedDateLabel = formatSelectedDate(preferredDate);
  const submissionFeedback =
    submission.status === "success" || submission.status === "error" ? submission.message : "";
  const submissionBlocked =
    submission.status === "loading" ||
    submission.status === "success" ||
    (submission.status === "error" && !submission.retryAllowed);
  const canSubmit =
    locationSlug.length > 0 &&
    serviceType.trim().length > 0 &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    preferredDate.trim().length > 0 &&
    preferredTimeWindow.trim().length > 0 &&
    slotStatus === "ready" &&
    timeSlots.includes(preferredTimeWindow) &&
    !submissionBlocked;

  useEffect(() => {
    if (!locationSlug) return;
    const controller = new AbortController();
    let refreshing = false;

    async function refreshQuickDates(): Promise<void> {
      if (refreshing) return;
      refreshing = true;
      const results = await Promise.allSettled(
        quickDates.map(async (date) => {
          const query = new URLSearchParams({ locationSlug, date: date.value });
          const response = await fetch(`/api/appointments?${query}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          const payload = (await response.json()) as { availableSlots?: string[] };
          if (!response.ok || !Array.isArray(payload.availableSlots)) {
            throw new Error("Unable to check date availability.");
          }
          return payload.availableSlots.length > 0;
        }),
      );
      if (!controller.signal.aborted) {
        setQuickDateAvailability(
          Object.fromEntries(
            results.map((result, index) => [
              quickDates[index].value,
              result.status === "fulfilled" ? result.value : null,
            ]),
          ),
        );
      }
      refreshing = false;
    }

    void refreshQuickDates();
    const interval = window.setInterval(refreshQuickDates, 60_000);
    window.addEventListener("focus", refreshQuickDates);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshQuickDates);
    };
  }, [locationSlug, quickDates]);

  useEffect(() => {
    if (submission.status === "success") {
      confirmationRef.current?.showModal();
    } else if (submission.status === "error") {
      feedbackRef.current?.focus();
    }
  }, [submission.status]);

  useEffect(() => {
    if (!locationSlug || !preferredDate) {
      setTimeSlots([]);
      setSlotStatus("idle");
      setSlotMessage("");
      setPreferredTimeWindow("");
      return;
    }

    let cancelled = false;

    async function loadPreferredTimes() {
      setSlotStatus("loading");
      setSlotMessage("");

      try {
        const query = new URLSearchParams({
          locationSlug,
          date: preferredDate,
        });
        const response = await fetch(`/api/appointments?${query.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          availableSlots?: string[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.message || "Unable to load preferred times. Choose another date.",
          );
        }

        if (cancelled) {
          return;
        }

        const slots = Array.isArray(payload.availableSlots) ? payload.availableSlots : [];
        setQuickDateAvailability((current) => ({ ...current, [preferredDate]: slots.length > 0 }));
        setTimeSlots(slots);
        setPreferredTimeWindow((current) => (slots.includes(current) ? current : ""));
        setSlotStatus("ready");
        setSlotMessage(
          slots.length === 0
            ? payload.message ||
                "No preferred times can be requested on this date. Choose another date."
            : "",
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTimeSlots([]);
        setPreferredTimeWindow("");
        setSlotStatus("error");
        setSlotMessage(error instanceof Error ? error.message : "Unable to load preferred times.");
      }
    }

    loadPreferredTimes();

    return () => {
      cancelled = true;
    };
  }, [locationSlug, preferredDate]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submissionInFlight.current || submissionBlocked) {
      return;
    }

    if (!canSubmit) {
      setSubmission({
        status: "error",
        message: "Please complete all required fields and choose your preferred appointment time.",
        retryAllowed: true,
      });
      return;
    }

    submissionInFlight.current = true;
    setSubmission({ status: "loading" });

    try {
      const fields = {
        locationSlug,
        serviceType,
        preferredDate,
        preferredTimeWindow,
        name,
        email,
        phone,
        notes,
        website,
      };
      const serializedFields = JSON.stringify(fields);
      if (requestAttempt.current?.fields !== serializedFields) {
        requestAttempt.current = { id: crypto.randomUUID(), fields: serializedFields };
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...fields,
          requestId: requestAttempt.current.id,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        reference?: string;
        received?: boolean;
        status?: string;
        retryAllowed?: boolean;
        availableSlots?: string[];
      };

      if (!response.ok) {
        if (Array.isArray(payload.availableSlots)) {
          setTimeSlots(payload.availableSlots);
          setPreferredTimeWindow("");
          setSlotStatus("ready");
          setSlotMessage("Please choose another preferred appointment time.");
        }
        const retryAllowed =
          payload.retryAllowed === true ||
          (payload.retryAllowed !== false && [400, 409, 422, 429].includes(response.status));
        setSubmission({
          status: "error",
          message:
            payload.message ||
            (retryAllowed
              ? "Your request was not sent. Please check your details and try again."
              : "We could not confirm receipt of your request. Please call the showroom before resubmitting."),
          retryAllowed,
        });
        return;
      }

      if (
        payload.received !== true ||
        payload.status !== "pending" ||
        typeof payload.reference !== "string" ||
        !payload.reference.trim()
      ) {
        throw new Error(
          "We could not confirm receipt of your request. Please call the showroom before resubmitting.",
        );
      }

      setSubmission({
        status: "success",
        dateLabel: formatSelectedDate(fields.preferredDate),
        timeWindow: fields.preferredTimeWindow,
        email: fields.email,
        message:
          payload.message ||
          `Request received. Our team will reply to confirm your preferred time or offer another time. Please wait for confirmation before visiting. Reference ${payload.reference}.`,
      });
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setWebsite("");
      setServiceType(services[0] || "");
      setPreferredDate("");
      setPreferredTimeWindow("");
      setTimeSlots([]);
      setSlotStatus("idle");
      setSlotMessage("");
      requestAttempt.current = null;
    } catch {
      setSubmission({
        status: "error",
        message:
          "We could not confirm receipt of your request. Please call the showroom before resubmitting.",
        retryAllowed: false,
      });
    } finally {
      submissionInFlight.current = false;
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <dialog
        ref={confirmationRef}
        aria-labelledby="appointment-received-title"
        aria-describedby="appointment-received-description"
        onClose={() => {
          setSubmission({ status: "idle" });
          feedbackRef.current?.focus();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl bg-ivory p-6 text-ink shadow-xl backdrop:bg-ink/60 sm:p-8"
      >
        <p className="text-sm font-semibold text-deep-teal">Request received</p>
        <h2 id="appointment-received-title" className="mt-3 font-heading text-3xl sm:text-4xl">
          We’ll be in touch to confirm.
        </h2>
        <p id="appointment-received-description" className="mt-4 text-sm leading-7">
          Our team will contact you by email to confirm your preferred appointment time or arrange
          another time. Your appointment is not confirmed yet. Please wait for confirmation before
          visiting.
        </p>
        {submission.status === "success" ? (
          <div className="my-6 border-y border-ink/15 py-4 text-sm leading-6">
            <p className="font-semibold">{submission.dateLabel}</p>
            <p>{submission.timeWindow} (showroom time)</p>
            <p>{selectedLocation?.name}</p>
            <p className="mt-2 break-words">We’ll contact you at {submission.email}.</p>
          </div>
        ) : null}
        <Button variant="teal" className="w-full" onClick={() => confirmationRef.current?.close()}>
          Got it
        </Button>
      </dialog>
      <Card className="min-w-0">
        <CardContent className="p-5 sm:p-8 lg:p-10">
          <form
            onSubmit={onSubmit}
            className="space-y-8"
            aria-busy={submission.status === "loading"}
          >
            <div>
              <h2 className="font-heading text-3xl text-ink sm:text-4xl">Plan your visit</h2>
              <p
                id="appointment-confirmation-note"
                className="mt-3 max-w-xl text-sm leading-6 text-smoke"
              >
                Tell us what you have in mind and choose a preferred time. We’ll contact you by
                email to confirm your appointment before you visit.
              </p>
            </div>
            <fieldset disabled={submissionBlocked} className="min-w-0 space-y-8">
              <legend className="sr-only">Appointment request</legend>
              <div className="hidden" aria-hidden="true">
                <label htmlFor="appointment-website">Website</label>
                <input
                  id="appointment-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>
              <div className="rounded-lg bg-stone p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">
                      Appointment Showroom
                    </p>
                    {selectedLocation ? (
                      <>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {selectedLocation.name}
                        </p>
                        <a
                          href={`tel:${selectedLocation.phone.replace(/[^+\d]/g, "")}`}
                          className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-deep-teal underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                        >
                          {selectedLocation.phone}
                        </a>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-ink">
                        Appointment scheduling is unavailable.
                      </p>
                    )}
                  </div>
                  <span className="rounded-full border border-deep-teal/20 bg-deep-teal/8 px-2.5 py-1 text-xs font-semibold tracking-[0.08em] text-deep-teal uppercase">
                    In Store
                  </span>
                </div>
              </div>

              <div className="space-y-4 border-t border-ink/10 pt-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">How can we help?</h3>
                    <p className="text-sm text-smoke">
                      Select the service that best suits your visit.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {services.map((service) => {
                    const selected = serviceType === service;
                    return (
                      <button
                        key={service}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setServiceType(service)}
                        className={
                          selected
                            ? "flex min-h-14 items-center justify-between gap-3 rounded-lg border border-deep-teal bg-deep-teal/5 px-4 py-3 text-left text-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                            : "flex min-h-14 items-center justify-between gap-3 rounded-lg border border-ink/15 bg-white px-4 py-3 text-left text-ink transition-colors hover:border-deep-teal/60 hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                        }
                      >
                        <span className="text-sm font-medium leading-5">{service}</span>
                        {selected ? (
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 border-t border-ink/10 pt-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-ink">Choose your date</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {availableQuickDates.map((date) => {
                    const selected = preferredDate === date.value;
                    return (
                      <button
                        key={date.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setPreferredDate(date.value);
                          setPreferredTimeWindow("");
                        }}
                        className={
                          selected
                            ? "min-h-14 rounded-lg border border-deep-teal bg-deep-teal px-2 py-3 text-center text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                            : "min-h-14 rounded-lg border border-ink/15 bg-white px-2 py-3 text-center text-ink transition-colors hover:border-deep-teal/60 hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                        }
                      >
                        <div className="text-[11px] font-semibold tracking-[0.08em] uppercase">
                          {date.weekday}
                        </div>
                        <div className="text-sm font-semibold">{date.label}</div>
                      </button>
                    );
                  })}
                </div>
                {availableQuickDates.length === 0 ? (
                  <p role="status" className="text-sm text-smoke">
                    {Object.keys(quickDateAvailability).length === 0
                      ? "Checking available dates…"
                      : Object.values(quickDateAvailability).some((available) => available === null)
                        ? "Unable to check suggested dates. Choose a date below to try again."
                        : "No times are available in the next eight days. Choose a later date below."}
                  </p>
                ) : null}
                <div className="pt-1">
                  <label
                    htmlFor="preferred-date-input"
                    className="mb-2 block text-sm font-medium text-ink"
                  >
                    Or choose another date
                  </label>
                  <input
                    id="preferred-date-input"
                    className={INPUT_CLASS}
                    type="date"
                    value={preferredDate}
                    min={toIsoDate(new Date())}
                    onChange={(event) => {
                      setPreferredDate(event.target.value);
                      setPreferredTimeWindow("");
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-ink/10 pt-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">Choose a preferred time</h3>
                    <p className="text-sm text-smoke">
                      Please request at least one hour ahead. Our team will confirm your time by
                      email.
                    </p>
                  </div>
                </div>

                {!preferredDate ? (
                  <p className="rounded-lg bg-stone px-4 py-5 text-sm text-smoke">
                    Choose a date above to see the showroom’s preferred times.
                  </p>
                ) : null}

                {slotStatus === "loading" ? (
                  <p className="text-xs text-smoke">Loading preferred times...</p>
                ) : null}

                {preferredDate && slotStatus !== "loading" ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {timeSlots.map((slot) => {
                      const selected = preferredTimeWindow === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setPreferredTimeWindow(slot)}
                          className={
                            selected
                              ? "min-h-14 rounded-lg border border-deep-teal bg-deep-teal px-2 py-3 text-center text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                              : "min-h-14 rounded-lg border border-ink/15 bg-white px-2 py-3 text-center text-ink transition-colors hover:border-deep-teal/60 hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                          }
                        >
                          <div className="text-sm font-semibold">{slot}</div>
                          <div
                            className={selected ? "text-xs text-white/85" : "text-sm text-smoke"}
                          >
                            Local store time
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {slotMessage ? <p className="text-xs text-ink">{slotMessage}</p> : null}
              </div>

              {selectedDateLabel && preferredTimeWindow ? (
                <div className="rounded-lg bg-deep-teal/5 p-4 leading-6">
                  <p className="text-[11px] font-semibold tracking-[0.08em] text-deep-teal uppercase">
                    Preferred Appointment · Awaiting Confirmation
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {selectedDateLabel} at {preferredTimeWindow}
                  </p>
                  <p className="text-xs text-smoke">
                    {selectedLocation?.name || "Selected location"}
                  </p>
                </div>
              ) : null}

              <div className="border-t border-ink/10 pt-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-ink">Your details</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block min-w-0 space-y-2 text-sm font-medium text-ink">
                    <span>Full name *</span>
                    <input
                      className={INPUT_CLASS}
                      aria-label="Full name"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </label>
                  <div className="min-w-0">
                    <label className="block min-w-0 space-y-2 text-sm font-medium text-ink">
                      <span>Email address *</span>
                      <input
                        ref={emailRef}
                        className={INPUT_CLASS}
                        aria-label="Email"
                        autoComplete="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </label>
                    {emailSuggestions.length > 0 && !submissionBlocked ? (
                      <div
                        role="group"
                        aria-label="Email domain shortcuts"
                        className="mt-2 flex flex-wrap gap-1.5"
                      >
                        {emailSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            className="min-h-10 rounded-md border border-ink/15 px-2.5 text-xs font-medium text-deep-teal hover:border-deep-teal hover:bg-deep-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                            aria-label={`Use ${suggestion}`}
                            onClick={() => {
                              setEmail(suggestion);
                              emailRef.current?.focus();
                            }}
                          >
                            @{suggestion.split("@")[1]}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3">
                  <label
                    className="mb-2 block text-sm font-medium text-ink"
                    htmlFor="appointment-phone"
                  >
                    Phone number *
                  </label>
                  <input
                    id="appointment-phone"
                    className={INPUT_CLASS}
                    aria-label="Phone"
                    autoComplete="tel"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(event) => {
                      const input = event.currentTarget;
                      const result = editAppointmentPhone(
                        phone,
                        input.value,
                        input.selectionStart ?? input.value.length,
                        (event.nativeEvent as InputEvent).inputType ?? "",
                      );
                      input.value = result.value;
                      input.setSelectionRange(result.caret, result.caret);
                      setPhone(result.value);
                    }}
                    required
                  />
                </div>
                <div className="mt-3">
                  <label
                    className="mb-2 block text-sm font-medium text-ink"
                    htmlFor="appointment-notes"
                  >
                    Anything we should know?{" "}
                    <span className="font-normal text-smoke">(optional)</span>
                  </label>
                  <textarea
                    id="appointment-notes"
                    className={`${INPUT_CLASS} min-h-[100px]`}
                    placeholder="An upcoming event, fit goals, or style preferences…"
                    aria-label="Notes (optional)"
                    maxLength={1000}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-ink/10 pt-6">
                <div className="min-w-0 space-y-2">
                  <p
                    ref={feedbackRef}
                    tabIndex={-1}
                    role={submission.status === "error" ? "alert" : "status"}
                    className={
                      submission.status === "error"
                        ? "text-xs text-ink"
                        : submission.status === "success"
                          ? "text-xs text-deep-teal"
                          : "text-xs text-smoke"
                    }
                  >
                    {submission.status === "idle"
                      ? "Required: service, date, time, name, email, and phone."
                      : submissionFeedback}
                  </p>
                  {submission.status === "error" && !submission.retryAllowed && selectedLocation ? (
                    <a
                      href={`tel:${selectedLocation.phone.replace(/[^+\d]/g, "")}`}
                      className="inline-block text-xs font-semibold text-deep-teal underline underline-offset-2"
                    >
                      Call the showroom: {selectedLocation.phone}
                    </a>
                  ) : null}
                </div>
                <Button
                  type="submit"
                  variant="teal"
                  className="w-full min-h-12"
                  disabled={!canSubmit}
                  aria-describedby="appointment-confirmation-note"
                >
                  {submission.status === "loading"
                    ? "Submitting..."
                    : submission.status === "success"
                      ? "Request Sent"
                      : "Request Appointment"}
                </Button>
              </div>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card tone="stone">
          <CardContent>
            <h2 className="font-heading text-2xl text-ink sm:text-3xl">In-Person Experience</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-smoke">
              <li className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 text-deep-teal" />
                Dedicated showroom appointment at The Mall at Partridge Creek.
              </li>
              <li className="flex items-start gap-2">
                <CalendarClock className="mt-1 h-4 w-4 text-deep-teal" />
                Preferred times follow showroom hours and holiday closures.
              </li>
              <li className="flex items-start gap-2">
                <Clock3 className="mt-1 h-4 w-4 text-deep-teal" />
                30-minute scheduling blocks for focused fit and styling.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 text-deep-teal" />
                Our team will reply by email to confirm your time or offer another time.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-1 h-4 w-4 text-deep-teal" />
                Holiday closures are automatically blocked.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-ink text-ivory">
          <CardContent>
            <h3 className="font-heading text-2xl sm:text-3xl">Need Help Choosing Service?</h3>
            <p className="mt-3 text-sm leading-7 text-ivory/80">
              Choose the closest service now. Our team can adjust details when confirming your
              appointment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
