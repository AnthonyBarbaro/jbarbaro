import "server-only";

import type { Appointment, ContactSubmission, EmailLogStatus, WeddingRegistration } from "@prisma/client";
import { format } from "date-fns";
import nodemailer from "nodemailer";

import { locationMap } from "@/data/locations";
import { buildAppointmentCalendarArtifacts } from "@/lib/calendar";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type DeliveryResult = EmailLogStatus;

export type SubmissionEmailResult = {
  customer: DeliveryResult;
  internal: DeliveryResult;
};

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: nodemailer.SendMailOptions["attachments"];
};

type EmailField = {
  label: string;
  value: string | number | null | undefined;
};

type EmailSection = {
  title: string;
  fields: EmailField[];
};

type BrandedEmailOptions = {
  preheader: string;
  badge: string;
  title: string;
  subtitle: string;
  sections: EmailSection[];
  messageTitle?: string;
  message?: string;
  footerNote?: string;
};

let transporterCache: nodemailer.Transporter | null | undefined;

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function parseRecipients(value?: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getNotificationRecipients(keys: string[]) {
  for (const key of keys) {
    const candidates = parseRecipients(process.env[key]);
    if (candidates.length > 0) {
      return candidates;
    }
  }

  return [];
}

function getTransporter() {
  if (transporterCache !== undefined) {
    return transporterCache;
  }

  if (!hasSmtpConfig()) {
    transporterCache = null;
    return transporterCache;
  }

  const port = Number(process.env.SMTP_PORT || "587");

  transporterCache = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporterCache;
}

function getFromAddress() {
  return process.env.SMTP_FROM || `"${SITE_NAME}" <no-reply@jbarbaro.local>`;
}

export function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSectionRows(fields: EmailField[]) {
  return fields
    .map((field) => {
      const safeLabel = escapeHtml(field.label);
      const safeValue = escapeHtml(field.value || "-");

      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;width:180px;color:#334155;font-size:13px;font-weight:600;vertical-align:top;">
            ${safeLabel}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;vertical-align:top;">
            ${safeValue}
          </td>
        </tr>
      `;
    })
    .join("");
}

export function buildBrandedEmail({
  preheader,
  badge,
  title,
  subtitle,
  sections,
  messageTitle,
  message,
  footerNote,
}: BrandedEmailOptions) {
  const safePreheader = escapeHtml(preheader);
  const safeBadge = escapeHtml(badge);
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeFooter = escapeHtml(footerNote || `${SITE_NAME} site form notification`);
  const safeMessageTitle = escapeHtml(messageTitle || "Details");
  const safeMessage = message ? escapeHtml(message).replace(/\n/g, "<br />") : "";
  const receivedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const renderedSections = sections
    .map((section) => {
      const safeSectionTitle = escapeHtml(section.title);

      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #dbeafe;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:12px 14px;background:#eff6ff;border-bottom:1px solid #dbeafe;color:#0f172a;font-size:13px;font-weight:700;">
              ${safeSectionTitle}
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tbody>
                  ${renderSectionRows(section.fields)}
                </tbody>
              </table>
            </td>
          </tr>
        </table>
      `;
    })
    .join('<div style="height:12px;line-height:12px;">&nbsp;</div>');

  const messageBlock = message
    ? `
      <div style="height:12px;line-height:12px;">&nbsp;</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #dbeafe;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:12px 14px;background:#eff6ff;border-bottom:1px solid #dbeafe;color:#0f172a;font-size:13px;font-weight:700;">
            ${safeMessageTitle}
          </td>
        </tr>
        <tr>
          <td style="padding:14px;color:#0f172a;font-size:13px;line-height:1.65;background:#f8fbff;">
            ${safeMessage}
          </td>
        </tr>
      </table>
    `
    : "";

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${safePreheader}
    </div>
    <div style="margin:0;padding:24px;background:#f1f5f9;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;border-collapse:collapse;background:#ffffff;border:1px solid #dbeafe;border-radius:20px;overflow:hidden;">
              <tr>
                <td style="padding:24px 28px;background:linear-gradient(135deg,#0f172a 0%,#0369a1 100%);">
                  <div style="display:inline-block;padding:4px 10px;border:1px solid rgba(255,255,255,0.35);border-radius:999px;color:#dbeafe;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                    ${safeBadge}
                  </div>
                  <h1 style="margin:14px 0 6px 0;color:#ffffff;font-size:24px;line-height:1.2;font-weight:700;">
                    ${safeTitle}
                  </h1>
                  <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.5;">
                    ${safeSubtitle}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 22px 16px 22px;">
                  ${renderedSections}
                  ${messageBlock}
                </td>
              </tr>
              <tr>
                <td style="padding:14px 22px 20px 22px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
                  <div>Received: ${escapeHtml(receivedAt)}</div>
                  <div>${safeFooter}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

async function deliverEmail({ to, subject, text, html, replyTo, headers, attachments }: SendEmailOptions): Promise<DeliveryResult> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[Email] SMTP not configured. Logged-only mode for: ${to} / ${subject}`);
    return "LOGGED";
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
      replyTo,
      headers,
      attachments,
    });

    return "SENT";
  } catch (error) {
    console.error(`[Email] Failed sending to ${to} for subject "${subject}"`, error);
    return "FAILED";
  }
}

async function sendAndTrackAppointmentEmail(
  appointmentId: number,
  payload: SendEmailOptions,
): Promise<DeliveryResult> {
  const record = await prisma.emailLog.create({
    data: {
      appointmentId,
      toEmail: payload.to,
      subject: payload.subject,
      body: payload.text,
      status: "LOGGED",
    },
  });

  const status = await deliverEmail(payload);

  if (status === "SENT" || status === "FAILED") {
    await prisma.emailLog.update({
      where: { id: record.id },
      data: { status },
    });
  }

  return status;
}

function buildAppointmentCustomerEmail(appointment: Appointment) {
  const location = locationMap[appointment.locationSlug];
  const dateLabel = format(appointment.preferredDate, "EEEE, MMMM d, yyyy");
  const calendar = buildAppointmentCalendarArtifacts(appointment);
  const locationName = location?.name || appointment.locationSlug;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(calendar.address)}`;

  const text = [
    `Hi ${appointment.name},`,
    "",
    "Your appointment request has been received.",
    "",
    `Location: ${locationName}`,
    `Address: ${calendar.address}`,
    `Service: ${appointment.serviceType}`,
    `Date: ${dateLabel}`,
    `Time: ${appointment.preferredTimeWindow}`,
    "",
    "Add this appointment to your calendar:",
    `Google Calendar: ${calendar.googleCalendarUrl}`,
    `Outlook Calendar: ${calendar.outlookCalendarUrl}`,
    "",
    `Directions: ${mapsLink}`,
    `Manage appointment: ${SITE_URL}/schedule-appointment`,
    "",
    `${SITE_NAME}`,
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `Appointment confirmation for ${dateLabel}`,
    badge: "Appointment Confirmed",
    title: `Your Appointment Request Is In`,
    subtitle: `${SITE_NAME} will follow up if any additional details are needed.`,
    sections: [
      {
        title: "Appointment Details",
        fields: [
          { label: "Reference", value: `#${appointment.id}` },
          { label: "Location", value: locationName },
          { label: "Service", value: appointment.serviceType },
          { label: "Date", value: dateLabel },
          { label: "Time", value: appointment.preferredTimeWindow },
        ],
      },
      {
        title: "Quick Links",
        fields: [
          { label: "Google Calendar", value: calendar.googleCalendarUrl },
          { label: "Outlook Calendar", value: calendar.outlookCalendarUrl },
          { label: "Directions", value: mapsLink },
        ],
      },
    ],
    footerNote: SITE_NAME,
  });

  return {
    subject: `Appointment Confirmation - ${SITE_NAME}`,
    text,
    html,
    attachments: [
      {
        filename: `jbarbaro-appointment-${appointment.id}.ics`,
        content: calendar.icsContent,
        contentType: "text/calendar; charset=utf-8; method=PUBLISH",
      },
    ] satisfies nodemailer.SendMailOptions["attachments"],
  };
}

function buildAppointmentInternalEmail(appointment: Appointment) {
  const location = locationMap[appointment.locationSlug];
  const dateLabel = format(appointment.preferredDate, "EEEE, MMMM d, yyyy");
  const locationName = location?.name || appointment.locationSlug;

  const text = [
    `New appointment request #${appointment.id}`,
    `Name: ${appointment.name}`,
    `Email: ${appointment.email}`,
    `Phone: ${appointment.phone}`,
    `Location: ${locationName}`,
    `Service: ${appointment.serviceType}`,
    `Date: ${dateLabel}`,
    `Time: ${appointment.preferredTimeWindow}`,
    `Notes: ${appointment.notes || "-"}`,
    "",
    `Admin: ${SITE_URL}/admin/appointments`,
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `New appointment request from ${appointment.name}`,
    badge: "Appointment Intake",
    title: `New Appointment Request #${appointment.id}`,
    subtitle: "A customer submitted a new booking request.",
    sections: [
      {
        title: "Customer",
        fields: [
          { label: "Name", value: appointment.name },
          { label: "Email", value: appointment.email },
          { label: "Phone", value: appointment.phone },
        ],
      },
      {
        title: "Visit Details",
        fields: [
          { label: "Location", value: locationName },
          { label: "Service", value: appointment.serviceType },
          { label: "Date", value: dateLabel },
          { label: "Time", value: appointment.preferredTimeWindow },
        ],
      },
    ],
    messageTitle: "Customer Notes",
    message: appointment.notes || "No additional notes were provided.",
    footerNote: `${SITE_NAME} admin alert`,
  });

  return {
    subject: `New Appointment Request #${appointment.id} - ${SITE_NAME}`,
    text,
    html,
  };
}

export async function sendAppointmentConfirmationEmail(appointment: Appointment): Promise<DeliveryResult> {
  const customerEmail = buildAppointmentCustomerEmail(appointment);
  const customerStatus = await sendAndTrackAppointmentEmail(appointment.id, {
    to: appointment.email,
    subject: customerEmail.subject,
    text: customerEmail.text,
    html: customerEmail.html,
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM,
    headers: {
      "X-Form-Type": "appointment-customer",
      "X-Form-Reference": String(appointment.id),
    },
    attachments: customerEmail.attachments,
  });

  const internalRecipients = getNotificationRecipients([
    "APPOINTMENT_NOTIFICATION_TO",
    "CONTACT_NOTIFICATION_TO",
    "SMTP_REPLY_TO",
  ]);

  if (internalRecipients.length > 0) {
    const internalEmail = buildAppointmentInternalEmail(appointment);

    await sendAndTrackAppointmentEmail(appointment.id, {
      to: internalRecipients.join(", "),
      subject: internalEmail.subject,
      text: internalEmail.text,
      html: internalEmail.html,
      replyTo: appointment.email,
      headers: {
        "X-Form-Type": "appointment-internal",
        "X-Form-Reference": String(appointment.id),
      },
    });
  }

  return customerStatus;
}

function buildContactCustomerEmail(submission: ContactSubmission) {
  const subject = `We Received Your Message - ${SITE_NAME}`;

  const text = [
    `Hi ${submission.name},`,
    "",
    "Thanks for contacting J. Barbaro Clothiers.",
    `We have received your message and our team will follow up soon.`,
    "",
    `Reference: #${submission.id}`,
    "",
    `${SITE_NAME}`,
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `Contact request #${submission.id} received`,
    badge: "Contact Confirmation",
    title: "Your Message Has Been Received",
    subtitle: "A member of our team will respond as soon as possible.",
    sections: [
      {
        title: "Request Summary",
        fields: [
          { label: "Reference", value: `#${submission.id}` },
          { label: "Name", value: submission.name },
          { label: "Email", value: submission.email },
          { label: "Phone", value: submission.phone || "-" },
        ],
      },
    ],
    messageTitle: "Your Message",
    message: submission.message,
    footerNote: SITE_NAME,
  });

  return { subject, text, html };
}

function buildContactInternalEmail(submission: ContactSubmission) {
  const subject = `New Contact Submission #${submission.id} - ${SITE_NAME}`;

  const text = [
    `New contact submission #${submission.id}`,
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone || "-"}`,
    `IP: ${submission.ipAddress || "unknown"}`,
    `User-Agent: ${submission.userAgent || "unknown"}`,
    "",
    "Message:",
    submission.message,
    "",
    `Contact page: ${SITE_URL}/contact-us`,
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `New contact message from ${submission.name}`,
    badge: "Contact Form",
    title: `New Contact Submission #${submission.id}`,
    subtitle: "A new contact form message was submitted from the website.",
    sections: [
      {
        title: "Customer",
        fields: [
          { label: "Name", value: submission.name },
          { label: "Email", value: submission.email },
          { label: "Phone", value: submission.phone || "-" },
        ],
      },
      {
        title: "Request Metadata",
        fields: [
          { label: "IP Address", value: submission.ipAddress || "unknown" },
          { label: "User Agent", value: submission.userAgent || "unknown" },
        ],
      },
    ],
    messageTitle: "Message",
    message: submission.message,
    footerNote: `${SITE_NAME} contact notification`,
  });

  return { subject, text, html };
}

function buildWeddingCustomerEmail(registration: WeddingRegistration) {
  const dateLabel = format(registration.weddingDate, "EEEE, MMMM d, yyyy");
  const locationName = registration.locationSlug ? locationMap[registration.locationSlug]?.name || registration.locationSlug : "No location selected";

  const subject = `Wedding Registration Received - ${SITE_NAME}`;
  const text = [
    `Hi ${registration.groomName},`,
    "",
    "Thanks for registering your wedding consultation.",
    "Our team will contact you shortly to confirm next steps.",
    "",
    `Reference: #${registration.id}`,
    `Wedding Date: ${dateLabel}`,
    `Location Preference: ${locationName}`,
    "",
    `${SITE_NAME}`,
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `Wedding registration #${registration.id} received`,
    badge: "Wedding Intake",
    title: "Your Wedding Registration Is In",
    subtitle: "We will follow up to start planning your suit and tuxedo strategy.",
    sections: [
      {
        title: "Registration Details",
        fields: [
          { label: "Reference", value: `#${registration.id}` },
          { label: "Groom", value: registration.groomName },
          { label: "Partner", value: registration.brideName },
          { label: "Wedding Date", value: dateLabel },
          { label: "Groomsmen", value: registration.numberGroomsmen },
          { label: "Preferred Location", value: locationName },
        ],
      },
    ],
    messageTitle: "Additional Notes",
    message: registration.notes || "No additional notes were provided.",
    footerNote: SITE_NAME,
  });

  return { subject, text, html };
}

function buildWeddingInternalEmail(registration: WeddingRegistration) {
  const dateLabel = format(registration.weddingDate, "EEEE, MMMM d, yyyy");
  const locationName = registration.locationSlug ? locationMap[registration.locationSlug]?.name || registration.locationSlug : "No location selected";

  const subject = `New Wedding Registration #${registration.id} - ${SITE_NAME}`;
  const text = [
    `New wedding registration #${registration.id}`,
    `Groom: ${registration.groomName}`,
    `Partner: ${registration.brideName}`,
    `Email: ${registration.email}`,
    `Phone: ${registration.phone}`,
    `Wedding Date: ${dateLabel}`,
    `Groomsmen: ${registration.numberGroomsmen}`,
    `Location: ${locationName}`,
    `IP: ${registration.ipAddress || "unknown"}`,
    "",
    `Notes: ${registration.notes || "-"}`,
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `New wedding registration from ${registration.groomName}`,
    badge: "Wedding Form",
    title: `New Wedding Registration #${registration.id}`,
    subtitle: "A customer submitted a wedding intake form.",
    sections: [
      {
        title: "Couple",
        fields: [
          { label: "Groom", value: registration.groomName },
          { label: "Partner", value: registration.brideName },
          { label: "Email", value: registration.email },
          { label: "Phone", value: registration.phone },
        ],
      },
      {
        title: "Event Details",
        fields: [
          { label: "Wedding Date", value: dateLabel },
          { label: "Groomsmen", value: registration.numberGroomsmen },
          { label: "Preferred Location", value: locationName },
          { label: "IP Address", value: registration.ipAddress || "unknown" },
        ],
      },
    ],
    messageTitle: "Notes",
    message: registration.notes || "No additional notes were provided.",
    footerNote: `${SITE_NAME} wedding notification`,
  });

  return { subject, text, html };
}

export async function sendContactSubmissionEmails(submission: ContactSubmission): Promise<SubmissionEmailResult> {
  const internalRecipients = getNotificationRecipients([
    "CONTACT_NOTIFICATION_TO",
    "APPOINTMENT_NOTIFICATION_TO",
    "SMTP_REPLY_TO",
  ]);

  const internalEmail = buildContactInternalEmail(submission);
  const internalStatus =
    internalRecipients.length > 0
      ? await deliverEmail({
          to: internalRecipients.join(", "),
          subject: internalEmail.subject,
          text: internalEmail.text,
          html: internalEmail.html,
          replyTo: submission.email,
          headers: {
            "X-Form-Type": "contact-internal",
            "X-Form-Reference": String(submission.id),
          },
        })
      : "LOGGED";

  const customerEmail = buildContactCustomerEmail(submission);
  const customerStatus = await deliverEmail({
    to: submission.email,
    subject: customerEmail.subject,
    text: customerEmail.text,
    html: customerEmail.html,
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM,
    headers: {
      "X-Form-Type": "contact-customer",
      "X-Form-Reference": String(submission.id),
    },
  });

  return {
    customer: customerStatus,
    internal: internalStatus,
  };
}

export async function sendWeddingRegistrationEmails(
  registration: WeddingRegistration,
): Promise<SubmissionEmailResult> {
  const internalRecipients = getNotificationRecipients([
    "WEDDING_NOTIFICATION_TO",
    "CONTACT_NOTIFICATION_TO",
    "APPOINTMENT_NOTIFICATION_TO",
    "SMTP_REPLY_TO",
  ]);

  const internalEmail = buildWeddingInternalEmail(registration);
  const internalStatus =
    internalRecipients.length > 0
      ? await deliverEmail({
          to: internalRecipients.join(", "),
          subject: internalEmail.subject,
          text: internalEmail.text,
          html: internalEmail.html,
          replyTo: registration.email,
          headers: {
            "X-Form-Type": "wedding-internal",
            "X-Form-Reference": String(registration.id),
          },
        })
      : "LOGGED";

  const customerEmail = buildWeddingCustomerEmail(registration);
  const customerStatus = await deliverEmail({
    to: registration.email,
    subject: customerEmail.subject,
    text: customerEmail.text,
    html: customerEmail.html,
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM,
    headers: {
      "X-Form-Type": "wedding-customer",
      "X-Form-Reference": String(registration.id),
    },
  });

  return {
    customer: customerStatus,
    internal: internalStatus,
  };
}
