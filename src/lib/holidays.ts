function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function getThanksgivingDate(year: number) {
  const novemberFirst = new Date(year, 10, 1);
  const firstThursdayOffset = (4 - novemberFirst.getDay() + 7) % 7;
  const thanksgivingDay = 1 + firstThursdayOffset + 21;

  return new Date(year, 10, thanksgivingDay);
}

export function getEasterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

export function getHolidayClosures(year: number) {
  return {
    easter: getEasterDate(year),
    thanksgiving: getThanksgivingDate(year),
    christmas: new Date(year, 11, 25),
  };
}

export function getHolidayName(date: Date) {
  const { easter, thanksgiving, christmas } = getHolidayClosures(date.getFullYear());

  if (isSameDate(date, easter)) {
    return "Easter";
  }

  if (isSameDate(date, thanksgiving)) {
    return "Thanksgiving";
  }

  if (isSameDate(date, christmas)) {
    return "Christmas Day";
  }

  return null;
}

export function isClosedHoliday(date: Date) {
  return getHolidayName(date) !== null;
}
