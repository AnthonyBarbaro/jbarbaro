import assert from "node:assert/strict";
import test from "node:test";

import { buildAppointmentCalendarArtifacts } from "@/lib/calendar";
import type { AppointmentSubmissionPayload } from "@/types/submissions";

function appointment(date: string, notes = ""): AppointmentSubmissionPayload {
  return {
    reference: "APT-calendar-test",
    submittedAt: new Date("2026-10-08T12:00:00Z"),
    locationSlug: "partridge-creek",
    serviceType: "Personal Styling",
    preferredDate: new Date(`${date}T00:00:00`),
    preferredTimeWindow: "10:00 AM - 10:30 AM",
    name: "Test Client",
    email: "client@example.test",
    phone: "586-555-0123",
    notes,
  };
}

test("calendar links resolve store time to a UTC instant across seasons and server time zones", () => {
  const previousTimeZone = process.env.TZ;
  const cases = [
    { date: "2026-01-12", start: "2026-01-12T15:00:00.000Z" },
    { date: "2026-07-12", start: "2026-07-12T14:00:00.000Z" },
    { date: "2026-03-08", start: "2026-03-08T14:00:00.000Z" },
    { date: "2026-11-01", start: "2026-11-01T15:00:00.000Z" },
  ];

  try {
    for (const timeZone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = timeZone;

      for (const entry of cases) {
        const calendar = buildAppointmentCalendarArtifacts(appointment(entry.date));
        const outlook = new URL(calendar.outlookCalendarUrl);
        const google = new URL(calendar.googleCalendarUrl);
        assert.equal(
          outlook.searchParams.get("startdt"),
          entry.start,
          `${timeZone}: ${entry.date}`,
        );
        assert.equal(
          outlook.searchParams.get("enddt"),
          entry.start.replace("00:00.000Z", "30:00.000Z"),
        );
        assert.match(outlook.searchParams.get("body") || "", /America\/Detroit/);
        assert.equal(google.searchParams.get("ctz"), "America/Detroit");
        const compactDate = entry.date.replaceAll("-", "");
        assert.equal(
          google.searchParams.get("dates"),
          `${compactDate}T100000/${compactDate}T103000`,
        );
        assert.match(
          calendar.icsContent,
          new RegExp(`DTSTART;TZID=America/Detroit:${compactDate}T100000`),
        );
      }
    }
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
});

test("calendar text cannot inject properties through CR, LF, CRLF or escaped separators", () => {
  const calendar = buildAppointmentCalendarArtifacts(
    appointment(
      "2026-10-12",
      "First\rATTENDEE:mailto:attacker@example.test\nNext\r\nFinal, semicolon; backslash\\",
    ),
  );
  const lines = calendar.icsContent.split("\r\n");
  const description = lines.find((line) => line.startsWith("DESCRIPTION:"));
  assert.ok(description);
  assert.match(
    description,
    /First\\nATTENDEE:mailto:attacker@example\.test\\nNext\\nFinal\\, semicolon\\; backslash\\\\/,
  );
  assert.equal(lines.filter((line) => line.startsWith("ATTENDEE:")).length, 0);
  assert.doesNotMatch(description, /[\r\n]/);
  assert.equal(lines.filter((line) => line === "BEGIN:VEVENT").length, 1);
  assert.equal(lines.filter((line) => line === "END:VEVENT").length, 1);
});

test("calendar conversion rejects invalid clock times and nonexistent daylight-saving times", () => {
  for (const preferredTimeWindow of ["13:00 AM", "0:30 PM", "10:60 AM", "invalid"]) {
    assert.throws(
      () =>
        buildAppointmentCalendarArtifacts({ ...appointment("2026-10-12"), preferredTimeWindow }),
      /Unable to parse appointment start time/,
    );
  }

  assert.throws(
    () =>
      buildAppointmentCalendarArtifacts({
        ...appointment("2026-03-08"),
        preferredTimeWindow: "2:30 AM - 3:00 AM",
      }),
    /does not exist in the store time zone/,
  );
});

test("calendar invitations preserve stable identifiers and default thirty-minute duration", () => {
  const data = { ...appointment("2026-10-12"), preferredTimeWindow: "12:00 PM" };
  const first = buildAppointmentCalendarArtifacts(data);
  const second = buildAppointmentCalendarArtifacts(data);
  const outlook = new URL(first.outlookCalendarUrl);
  assert.equal(outlook.searchParams.get("startdt"), "2026-10-12T16:00:00.000Z");
  assert.equal(outlook.searchParams.get("enddt"), "2026-10-12T16:30:00.000Z");
  assert.equal(
    first.icsContent.split("\r\n").find((line) => line.startsWith("UID:")),
    second.icsContent.split("\r\n").find((line) => line.startsWith("UID:")),
  );
});
