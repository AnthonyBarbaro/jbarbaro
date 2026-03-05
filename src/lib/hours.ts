import type { Location } from "@/types/site";

import { isClosedHoliday } from "@/lib/holidays";

const dayToIndex: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function parseTime(value: string) {
  const [time, meridiem] = value.split(" ");
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  let hours = rawHours;

  if (meridiem === "PM" && rawHours !== 12) {
    hours += 12;
  }

  if (meridiem === "AM" && rawHours === 12) {
    hours = 0;
  }

  return hours * 60 + rawMinutes;
}

function formatTime(minutesFromMidnight: number) {
  const hours24 = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

function normalizeDay(day: string) {
  return day.toLowerCase().slice(0, 3);
}

function parseDaysExpression(expression: string) {
  return expression
    .split(",")
    .flatMap((segment) => {
      const trimmed = segment.trim();

      if (trimmed.includes("-")) {
        const [startRaw, endRaw] = trimmed.split("-");
        const start = dayToIndex[normalizeDay(startRaw)];
        const end = dayToIndex[normalizeDay(endRaw)];

        if (start === undefined || end === undefined) {
          return [];
        }

        const result: number[] = [];

        for (let cursor = start; cursor <= end; cursor += 1) {
          result.push(cursor);
        }

        return result;
      }

      const dayIndex = dayToIndex[normalizeDay(trimmed)];
      return dayIndex === undefined ? [] : [dayIndex];
    })
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

function getDatePartsInTimeZone(date: Date, timezoneName: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezoneName,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const map = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

  return {
    dayIndex: dayToIndex[(map.weekday || "sun").toLowerCase().slice(0, 3)] ?? 0,
    minutes: Number(map.hour || "0") * 60 + Number(map.minute || "0"),
    year: Number(map.year || "1970"),
    month: Number(map.month || "1"),
    day: Number(map.day || "1"),
  };
}

export function getHoursForDate(location: Location, date: Date) {
  const dayOfWeek = date.getDay();

  for (const interval of location.hours) {
    const openDays = parseDaysExpression(interval.days);

    if (openDays.includes(dayOfWeek)) {
      return { open: interval.open, close: interval.close };
    }
  }

  return null;
}

export function getAvailableTimeSlots(location: Location, dateInput: string | Date, slotMinutes = 30) {
  const date = typeof dateInput === "string" ? new Date(`${dateInput}T00:00:00`) : dateInput;

  if (Number.isNaN(date.getTime()) || isClosedHoliday(date)) {
    return [];
  }

  const hours = getHoursForDate(location, date);

  if (!hours) {
    return [];
  }

  const openMinutes = parseTime(hours.open);
  const closeMinutes = parseTime(hours.close);
  const slots: string[] = [];

  for (let time = openMinutes; time + slotMinutes <= closeMinutes; time += slotMinutes) {
    slots.push(`${formatTime(time)} - ${formatTime(time + slotMinutes)}`);
  }

  return slots;
}

export function getCurrentOpenStatus(location: Location, date = new Date(), timeZone = "America/Detroit") {
  const parts = getDatePartsInTimeZone(date, timeZone);
  const storeCalendarDate = new Date(parts.year, parts.month - 1, parts.day);

  if (isClosedHoliday(storeCalendarDate)) {
    return {
      isOpen: false,
      label: "Closed for holiday",
    };
  }

  const interval = location.hours.find((item) => parseDaysExpression(item.days).includes(parts.dayIndex));

  if (!interval) {
    return {
      isOpen: false,
      label: "Closed today",
    };
  }

  const openMinutes = parseTime(interval.open);
  const closeMinutes = parseTime(interval.close);
  const isOpen = parts.minutes >= openMinutes && parts.minutes < closeMinutes;

  return {
    isOpen,
    label: isOpen ? `Open until ${interval.close}` : `Opens at ${interval.open}`,
  };
}
