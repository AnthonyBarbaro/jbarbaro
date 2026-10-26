import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppointmentForm } from "@/components/appointments/AppointmentForm";

test("appointment controls keep their visible labels as their accessible names", () => {
  const markup = renderToStaticMarkup(
    createElement(AppointmentForm, { locations: [], services: ["Tailoring", "Wedding fitting"] }),
  );

  for (const label of ["Full name", "Email address", "Phone number", "Anything we should know?"]) {
    assert.ok(markup.includes(label));
  }
  for (const input of markup.matchAll(/<(?:input|textarea)\b[^>]*>/g)) {
    assert.doesNotMatch(input[0], /aria-label=/);
  }
  assert.match(markup, /<label\b[^>]*for="appointment-phone"/);
  assert.match(markup, /<input\b[^>]*id="appointment-phone"[^>]*required=""/);
  assert.match(markup, /<label\b[^>]*for="appointment-notes"/);
});

test("appointment options expose named groups and a persistent live region for time updates", () => {
  const markup = renderToStaticMarkup(
    createElement(AppointmentForm, { locations: [], services: ["Tailoring", "Wedding fitting"] }),
  );

  for (const id of ["appointment-service-label", "appointment-date-label"]) {
    assert.match(markup, new RegExp(`<h3\\b[^>]*id="${id}"`));
    assert.match(markup, new RegExp(`role="group" aria-labelledby="${id}"`));
  }
  assert.match(markup, /aria-pressed="true"[^>]*>[\s\S]*?Tailoring/);
  assert.match(markup, /aria-pressed="false"[^>]*>[\s\S]*?Wedding fitting/);
  assert.match(markup, /role="status" aria-atomic="true" class="sr-only"><\/p>/);
});
