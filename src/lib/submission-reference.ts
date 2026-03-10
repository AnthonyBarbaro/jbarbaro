function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function createSubmissionReference(prefix: string, date = new Date()) {
  const timestamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

  return `${prefix.toUpperCase()}-${timestamp}-${suffix}`;
}
