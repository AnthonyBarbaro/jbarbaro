import assert from "node:assert/strict";
import test from "node:test";

import { appointmentLocations } from "@/data/locations";
import {
  getRequestableAppointmentSlots,
  getStoreDateAndMinutes,
  parseAppointmentDate,
} from "@/lib/appointments/time";

test("appointment dates reject rollover and accept leap days", () => {
  for (const value of [
    "2026-02-29",
    "2026-02-30",
    "2026-04-31",
    "2026-13-01",
    "2026-00-01",
    "2026-01-00",
    "2026-1-01",
    "invalid",
  ]) {
    assert.equal(parseAppointmentDate(value), null, value);
  }
  assert.ok(parseAppointmentDate("2028-02-29"));
});

test("store clock observes Detroit date, midnight and daylight saving time", () => {
  assert.deepEqual(getStoreDateAndMinutes(new Date("2026-01-02T04:59:00Z")), {
    date: "2026-01-01",
    minutes: 1439,
  });
  assert.deepEqual(getStoreDateAndMinutes(new Date("2026-01-02T05:00:00Z")), {
    date: "2026-01-02",
    minutes: 0,
  });
  assert.deepEqual(getStoreDateAndMinutes(new Date("2026-07-02T04:00:00Z")), {
    date: "2026-07-02",
    minutes: 0,
  });
  assert.deepEqual(getStoreDateAndMinutes(new Date("2026-03-08T07:00:00Z")), {
    date: "2026-03-08",
    minutes: 180,
  });
});

test("requests exclude past days, started slots and holiday closures", () => {
  const location = appointmentLocations[0];
  const now = new Date("2026-10-08T16:00:00Z"); // Noon in Detroit.
  assert.deepEqual(getRequestableAppointmentSlots(location, "2026-10-07", now), []);
  assert.deepEqual(getRequestableAppointmentSlots(location, "2026-12-25", now), []);
  const slots = getRequestableAppointmentSlots(location, "2026-10-08", now);
  assert.ok(slots.length > 0);
  assert.ok(!slots.some((slot) => slot.startsWith("12:00 PM")));
  assert.ok(slots.some((slot) => slot.startsWith("12:30 PM")));
  assert.ok(getRequestableAppointmentSlots(location, "2026-10-09", now).length > slots.length);
});
