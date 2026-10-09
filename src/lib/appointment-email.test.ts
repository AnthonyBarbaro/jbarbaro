import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

import type { SendMailOptions } from "nodemailer";

import type { AppointmentSubmissionPayload } from "@/types/submissions";

const appointment: AppointmentSubmissionPayload = {
  reference: "APT-test-reference",
  submittedAt: new Date("2026-10-08T12:00:00Z"),
  locationSlug: "partridge-creek",
  serviceType: "Personal Styling",
  preferredDate: new Date("2026-10-12T00:00:00"),
  preferredTimeWindow: "10:00 AM - 10:30 AM",
  name: "Client <script>alert('example')</script>",
  email: "client@example.test",
  phone: "586-555-0123",
  notes: "Please help me choose a suit. <script>alert('notes')</script>",
};

test("appointment requests use staff replies for confirmation and verify SMTP acceptance", async (context) => {
  const envKeys = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "SMTP_REPLY_TO",
    "APPOINTMENT_NOTIFICATION_TO",
    "CONTACT_NOTIFICATION_TO",
  ];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  context.after(() => {
    for (const key of envKeys) {
      const value = previousEnv[key];

      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  Object.assign(process.env, {
    SMTP_HOST: "email-smtp.example.test",
    SMTP_PORT: "587",
    SMTP_SECURE: "false",
    SMTP_USER: "smtp-fixture-user",
    SMTP_PASS: "smtp-fixture-password",
    SMTP_FROM: "J. Barbaro <sender@example.test>",
    SMTP_REPLY_TO: "store@example.test",
    APPOINTMENT_NOTIFICATION_TO: "owner@example.test, manager@example.test",
    CONTACT_NOTIFICATION_TO: "",
  });

  const nodemailerModule = createRequire(`${process.cwd()}/package.json`)("nodemailer") as {
    createTransport: (options: unknown) => unknown;
  };
  const messages: SendMailOptions[] = [];
  const errors: unknown[][] = [];
  let deliveryError: Error | null = null;
  let receipt: unknown = {
    accepted: ["owner@example.test", "manager@example.test"],
    rejected: [],
    pending: [],
  };
  let transportOptions: unknown;

  context.mock.method(nodemailerModule, "createTransport", (options: unknown) => {
    transportOptions = options;
    return {
      sendMail: async (message: SendMailOptions): Promise<unknown> => {
        messages.push(message);

        if (deliveryError) {
          throw deliveryError;
        }

        return receipt;
      },
    };
  });
  context.mock.method(console, "error", (...args: unknown[]) => {
    errors.push(args);
  });

  const hook = registerHooks({
    resolve(specifier, resolutionContext, nextResolve) {
      return nextResolve(
        specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier,
        resolutionContext,
      );
    },
  });
  const email = await import("@/lib/email").finally(() => hook.deregister());

  function lastMessage(): SendMailOptions {
    const message = messages.at(-1);
    assert.ok(message);
    return message;
  }

  await context.test(
    "staff can reply to the customer after checking the calendar, without automatic confirmation",
    async () => {
      assert.equal(await email.sendAppointmentRequestEmail(appointment), "SENT");
      const message = lastMessage();
      assert.match(String(message.subject), /^Action needed: appointment request/);
      assert.equal(message.to, "owner@example.test, manager@example.test");
      assert.equal(message.replyTo, appointment.email);
      assert.match(String(message.text), /No appointment has been confirmed/);
      assert.match(String(message.text), /Check the shared appointment calendar/);
      assert.match(String(message.text), /Reply to this email to confirm the date, time, and showroom/);
      assert.match(String(message.text), /Add the confirmed appointment to the shared calendar/);
      assert.match(String(message.text), /Monday, October 12, 2026/);
      assert.match(String(message.html), /America\/Detroit/);
      assert.match(String(message.html), /&lt;script&gt;alert\(&#39;notes&#39;\)&lt;\/script&gt;/);
      assert.doesNotMatch(String(message.html), /<script>/);
      assert.doesNotMatch(String(message.html), /appointments\/review|Review Request|<a\s/);
      assert.doesNotMatch(
        String(message.text),
        /calendar\.google\.com|outlook\.live\.com|BEGIN:VCALENDAR/,
      );
      assert.equal(message.attachments, undefined);
      assert.ok(typeof transportOptions === "object" && transportOptions !== null);
      assert.equal("requireTLS" in transportOptions && transportOptions.requireTLS, true);
    },
  );

  await context.test(
    "customer receipt says staff will reply to confirm or offer another time and has no calendar invite",
    async () => {
      receipt = { accepted: [appointment.email], rejected: [], pending: [] };
      assert.equal(await email.sendAppointmentPendingEmail(appointment), "SENT");
      const message = lastMessage();
      assert.match(String(message.subject), /received your appointment request/);
      assert.doesNotMatch(String(message.subject), /confirmation/i);
      assert.match(String(message.text), /not confirmed yet/);
      assert.match(String(message.text), /reply by email to confirm your appointment or suggest another time/);
      assert.match(String(message.text), /wait for a separate confirmation/);
      assert.match(String(message.html), /Awaiting Confirmation/);
      assert.match(String(message.html), /America\/Detroit/);
      assert.equal(message.replyTo, "store@example.test");
      assert.doesNotMatch(
        String(message.text),
        /calendar\.google\.com|outlook\.live\.com|BEGIN:VCALENDAR/,
      );
      assert.doesNotMatch(String(message.html), /calendar\.google\.com|outlook\.live\.com/);
      assert.equal(message.attachments, undefined);
    },
  );

  await context.test("customer replies fall back to the staff mailbox rather than the sender", async () => {
    delete process.env.SMTP_REPLY_TO;
    assert.equal(await email.sendAppointmentPendingEmail(appointment), "SENT");
    assert.equal(lastMessage().replyTo, "owner@example.test");
    process.env.SMTP_REPLY_TO = "store@example.test";
  });

  await context.test(
    "requires every staff recipient to be accepted and retains uncertainty after a partial send",
    async () => {
      receipt = { accepted: ["owner@example.test"], rejected: ["manager@example.test"] };
      assert.equal(await email.sendAppointmentRequestEmail(appointment), "UNKNOWN");
      receipt = { accepted: ["unrelated@example.test"], rejected: [] };
      assert.equal(await email.sendAppointmentRequestEmail(appointment), "UNKNOWN");
      receipt = { accepted: [], rejected: ["owner@example.test", "manager@example.test"] };
      assert.equal(await email.sendAppointmentRequestEmail(appointment), "FAILED");
      receipt = { accepted: [], pending: ["owner@example.test"] };
      assert.equal(await email.sendAppointmentRequestEmail(appointment), "UNKNOWN");
    },
  );

  await context.test(
    "recognizes address objects and casing in authoritative SMTP acceptance",
    async () => {
      receipt = {
        accepted: [{ name: "Owner", address: "OWNER@example.test" }, "manager@example.test"],
        rejected: [],
      };
      assert.equal(
        await email.sendAppointmentRequestEmail(appointment),
        "SENT",
      );
    },
  );

  await context.test(
    "a fulfilled send without acceptance is uncertain rather than successful",
    async () => {
      receipt = { messageId: "provider-message-id" };
      assert.equal(await email.sendAppointmentPendingEmail(appointment), "UNKNOWN");
      receipt = { accepted: "client@example.test" };
      assert.equal(await email.sendAppointmentPendingEmail(appointment), "UNKNOWN");
    },
  );

  await context.test(
    "missing SMTP, sender, or staff recipients prevents sending and never logs customer details",
    async () => {
      const before = messages.length;
      const host = process.env.SMTP_HOST;
      delete process.env.SMTP_HOST;
      assert.equal(await email.sendAppointmentPendingEmail(appointment), "FAILED");
      process.env.SMTP_HOST = host;
      const from = process.env.SMTP_FROM;
      delete process.env.SMTP_FROM;
      assert.equal(await email.sendAppointmentPendingEmail(appointment), "FAILED");
      process.env.SMTP_FROM = from;
      process.env.APPOINTMENT_NOTIFICATION_TO = "";
      process.env.SMTP_REPLY_TO = "";
      assert.equal(
        await email.sendAppointmentRequestEmail(appointment),
        "FAILED",
      );
      assert.equal(messages.length, before);
      assert.deepEqual(errors, []);
      process.env.APPOINTMENT_NOTIFICATION_TO = "owner@example.test, manager@example.test";
      process.env.SMTP_REPLY_TO = "store@example.test";
    },
  );

  await context.test("rejects unsafe email addresses and header injection before contacting SMTP", async () => {
    const before = messages.length;
    process.env.SMTP_FROM = "sender@example.test\r\nBcc: unwanted@example.test";
    assert.equal(await email.sendAppointmentPendingEmail(appointment), "FAILED");
    process.env.SMTP_FROM = "J. Barbaro <sender@example.test>";
    process.env.SMTP_REPLY_TO = "store@example.test\r\nBcc: unwanted@example.test";
    assert.equal(await email.sendAppointmentPendingEmail(appointment), "FAILED");
    process.env.SMTP_REPLY_TO = "store@example.test";
    process.env.APPOINTMENT_NOTIFICATION_TO = "owner@example.test, invalid-mailbox";
    assert.equal(await email.sendAppointmentRequestEmail(appointment), "FAILED");
    process.env.APPOINTMENT_NOTIFICATION_TO = "owner@example.test, manager@example.test";
    assert.equal(
      await email.sendAppointmentRequestEmail({ ...appointment, email: "client@example.test\r\nBcc: unwanted@example.test" }),
      "FAILED",
    );
    assert.equal(
      await email.sendAppointmentRequestEmail({ ...appointment, reference: "APT-test\r\nBcc: unwanted@example.test" }),
      "FAILED",
    );
    assert.equal(messages.length, before);
  });

  await context.test("known SMTP refusal is failed while timeouts remain uncertain", async () => {
    for (const code of ["EAUTH", "EENVELOPE", "EMESSAGE"]) {
      deliveryError = Object.assign(new Error("provider rejection"), { code, responseCode: 550 });
      assert.equal(await email.sendAppointmentPendingEmail(appointment), "FAILED");
    }

    deliveryError = Object.assign(new Error("provider timeout"), { code: "ETIMEDOUT" });
    assert.equal(await email.sendAppointmentPendingEmail(appointment), "UNKNOWN");
    deliveryError = null;
    errors.length = 0;
  });

  await context.test(
    "SMTP exceptions do not expose provider credentials or customer information",
    async () => {
      deliveryError = new Error(
        "provider failure with smtp-fixture-password and client@example.test",
      );
      assert.equal(await email.sendAppointmentPendingEmail(appointment), "UNKNOWN");
      assert.deepEqual(errors, [
        ["[Email] Appointment notification delivery could not be confirmed."],
      ]);
      assert.doesNotMatch(
        JSON.stringify(errors),
        /smtp-fixture-password|client@example\.test|Client/,
      );
    },
  );
});
