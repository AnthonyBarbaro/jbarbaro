const EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "icloud.com",
  "outlook.com",
  "hotmail.com",
  "aol.com",
];

export function getEmailSuggestions(value: string): string[] {
  const parts = value.trim().split("@");
  const [name, domain = ""] = parts;
  if (!name || /\s/.test(name) || parts.length > 2) return [];
  return EMAIL_DOMAINS.filter(
    (candidate) => candidate.startsWith(domain.toLowerCase()) && candidate !== domain.toLowerCase(),
  ).map((candidate) => `${name}@${candidate}`);
}

export function formatAppointmentPhone(value: string): string {
  const national = value.replace(/\D/g, "").slice(0, 10);
  if (!national) return "";
  const area = `(${national.slice(0, 3)}`;
  const exchange = national.length > 3 ? `) ${national.slice(3, 6)}` : "";
  const subscriber = national.length > 6 ? `-${national.slice(6)}` : "";
  return `${area}${exchange}${subscriber}`;
}

export function editAppointmentPhone(
  previous: string,
  input: string,
  caret: number,
  inputType: string,
): { value: string; caret: number } {
  if (
    inputType === "insertText" &&
    input.length === previous.length + 1 &&
    previous.replace(/\D/g, "").length === 10 &&
    input.replace(/\D/g, "").length > 10
  ) {
    return { value: previous, caret: Math.max(0, caret - (input.length - previous.length)) };
  }
  let raw = input;
  let position = caret;
  if (
    inputType.startsWith("delete") &&
    input !== previous &&
    input.replace(/\D/g, "") === previous.replace(/\D/g, "") &&
    formatAppointmentPhone(input) !== input
  ) {
    // Deleting a separator also removes its adjacent digit so it cannot trap the cursor.
    const backward = inputType === "deleteContentBackward";
    const index = backward
      ? raw.slice(0, position).search(/\d\D*$/)
      : raw.slice(position).search(/\d/);
    if (index >= 0) {
      const target = backward ? index : position + index;
      raw = raw.slice(0, target) + raw.slice(target + 1);
      if (backward) position = target;
    }
  }
  const value = formatAppointmentPhone(raw);
  if (value === raw) return { value, caret: position };
  if (position === raw.length) return { value, caret: value.length };
  const digitsBefore = raw.slice(0, position).replace(/\D/g, "").length;
  let seen = 0;
  let nextCaret = 0;
  while (nextCaret < value.length && seen < digitsBefore) {
    if (/\d/.test(value[nextCaret])) seen++;
    nextCaret++;
  }
  return { value, caret: nextCaret };
}
