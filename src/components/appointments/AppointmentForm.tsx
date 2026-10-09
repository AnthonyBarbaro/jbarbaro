"use client";

import { CalendarClock, CheckCircle2, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { Location } from "@/types/site";

type AppointmentFormProps = {
  locations: Location[];
  services: string[];
};

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; retryAllowed: boolean };

type QuickDate = {
  value: string;
  weekday: string;
  label: string;
};

const INPUT_CLASS =
  "w-full rounded-2xl border border-ink/12 bg-white/90 px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-smoke/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus:outline-none focus:ring-4 focus:ring-deep-teal/20";

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
    if (submission.status === "success" || submission.status === "error") {
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
          throw new Error(payload.message || "Unable to load preferred times. Choose another date.");
        }

        if (cancelled) {
          return;
        }

        const slots = Array.isArray(payload.availableSlots) ? payload.availableSlots : [];
        setTimeSlots(slots);
        setPreferredTimeWindow((current) => (slots.includes(current) ? current : ""));
        setSlotStatus("ready");
        setSlotMessage(
          slots.length === 0
            ? payload.message || "No preferred times can be requested on this date. Choose another date."
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
        message:
          payload.message ||
          `Request received. Our team will reply to confirm your preferred time or offer another time. Please wait for confirmation before visiting. Reference ${payload.reference}.`,
      });
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
    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <Card>
        <CardContent>
          <form
            onSubmit={onSubmit}
            className="space-y-4"
            aria-busy={submission.status === "loading"}
          >
            <p id="appointment-confirmation-note" className="text-sm leading-6 text-ink">
              Choose your preferred time. Our team will reply by email to confirm it or offer another
              time. Please wait for confirmation before visiting.
            </p>
            <fieldset disabled={submissionBlocked} className="min-w-0 space-y-4">
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
              <div className="rounded-2xl border border-ink/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.97),rgba(231,222,211,0.52))] p-3 sm:p-4">
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
                        <p className="mt-1 text-xs text-smoke/85">{selectedLocation.phone}</p>
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

              <div className="space-y-2 rounded-2xl border border-ink/10 bg-white/90 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">
                      Service Type
                    </label>
                    <p className="text-xs text-smoke/85">
                      Select what you need during your in-person appointment.
                    </p>
                  </div>
                  <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                    Step 1
                  </span>
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
                            ? "rounded-2xl border border-gold/45 bg-gold/18 px-3 py-2.5 text-left text-ink transition"
                            : "rounded-2xl border border-ink/10 bg-white px-3 py-2.5 text-left text-smoke transition hover:border-ink/20 hover:text-ink"
                        }
                      >
                        <span className="text-sm font-semibold">{service}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-ink/10 bg-white/90 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">
                    Pick a Date *
                  </label>
                  <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                    Step 2
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {quickDates.map((date) => {
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
                            ? "rounded-2xl border border-deep-teal/45 bg-deep-teal px-3 py-2 text-left text-white transition"
                            : "rounded-2xl border border-ink/10 bg-white px-3 py-2 text-left text-smoke transition hover:border-ink/20 hover:text-ink"
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
                <div className="pt-1">
                  <label htmlFor="preferred-date-input" className="mb-1 block text-xs text-smoke">
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

              <div className="space-y-2 rounded-2xl border border-ink/10 bg-white/90 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">
                      Preferred Time *
                    </label>
                    <p className="text-xs text-smoke/85">
                      Our team will confirm your time by email.
                    </p>
                  </div>
                  <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                    Step 3
                  </span>
                </div>

                {!preferredDate ? (
                  <p className="text-xs text-smoke">Choose a date first to see preferred times.</p>
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
                              ? "rounded-2xl border border-deep-teal/45 bg-deep-teal px-3 py-2 text-left text-white transition"
                              : "rounded-2xl border border-ink/10 bg-white px-3 py-2 text-left text-smoke transition hover:border-ink/20 hover:text-ink"
                          }
                        >
                          <div className="text-sm font-semibold">{slot}</div>
                          <div
                            className={selected ? "text-xs text-white/85" : "text-xs text-smoke/85"}
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
                <div className="rounded-2xl border border-deep-teal/25 bg-deep-teal/8 px-3 py-2.5">
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

              <div className="rounded-2xl border border-ink/10 bg-white/90 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">
                    Contact Details *
                  </label>
                  <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                    Step 4
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className={INPUT_CLASS}
                    placeholder="Full Name *"
                    aria-label="Full name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <input
                    className={INPUT_CLASS}
                    placeholder="Email *"
                    aria-label="Email"
                    autoComplete="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="mt-3">
                  <input
                    className={INPUT_CLASS}
                    placeholder="Phone *"
                    aria-label="Phone"
                    autoComplete="tel"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                </div>
                <div className="mt-3">
                  <textarea
                    className={`${INPUT_CLASS} min-h-[100px]`}
                    placeholder="Notes (optional): event details, fit goals, or style preferences"
                    aria-label="Notes (optional)"
                    maxLength={1000}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                  disabled={!canSubmit}
                  aria-describedby="appointment-confirmation-note"
                >
                  {submission.status === "loading"
                    ? "Submitting..."
                    : submission.status === "success"
                      ? "Request Sent"
                      : "Request In-Store Appointment"}
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
