"use client";

import { CalendarClock, CheckCircle2, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  | { status: "error"; message: string };

type QuickDate = {
  value: string;
  weekday: string;
  label: string;
};

const INPUT_CLASS =
  "w-full rounded-2xl border border-ink/12 bg-white/90 px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-smoke/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus:outline-none focus:ring-4 focus:ring-deep-teal/20";

function toIsoDate(date: Date) {
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

function formatSelectedDate(dateValue: string) {
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

  const [locationSlug, setLocationSlug] = useState(locations[0]?.slug || "");
  const [serviceType, setServiceType] = useState(services[0] || "");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeWindow, setPreferredTimeWindow] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotStatus, setSlotStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [slotMessage, setSlotMessage] = useState("");
  const [slotRefreshKey, setSlotRefreshKey] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

  const selectedLocation = locations.find((location) => location.slug === locationSlug);
  const selectedDateLabel = formatSelectedDate(preferredDate);
  const submissionFeedback =
    submission.status === "success" || submission.status === "error" ? submission.message : "";
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    preferredDate.trim().length > 0 &&
    preferredTimeWindow.trim().length > 0 &&
    submission.status !== "loading";

  useEffect(() => {
    if (!locationSlug || !preferredDate) {
      setTimeSlots([]);
      setSlotStatus("idle");
      setSlotMessage("");
      setPreferredTimeWindow("");
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
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
          throw new Error(payload.message || "Unable to check availability.");
        }

        if (cancelled) {
          return;
        }

        const slots = Array.isArray(payload.availableSlots) ? payload.availableSlots : [];
        setTimeSlots(slots);
        setPreferredTimeWindow((current) => (slots.includes(current) ? current : ""));
        setSlotStatus("ready");
        setSlotMessage(slots.length === 0 ? payload.message || "No appointment times are available for this date." : "");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTimeSlots([]);
        setPreferredTimeWindow("");
        setSlotStatus("error");
        setSlotMessage(error instanceof Error ? error.message : "Unable to check availability.");
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [locationSlug, preferredDate, slotRefreshKey]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setSubmission({
        status: "error",
        message: "Please complete all required fields and choose an available appointment time.",
      });
      return;
    }

    setSubmission({ status: "loading" });

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationSlug,
          serviceType,
          preferredDate,
          preferredTimeWindow,
          name,
          email,
          phone,
          notes,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        appointmentId?: number;
        availableSlots?: string[];
      };

      if (!response.ok) {
        if (response.status === 409 && Array.isArray(payload.availableSlots)) {
          setTimeSlots(payload.availableSlots);
          setPreferredTimeWindow("");
          setSlotStatus("ready");
          setSlotMessage("That time was just booked by another client. Please choose a different slot.");
        }
        throw new Error(payload.message || "Unable to submit appointment request.");
      }

      setSubmission({
        status: "success",
        message: payload.message || `Appointment request submitted. Reference #${payload.appointmentId}.`,
      });
      setPreferredTimeWindow("");
      setNotes("");
      setSlotRefreshKey((value) => value + 1);
    } catch (error) {
      setSubmission({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.97),rgba(231,222,211,0.52))] p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">Showroom</label>
                  <p className="text-xs text-smoke/85">Choose your preferred in-store location.</p>
                </div>
                <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                  Step 1
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {locations.map((location) => {
                  const selected = locationSlug === location.slug;
                  return (
                    <button
                      key={location.slug}
                      type="button"
                      onClick={() => {
                        setLocationSlug(location.slug);
                        setPreferredTimeWindow("");
                      }}
                      className={selected
                        ? "rounded-2xl border border-gold/50 bg-ink px-3 py-3 text-left text-ivory shadow-[0_10px_22px_rgba(15,23,42,0.3)] transition"
                        : "rounded-2xl border border-ink/10 bg-white px-3 py-3 text-left text-smoke transition hover:border-ink/20 hover:text-ink"}
                    >
                      <p className="text-sm font-semibold">{location.name}</p>
                      <p className={selected ? "mt-1 text-xs text-ivory/80" : "mt-1 text-xs text-smoke/85"}>
                        {location.phone}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-ink/10 bg-white/90 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">Service Type</label>
                  <p className="text-xs text-smoke/85">Select what you need during your in-person appointment.</p>
                </div>
                <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                  Step 2
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {services.map((service) => {
                  const selected = serviceType === service;
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => setServiceType(service)}
                      className={selected
                        ? "rounded-2xl border border-gold/45 bg-gold/18 px-3 py-2.5 text-left text-ink transition"
                        : "rounded-2xl border border-ink/10 bg-white px-3 py-2.5 text-left text-smoke transition hover:border-ink/20 hover:text-ink"}
                    >
                      <span className="text-sm font-semibold">{service}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-ink/10 bg-white/90 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">Pick a Date *</label>
                <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                  Step 3
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickDates.map((date) => {
                  const selected = preferredDate === date.value;
                  return (
                    <button
                      key={date.value}
                      type="button"
                      onClick={() => {
                        setPreferredDate(date.value);
                        setPreferredTimeWindow("");
                      }}
                      className={selected
                        ? "rounded-2xl border border-deep-teal/45 bg-deep-teal px-3 py-2 text-left text-ivory transition"
                        : "rounded-2xl border border-ink/10 bg-white px-3 py-2 text-left text-smoke transition hover:border-ink/20 hover:text-ink"}
                    >
                      <div className="text-[11px] font-semibold tracking-[0.08em] uppercase">{date.weekday}</div>
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
                  <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">Pick a Time *</label>
                  <p className="text-xs text-smoke/85">Live slot availability for in-store appointments.</p>
                </div>
                <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                  Step 4
                </span>
              </div>

              {!preferredDate ? (
                <p className="text-xs text-smoke">Choose a date first to load available times.</p>
              ) : null}

              {slotStatus === "loading" ? (
                <p className="text-xs text-smoke">Checking availability...</p>
              ) : null}

              {preferredDate && slotStatus !== "loading" ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {timeSlots.map((slot) => {
                    const selected = preferredTimeWindow === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setPreferredTimeWindow(slot)}
                        className={selected
                          ? "rounded-2xl border border-deep-teal/45 bg-deep-teal px-3 py-2 text-left text-ivory transition"
                          : "rounded-2xl border border-ink/10 bg-white px-3 py-2 text-left text-smoke transition hover:border-ink/20 hover:text-ink"}
                      >
                        <div className="text-sm font-semibold">{slot}</div>
                        <div className={selected ? "text-xs text-ivory/85" : "text-xs text-smoke/85"}>
                          Local store time
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {slotMessage ? <p className="text-xs text-red-700">{slotMessage}</p> : null}
            </div>

            {selectedDateLabel && preferredTimeWindow ? (
              <div className="rounded-2xl border border-deep-teal/25 bg-deep-teal/8 px-3 py-2.5">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-deep-teal uppercase">Selected In-Store Appointment</p>
                <p className="text-sm font-semibold text-ink">
                  {selectedDateLabel} at {preferredTimeWindow}
                </p>
                <p className="text-xs text-smoke">{selectedLocation?.name || "Selected location"}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-ink/10 bg-white/90 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold tracking-[0.08em] text-smoke uppercase">Contact Details *</label>
                <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-smoke uppercase">
                  Step 5
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={INPUT_CLASS}
                  placeholder="Full Name *"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <input
                  className={INPUT_CLASS}
                  placeholder="Email *"
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
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={
                  submission.status === "error"
                    ? "text-xs text-red-700"
                    : submission.status === "success"
                      ? "text-xs text-deep-teal"
                      : "text-xs text-smoke"
                }
              >
                {submission.status === "idle"
                  ? "Required: location, service, date, time, name, email, and phone."
                  : submissionFeedback}
              </p>
              <Button type="submit" disabled={!canSubmit}>
                {submission.status === "loading" ? "Submitting..." : "Request In-Store Appointment"}
              </Button>
            </div>
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
                Dedicated showroom appointment at your selected location.
              </li>
              <li className="flex items-start gap-2">
                <CalendarClock className="mt-1 h-4 w-4 text-deep-teal" />
                Live times reflect real availability to avoid overlap.
              </li>
              <li className="flex items-start gap-2">
                <Clock3 className="mt-1 h-4 w-4 text-deep-teal" />
                30-minute scheduling blocks for focused fit and styling.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 text-deep-teal" />
                Confirmation email includes add-to-calendar links and invite file.
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
              Choose the closest service now. Our team can adjust details when confirming your appointment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
