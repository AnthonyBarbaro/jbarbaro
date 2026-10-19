import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

import { NextRequest } from "next/server";
import type { SendMailOptions } from "nodemailer";

type Outcome = "sent" | "rejected" | "partial" | "unknown" | "timeout" | "refused" | "throw";
type Payload = Record<string, unknown>;

test("contact and wedding email intake verifies staff acceptance before receipt", async (context) => {
  const environment = {
    NEXT_PUBLIC_SITE_URL: "https://forms.example.test",
    SMTP_HOST: "email-smtp.example.test",
    SMTP_PORT: "587",
    SMTP_SECURE: "false",
    SMTP_USER: "fixture-user",
    SMTP_PASS: "fixture-password",
    SMTP_FROM: "Clothier <sender@example.test>",
    SMTP_REPLY_TO: "owner@example.test",
    CONTACT_NOTIFICATION_TO: "owner@example.test, manager@example.test",
    WEDDING_NOTIFICATION_TO: "owner@example.test, manager@example.test",
    APPOINTMENT_NOTIFICATION_TO: "",
  };
  const previous = Object.keys(environment).map((key) => [key, process.env[key]] as const);
  Object.assign(process.env, environment);
  context.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const messages: SendMailOptions[] = [];
  const errors: unknown[][] = [];
  let transportOptions: Record<string, unknown> | undefined;
  let staffOutcome: Outcome = "sent";
  let customerOutcome: Outcome = "sent";
  let ipSequence = 1;
  const nodemailer = createRequire(`${process.cwd()}/package.json`)("nodemailer") as {
    createTransport: (options: unknown) => unknown;
  };
  context.mock.method(nodemailer, "createTransport", (options: Record<string, unknown>) => {
    transportOptions = options;
    return {
      sendMail: async (message: SendMailOptions): Promise<unknown> => {
        messages.push(message);
        const recipients = String(message.to)
          .split(",")
          .map((value) => value.trim());
        const outcome = recipients.includes("synthetic@example.test")
          ? customerOutcome
          : staffOutcome;
        if (outcome === "throw") throw new Error("fixture-password synthetic@example.test");
        if (outcome === "timeout" || outcome === "refused") {
          throw Object.assign(new Error("fixture-password synthetic@example.test"), {
            code: outcome === "timeout" ? "ETIMEDOUT" : "EENVELOPE",
            responseCode: 550,
          });
        }
        if (outcome === "unknown") return { messageId: "uncertain-fixture" };
        if (outcome === "partial")
          return { accepted: recipients.slice(0, 1), rejected: recipients.slice(1) };
        return {
          accepted: outcome === "sent" ? recipients : [],
          rejected: outcome === "rejected" ? recipients : [],
        };
      },
    };
  });
  context.mock.method(console, "error", (...args: unknown[]) => errors.push(args));
  const hook = registerHooks({
    resolve(specifier, resolutionContext, nextResolve) {
      return nextResolve(
        specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier,
        resolutionContext,
      );
    },
  });
  const routes = await Promise.all([
    import("@/app/api/contact/route"),
    import("@/app/api/wedding-registration/route"),
    import("@/app/api/newsletter/route"),
  ]).finally(() => hook.deregister());
  const requestId = "7d17922d-6a3a-4dfe-a848-fd80f45e9b77";
  const forms = [
    {
      name: "contact",
      route: routes[0],
      body: {
        requestId,
        name: "Synthetic Customer",
        email: "synthetic@example.test",
        phone: "555-010-1234",
        message: "Synthetic form test message.",
        website: "",
      },
    },
    {
      name: "wedding",
      route: routes[1],
      body: {
        requestId,
        groomName: "Synthetic Groom",
        brideName: "Synthetic Partner",
        email: "synthetic@example.test",
        phone: "555-010-1234",
        weddingDate: "2028-02-29",
        numberGroomsmen: 3,
        locationSlug: "",
        notes: "",
        website: "",
      },
    },
  ];
  function post(body: Payload | string, ip = `198.51.100.${ipSequence++}`): NextRequest {
    return new NextRequest("https://forms.example.test/api/form", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }
  function reset(): void {
    messages.length = 0;
    errors.length = 0;
    staffOutcome = "sent";
    customerOutcome = "sent";
  }
  for (const form of forms) {
    await context.test(
      `${form.name}: accepted staff mail permits receipt and customer acknowledgment`,
      async () => {
        reset();
        const response = await form.route.POST(post(form.body));
        const payload = await response.json();
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("cache-control"), "private, no-store");
        assert.equal(payload.received, true);
        assert.equal(payload.retryAllowed, false);
        assert.match(payload.reference, /^(CTC|WDG)-[A-F0-9]{16}$/);
        assert.match(payload.message, /confirmation email has been sent/);
        assert.equal(messages.length, 2);
        assert.equal(messages[0].replyTo, "synthetic@example.test");
        assert.equal(messages[1].to, "synthetic@example.test");
        assert.equal(transportOptions?.requireTLS, true);
        assert.equal(transportOptions?.connectionTimeout, 10_000);
        assert.equal(transportOptions?.greetingTimeout, 10_000);
        assert.equal(transportOptions?.socketTimeout, 15_000);
      },
    );
    for (const outcome of [
      "rejected",
      "partial",
      "unknown",
      "timeout",
      "refused",
      "throw",
    ] as const) {
      await context.test(
        `${form.name}: staff ${outcome} never announces receipt or emails customer`,
        async () => {
          reset();
          staffOutcome = outcome;
          const response = await form.route.POST(post(form.body));
          const payload = await response.json();
          assert.equal(response.status, 503);
          assert.equal(payload.received, false);
          assert.equal(payload.retryAllowed, outcome === "rejected" || outcome === "refused");
          assert.equal(messages.length, 1);
          assert.doesNotMatch(JSON.stringify(errors), /fixture-password|synthetic@example\.test/);
          if (!payload.retryAllowed) assert.match(payload.message, /before submitting again/);
        },
      );
    }
    for (const key of [
      "SMTP_HOST",
      "SMTP_FROM",
      "CONTACT_NOTIFICATION_TO",
      "WEDDING_NOTIFICATION_TO",
    ] as const) {
      if (
        (form.name === "contact" && key === "WEDDING_NOTIFICATION_TO") ||
        (form.name === "wedding" && key === "CONTACT_NOTIFICATION_TO")
      )
        continue;
      await context.test(
        `${form.name}: missing ${key} does not send or claim receipt`,
        async () => {
          reset();
          const previousSettings = { ...process.env };
          delete process.env[key];
          if (key.endsWith("NOTIFICATION_TO")) {
            process.env.CONTACT_NOTIFICATION_TO = "";
            process.env.WEDDING_NOTIFICATION_TO = "";
            process.env.APPOINTMENT_NOTIFICATION_TO = "";
            process.env.SMTP_REPLY_TO = "";
          }
          try {
            const response = await form.route.POST(post(form.body));
            const payload = await response.json();
            assert.equal(response.status, 503);
            assert.equal(payload.received, false);
            assert.equal(payload.retryAllowed, true);
            assert.equal(messages.length, 0);
          } finally {
            for (const name of Object.keys(environment)) {
              const value = previousSettings[name];
              if (value === undefined) delete process.env[name];
              else process.env[name] = value;
            }
          }
        },
      );
    }
    for (const outcome of ["rejected", "unknown", "timeout", "throw"] as const) {
      await context.test(
        `${form.name}: customer ${outcome} does not discard accepted staff mail`,
        async () => {
          reset();
          customerOutcome = outcome;
          const response = await form.route.POST(post(form.body));
          const payload = await response.json();
          assert.equal(response.status, 200);
          assert.equal(payload.received, true);
          assert.equal(payload.retryAllowed, false);
          assert.doesNotMatch(payload.message, /confirmation email has been sent/);
          assert.equal(messages.length, 2);
        },
      );
    }
    await context.test(`${form.name}: explicit safe retry preserves the reference`, async () => {
      reset();
      staffOutcome = "refused";
      const first = await (await form.route.POST(post(form.body))).json();
      staffOutcome = "sent";
      const retry = await (await form.route.POST(post(form.body))).json();
      assert.equal(first.retryAllowed, true);
      assert.equal(retry.received, true);
      assert.equal(first.reference, retry.reference);
    });
    for (const [label, value, status] of [
      ["malformed JSON", "{", 400],
      ["oversized body", "x".repeat(12_001), 413],
      ["missing request ID", { ...form.body, requestId: undefined }, 400],
      ["invalid email", { ...form.body, email: "invalid" }, 400],
      [
        "email header injection",
        { ...form.body, email: "synthetic@example.test\r\nBcc: unwanted@example.test" },
        400,
      ],
      ["honeypot", { ...form.body, website: "https://spam.example.test" }, 400],
      ["unknown fields", { ...form.body, approved: true }, 400],
      [
        "oversized name",
        { ...form.body, [form.name === "contact" ? "name" : "groomName"]: "x".repeat(121) },
        400,
      ],
      ["oversized phone", { ...form.body, phone: "x".repeat(31) }, 400],
      [
        "oversized message",
        { ...form.body, [form.name === "contact" ? "message" : "notes"]: "x".repeat(2001) },
        400,
      ],
    ] as const) {
      await context.test(`${form.name}: rejects ${label} before SMTP`, async () => {
        reset();
        const response = await form.route.POST(post(value));
        const payload = await response.json();
        assert.equal(response.status, status);
        assert.equal(payload.received, false);
        assert.equal(payload.retryAllowed, true);
        assert.equal(messages.length, 0);
      });
    }
    await context.test(`${form.name}: sixth same-process submission is rate limited`, async () => {
      reset();
      const ip = `203.0.113.${ipSequence++}`;
      for (let index = 0; index < 5; index += 1) {
        assert.equal((await form.route.POST(post(form.body, ip))).status, 200);
      }
      assert.equal((await form.route.POST(post(form.body, ip))).status, 429);
      assert.equal(messages.length, 10);
    });
  }
  for (const weddingDate of [
    "2026-02-29",
    "2026-02-31",
    "2026-04-31",
    "2026-13-01",
    "2026-01-00",
  ]) {
    await context.test(`wedding: rejects impossible date ${weddingDate}`, async () => {
      reset();
      assert.equal(
        (await forms[1].route.POST(post({ ...forms[1].body, weddingDate }))).status,
        400,
      );
      assert.equal(messages.length, 0);
    });
  }
  await context.test("wedding: does not invent a new past-date business rule", async () => {
    reset();
    assert.equal(
      (await forms[1].route.POST(post({ ...forms[1].body, weddingDate: "2020-02-29" }))).status,
      200,
    );
  });
  for (const locationSlug of ["missing-store", "__proto__", "toString"]) {
    await context.test(`wedding: rejects invalid location ${locationSlug}`, async () => {
      reset();
      assert.equal(
        (await forms[1].route.POST(post({ ...forms[1].body, locationSlug }))).status,
        400,
      );
      assert.equal(messages.length, 0);
    });
  }
  await context.test(
    "newsletter is disabled without reading data, sending mail, or promising enrollment",
    async () => {
      reset();
      const response = await routes[2].POST();
      const payload = await response.json();
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(payload.received, false);
      assert.equal(payload.retryAllowed, false);
      assert.match(payload.message, /unavailable/);
      assert.doesNotMatch(payload.message, /on the list|subscribed/i);
      assert.equal(messages.length, 0);
    },
  );
});
