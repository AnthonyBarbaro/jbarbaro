import assert from "node:assert/strict";
import test from "node:test";

import {
  editAppointmentPhone,
  formatAppointmentPhone,
  getEmailSuggestions,
} from "@/lib/appointments/contact-input";

test("formats phone numbers and caps typed or pasted input at ten digits", () => {
  for (const input of ["6195362504", "619-536-2504", "(619) 536-2504"]) {
    assert.equal(formatAppointmentPhone(input), "(619) 536-2504");
  }
  for (const input of ["619536250499", "(619) 536-250499", "6195362504 ext 12"]) {
    assert.equal(formatAppointmentPhone(input), "(619) 536-2504");
  }
  assert.equal(formatAppointmentPhone(""), "");
  assert.equal(formatAppointmentPhone("letters"), "");
  assert.deepEqual(editAppointmentPhone("(619) 536-2504", "(619) 536-25049", 15, "insertText"), {
    value: "(619) 536-2504",
    caret: 14,
  });
  assert.deepEqual(editAppointmentPhone("(619) 536-2504", "(619) 9536-2504", 7, "insertText"), {
    value: "(619) 536-2504",
    caret: 6,
  });
  assert.deepEqual(editAppointmentPhone("", "619536250499", 12, "insertFromPaste"), {
    value: "(619) 536-2504",
    caret: 14,
  });
});

test("formats partial phone numbers as they are typed", () => {
  for (const [input, expected] of [
    ["5", "(5"],
    ["555", "(555"],
    ["5555", "(555) 5"],
    ["555555", "(555) 555"],
    ["55555555", "(555) 555-55"],
  ])
    assert.equal(formatAppointmentPhone(input), expected);
});

test("phone editing preserves cursor position and permits deleting separators", () => {
  assert.deepEqual(
    editAppointmentPhone("(555) 555-55", "(555) 555-5", 10, "deleteContentBackward"),
    { value: "(555) 555-5", caret: 10 },
  );
  assert.deepEqual(
    editAppointmentPhone("(555) 555-55", "(555) 55555", 9, "deleteContentBackward"),
    { value: "(555) 555-5", caret: 8 },
  );
  assert.deepEqual(editAppointmentPhone("(555) 555-55", "(555) 55555", 9, "deleteContentForward"), {
    value: "(555) 555-5",
    caret: 9,
  });
  assert.deepEqual(editAppointmentPhone("(5", "(", 1, "deleteContentBackward"), {
    value: "",
    caret: 0,
  });
  assert.deepEqual(editAppointmentPhone("(555) 555-55", "(555) 1555-55", 7, "insertText"), {
    value: "(555) 155-555",
    caret: 7,
  });
});

test("email shortcuts complete a local part or domain prefix without changing custom domains", () => {
  assert.equal(getEmailSuggestions("customer").length, 6);
  assert.ok(getEmailSuggestions("customer@").includes("customer@icloud.com"));
  assert.deepEqual(getEmailSuggestions("customer@G"), ["customer@gmail.com"]);
  assert.deepEqual(getEmailSuggestions(" customer+visit@y "), ["customer+visit@yahoo.com"]);
  for (const input of [
    "",
    "@gmail.com",
    "customer@gmail.com",
    "customer@custom.test",
    "a@b@c",
    "two names",
  ]) {
    assert.deepEqual(getEmailSuggestions(input), []);
  }
});
