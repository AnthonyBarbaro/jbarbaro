import { getAvailableTimeSlots } from "@/lib/hours";
import type { Location } from "@/types/site";

export const APPOINTMENT_TIME_ZONE = "America/Detroit";

export function parseAppointmentDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10))
    ? date
    : null;
}

export function getStoreDateAndMinutes(now = new Date()): { date: string; minutes: number } {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: APPOINTMENT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

export function getRequestableAppointmentSlots(
  location: Location,
  dateKey: string,
  now = new Date(),
): string[] {
  const date = parseAppointmentDate(dateKey);
  const current = getStoreDateAndMinutes(now);
  if (!date || dateKey < current.date) return [];
  return getAvailableTimeSlots(location, date).filter((slot) => {
    if (dateKey !== current.date) return true;
    const match = slot.match(/^(\d{1,2}):(\d{2}) (AM|PM)/);
    if (!match) return false;
    const hours = (Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0);
    return hours * 60 + Number(match[2]) > current.minutes;
  });
}
