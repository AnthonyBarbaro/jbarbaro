import type { Appointment } from "@prisma/client";
import { format } from "date-fns";

import { getLocationMap } from "@/lib/cms";
import { SITE_NAME } from "@/lib/constants";

const STORE_TIME_ZONE = "America/Detroit";
const SLOT_DURATION_MINUTES = 30;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseTimeLabel(label: string) {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const hoursRaw = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  let hours = hoursRaw;

  if (meridiem === "PM" && hoursRaw !== 12) {
    hours += 12;
  }

  if (meridiem === "AM" && hoursRaw === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

function addMinutes(hours: number, minutes: number, amount: number) {
  const total = hours * 60 + minutes + amount;
  return {
    hours: Math.floor(total / 60),
    minutes: total % 60,
  };
}

function toCompactDateTime(dateKey: string, hours: number, minutes: number) {
  const [year, month, day] = dateKey.split("-");
  return `${year}${month}${day}T${pad(hours)}${pad(minutes)}00`;
}

function toIsoLocalDateTime(dateKey: string, hours: number, minutes: number) {
  return `${dateKey}T${pad(hours)}:${pad(minutes)}:00`;
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export async function buildAppointmentCalendarArtifacts(appointment: Appointment) {
  const locationMap = await getLocationMap();
  const location = locationMap[appointment.locationSlug];
  const dateKey = format(appointment.preferredDate, "yyyy-MM-dd");
  const [startLabelRaw = "", endLabelRaw = ""] = appointment.preferredTimeWindow
    .split("-")
    .map((label) => label.trim());
  const parsedStart = parseTimeLabel(startLabelRaw);
  const parsedEnd = parseTimeLabel(endLabelRaw);

  if (!parsedStart) {
    throw new Error("Unable to parse appointment start time.");
  }

  const computedEnd = parsedEnd
    ? parsedEnd
    : addMinutes(parsedStart.hours, parsedStart.minutes, SLOT_DURATION_MINUTES);

  const startCompact = toCompactDateTime(dateKey, parsedStart.hours, parsedStart.minutes);
  const endCompact = toCompactDateTime(dateKey, computedEnd.hours, computedEnd.minutes);
  const startIso = toIsoLocalDateTime(dateKey, parsedStart.hours, parsedStart.minutes);
  const endIso = toIsoLocalDateTime(dateKey, computedEnd.hours, computedEnd.minutes);
  const address = location?.address || "J. Barbaro Clothiers";
  const title = `${SITE_NAME} Appointment`;
  const notes = appointment.notes?.trim() ? `\n\nNotes: ${appointment.notes.trim()}` : "";

  const description = `Service: ${appointment.serviceType}\nLocation: ${location?.name || appointment.locationSlug}\nTime: ${appointment.preferredTimeWindow}${notes}`;

  const googleCalendarUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${encodeURIComponent(`${startCompact}/${endCompact}`)}` +
    `&details=${encodeURIComponent(description)}` +
    `&location=${encodeURIComponent(address)}` +
    `&ctz=${encodeURIComponent(STORE_TIME_ZONE)}`;

  const outlookCalendarUrl =
    "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose" +
    `&subject=${encodeURIComponent(title)}` +
    `&startdt=${encodeURIComponent(startIso)}` +
    `&enddt=${encodeURIComponent(endIso)}` +
    `&body=${encodeURIComponent(description)}` +
    `&location=${encodeURIComponent(address)}`;

  const uid = `appointment-${appointment.id}@jbarbaro.com`;
  const nowStamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JBarbaro//Appointments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;TZID=${STORE_TIME_ZONE}:${startCompact}`,
    `DTEND;TZID=${STORE_TIME_ZONE}:${endCompact}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(address)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return {
    title,
    locationName: location?.name || appointment.locationSlug,
    address,
    dateKey,
    startLabel: startLabelRaw,
    endLabel: endLabelRaw || appointment.preferredTimeWindow,
    googleCalendarUrl,
    outlookCalendarUrl,
    icsContent,
  };
}
