import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

import { NextRequest } from "next/server";
import type { SendMailOptions } from "nodemailer";

import { appointmentServices } from "@/data/services";

const NOW = Date.parse("2026-10-08T12:00:00Z");
const REQUEST_ID = "7d17922d-6a3a-4dfe-a848-fd80f45e9b77";

function requestBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    requestId: REQUEST_ID,
    locationSlug: "partridge-creek",
    serviceType: appointmentServices[0],
    preferredDate: "2026-10-12",
    preferredTimeWindow: "10:00 AM - 10:30 AM",
    name: "Synthetic Customer",
    email: "synthetic@example.test",
    phone: "555-010-1234",
    notes: "",
    website: "",
    ...overrides,
  };
}

test("appointment API sends requests for manual staff confirmation and verifies SMTP acceptance", async (context) => {
  const environment = {
    NEXT_PUBLIC_SITE_URL: "https://appointment.example.test",
    SMTP_HOST: "email-smtp.example.test",
    SMTP_PORT: "587",
    SMTP_SECURE: "false",
    SMTP_USER: "fixture-user",
    SMTP_PASS: "fixture-password",
    SMTP_FROM: "Clothier <sender@example.test>",
    SMTP_REPLY_TO: "owner@example.test",
    APPOINTMENT_NOTIFICATION_TO: "owner@example.test",
    CONTACT_NOTIFICATION_TO: "",
  };
  const previous = Object.keys(environment).map((key) => [key, process.env[key]] as const);
  Object.assign(process.env, environment);
  context.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  context.mock.timers.enable({ apis: ["Date"], now: NOW });
  const messages: SendMailOptions[] = [];
  const logged: unknown[][] = [];
  type Outcome = "sent" | "failed" | "unknown" | "partial" | "throw";
  let staffOutcome: Outcome = "sent";
  let customerOutcome: Outcome = "sent";
  let ipSequence = 1;
  const nodemailer = createRequire(`${process.cwd()}/package.json`)("nodemailer") as {
    createTransport: (options: unknown) => unknown;
  };
  context.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (message: SendMailOptions): Promise<unknown> => {
      messages.push(message);
      const recipients = String(message.to).split(",").map((value) => value.trim());
      const outcome = recipients.includes("synthetic@example.test") ? customerOutcome : staffOutcome;
      if (outcome === "throw") throw new Error("SMTP failure synthetic@example.test fixture-password");
      if (outcome === "unknown") return { messageId: "uncertain-fixture" };
      if (outcome === "partial") return { accepted: recipients.slice(0, 1), rejected: recipients.slice(1) };
      return {
        accepted: outcome === "sent" ? recipients : [],
        rejected: outcome === "failed" ? recipients : [],
      };
    },
  }));
  context.mock.method(console, "error", (...args: unknown[]) => logged.push(args));
  const hook = registerHooks({
    resolve(specifier, resolutionContext, nextResolve) {
      return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, resolutionContext);
    },
  });
  const routes = await import("@/app/api/appointments/route").finally(() => hook.deregister());

  function reset(): void {
    messages.length = 0;
    logged.length = 0;
    staffOutcome = "sent";
    customerOutcome = "sent";
  }
  function post(body: unknown, ip = `198.51.100.${ipSequence++}`): NextRequest {
    return new NextRequest("https://appointment.example.test/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }
  function get(parameters: string): NextRequest {
    return new NextRequest(`https://appointment.example.test/api/appointments?${parameters}`);
  }

  for (const [label, body, expectedStatus] of [
    ["invalid JSON", "{", 400],
    ["missing request reference", { ...requestBody(), requestId: undefined }, 400],
    ["invalid UUID", requestBody({ requestId: "caller-value" }), 400],
    ["honeypot", requestBody({ website: "https://spam.example.test" }), 400],
    ["unknown fields", requestBody({ approved: true }), 400],
    ["unknown location", requestBody({ locationSlug: "other-store" }), 400],
    ["unapproved service", requestBody({ serviceType: "Caller-supplied service" }), 400],
    ["impossible calendar date", requestBody({ preferredDate: "2026-02-30" }), 400],
    ["empty customer name", requestBody({ name: " " }), 400],
    ["invalid email", requestBody({ email: "not-an-email" }), 400],
    ["email header injection", requestBody({ email: "customer@example.test\r\nBcc: attacker@example.test" }), 400],
    ["oversized notes", requestBody({ notes: "x".repeat(1001) }), 400],
    ["oversized body", "x".repeat(12_001), 413],
  ] as const) {
    await context.test(`rejects ${label} before SMTP`, async () => {
      reset();
      const response = await routes.POST(post(body));
      assert.equal(response.status, expectedStatus);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(messages.length, 0);
    });
  }

  await context.test("successful intake is pending and staff can reply directly to the customer", async () => {
    reset();
    const response = await routes.POST(post(requestBody({ name: "  Synthetic Customer  ", notes: "  " })));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(payload.received, true);
    assert.equal(payload.status, "pending");
    assert.equal(payload.reference, `APT-${createHash("sha256").update(REQUEST_ID).digest("hex").slice(0, 16).toUpperCase()}`);
    assert.match(payload.message, /not confirmed yet/);
    assert.match(payload.message, /Staff will reply to your email/);
    assert.deepEqual(Object.keys(payload).sort(), ["message", "received", "reference", "status"]);
    assert.equal(messages.length, 2);
    assert.equal(messages[0].replyTo, "synthetic@example.test");
    assert.equal(messages[0].to, "owner@example.test");
    assert.match(String(messages[0].text), /Synthetic Customer/);
    assert.equal(messages[1].to, "synthetic@example.test");
    for (const message of messages) {
      assert.equal(message.attachments, undefined);
      assert.doesNotMatch(`${message.text} ${message.html}`, /appointments\/review|calendar\.google\.com|BEGIN:VCALENDAR/);
    }
    assert.doesNotMatch(payload.message, /saved|receipt email|already been approved/);
  });

  for (const outcome of ["failed", "unknown", "throw"] as const) {
    await context.test(`does not acknowledge intake after ${outcome} staff delivery`, async () => {
      reset();
      staffOutcome = outcome;
      const response = await routes.POST(post(requestBody()));
      const payload = await response.json();
      assert.equal(response.status, 503);
      assert.equal(payload.received, false);
      assert.equal(payload.status, undefined);
      assert.equal(payload.retryAllowed, outcome === "failed");
      assert.match(payload.message, /not confirmed/);
      if (outcome !== "failed") assert.match(payload.message, /before submitting another request/);
      assert.doesNotMatch(JSON.stringify(payload), /synthetic@example\.test|fixture-password|saved/);
      assert.equal(messages.length, 1);
      assert.ok(logged.every((entry) => !JSON.stringify(entry).includes("fixture-password") && !JSON.stringify(entry).includes("synthetic@example.test")));
    });
  }

  await context.test("partially accepted staff delivery blocks an automatic retry and customer receipt", async () => {
    reset();
    const recipients = process.env.APPOINTMENT_NOTIFICATION_TO;
    process.env.APPOINTMENT_NOTIFICATION_TO = "owner@example.test, manager@example.test";
    staffOutcome = "partial";
    try {
      const response = await routes.POST(post(requestBody()));
      const payload = await response.json();
      assert.equal(response.status, 503);
      assert.equal(payload.received, false);
      assert.equal(payload.retryAllowed, false);
      assert.match(payload.message, /before submitting another request/);
      assert.equal(messages.length, 1);
    } finally {
      process.env.APPOINTMENT_NOTIFICATION_TO = recipients;
    }
  });

  await context.test("missing SMTP produces a known failure without customer mail", async () => {
    reset();
    const host = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;
    try {
      const response = await routes.POST(post(requestBody()));
      const payload = await response.json();
      assert.equal(response.status, 503);
      assert.equal(payload.received, false);
      assert.equal(payload.retryAllowed, true);
      assert.equal(messages.length, 0);
    } finally {
      process.env.SMTP_HOST = host;
    }
  });

  for (const outcome of ["failed", "unknown", "throw"] as const) {
    await context.test(`${outcome} customer receipt does not undo accepted staff delivery`, async () => {
      reset();
      customerOutcome = outcome;
      const response = await routes.POST(post(requestBody()));
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.received, true);
      assert.equal(payload.status, "pending");
      assert.match(payload.message, /Staff will reply/);
      assert.doesNotMatch(payload.message, /sent.*receipt|check your inbox|confirmed appointment/i);
      assert.equal(messages.length, 2);
    });
  }

  await context.test("repeated requests have the same recognizable reference without claiming durable deduplication", async () => {
    reset();
    const first = await (await routes.POST(post(requestBody()))).json();
    const repeated = await (await routes.POST(post(requestBody()))).json();
    assert.equal(first.reference, repeated.reference);
    assert.equal(repeated.status, "pending");
    assert.equal(messages.length, 4);
    assert.equal(messages[0].subject, messages[2].subject);
  });

  await context.test("a distinct request UUID has a distinct reference", async () => {
    reset();
    const first = await (await routes.POST(post(requestBody()))).json();
    const second = await (await routes.POST(post(requestBody({ requestId: "6483c040-e38e-4f73-a7fb-b80b34d84dad" })))).json();
    assert.notEqual(first.reference, second.reference);
  });

  for (const [label, body] of [
    ["past date", requestBody({ preferredDate: "2026-10-07" })],
    ["holiday closure", requestBody({ preferredDate: "2026-12-25" })],
    ["outside showroom hours", requestBody({ preferredTimeWindow: "1:00 AM - 1:30 AM" })],
  ] as const) {
    await context.test(`rejects a ${label} as a preferred time without sending`, async () => {
      reset();
      const response = await routes.POST(post(body));
      const payload = await response.json();
      assert.equal(response.status, 409);
      assert.match(payload.message, /future preferred time/);
      assert.ok(Array.isArray(payload.availableSlots));
      assert.equal(messages.length, 0);
    });
  }

  await context.test("GET offers showroom-hour preferences without reserving or checking bookings", async () => {
    reset();
    const response = await routes.GET(get("locationSlug=partridge-creek&date=2026-10-12"));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.ok(payload.availableSlots.includes("10:00 AM - 10:30 AM"));
    assert.ok(payload.availableSlots.includes("10:30 AM - 11:00 AM"));
    assert.equal(messages.length, 0);
  });

  for (const date of ["2026-10-07", "2026-12-25"]) {
    await context.test(`GET has no preferred times for ${date}`, async () => {
      reset();
      const response = await routes.GET(get(`locationSlug=partridge-creek&date=${date}`));
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.deepEqual(payload.availableSlots, []);
      assert.match(payload.message, /No preferred times/);
      assert.equal(messages.length, 0);
    });
  }

  for (const parameters of ["locationSlug=other-store&date=2026-10-12", "locationSlug=partridge-creek&date=2026-02-30"]) {
    await context.test(`GET validates ${parameters}`, async () => {
      reset();
      const response = await routes.GET(get(parameters));
      assert.equal(response.status, 400);
      assert.equal(messages.length, 0);
    });
  }

  await context.test("started same-day preferred times are excluded from GET and POST", async () => {
    reset();
    context.mock.timers.setTime(Date.parse("2026-10-08T16:00:00Z"));
    try {
      const response = await routes.GET(get("locationSlug=partridge-creek&date=2026-10-08"));
      const payload = await response.json();
      assert.ok(!payload.availableSlots.includes("12:00 PM - 12:30 PM"));
      assert.ok(payload.availableSlots.includes("12:30 PM - 1:00 PM"));
      assert.equal((await routes.POST(post(requestBody({ preferredDate: "2026-10-08", preferredTimeWindow: "12:00 PM - 12:30 PM" })))).status, 409);
      assert.equal(messages.length, 0);
    } finally {
      context.mock.timers.setTime(NOW);
    }
  });

  await context.test("rate limits repeated requests before a sixth SMTP submission", async () => {
    reset();
    const ip = "198.51.100.220";
    for (let index = 0; index < 5; index++) {
      assert.equal((await routes.POST(post(requestBody(), ip))).status, 200);
    }
    const response = await routes.POST(post(requestBody(), ip));
    assert.equal(response.status, 429);
    assert.equal(messages.length, 10);
  });
});
