import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { appointmentLocationMap } from "@/data/locations";
import {
  getRequestableAppointmentSlots,
  parseAppointmentDate,
} from "@/lib/appointments/time";
import { sendAppointmentPendingEmail, sendAppointmentRequestEmail } from "@/lib/email";
import { appointmentRateLimiter } from "@/lib/rate-limit";
import { pageContent } from "@/lib/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const appointmentSchema = z
  .object({
    requestId: z.uuid(),
    locationSlug: z.string().trim().min(1).max(100),
    serviceType: z.string().trim().min(2).max(100),
    preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    preferredTimeWindow: z.string().trim().min(5).max(50),
    name: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    phone: z.string().trim().min(7).max(40),
    notes: z.string().trim().max(1000).optional(),
    website: z.string().max(200).optional(),
  })
  .strict();

function json(body: object, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const locationSlug = request.nextUrl.searchParams.get("locationSlug") || "";
  const date = request.nextUrl.searchParams.get("date") || "";
  const location = appointmentLocationMap[locationSlug];
  if (!location || !parseAppointmentDate(date)) {
    return json({ message: "Choose a valid date at The Mall at Partridge Creek." }, 400);
  }
  const availableSlots = getRequestableAppointmentSlots(location, date);
  return json({
    availableSlots,
    message: availableSlots.length
      ? undefined
      : "No preferred times are offered on this date. Please choose another date.",
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let raw: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > 12_000)
      return json({ message: "Appointment request is too large." }, 413);
    raw = JSON.parse(body);
  } catch {
    return json({ message: "Invalid appointment form data." }, 400);
  }
  const parsed = appointmentSchema.safeParse(raw);
  if (!parsed.success || parsed.data.website?.trim()) {
    return json({ message: "Invalid appointment form data." }, 400);
  }
  const input = { ...parsed.data };
  delete input.website;
  const location = appointmentLocationMap[input.locationSlug];
  const preferredDate = parseAppointmentDate(input.preferredDate);
  if (
    !location ||
    !preferredDate ||
    !pageContent.servicesPage.appointmentServices.includes(input.serviceType)
  ) {
    return json({ message: "Choose a valid showroom, service, and date." }, 400);
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!appointmentRateLimiter.check(ip).allowed) {
    return json(
      { message: "Too many appointment requests. Please try later or call the showroom." },
      429,
    );
  }
  const availableSlots = getRequestableAppointmentSlots(location, input.preferredDate);
  if (!availableSlots.includes(input.preferredTimeWindow)) {
    return json(
      {
        message: "Choose a future preferred time during showroom hours.",
        availableSlots,
      },
      409,
    );
  }
  // A repeated request keeps the same reference so staff can recognize duplicate emails.
  const reference = `APT-${createHash("sha256")
    .update(input.requestId.toLowerCase())
    .digest("hex")
    .slice(0, 16)
    .toUpperCase()}`;
  const appointment = {
    reference,
    submittedAt: new Date(),
    locationSlug: input.locationSlug,
    serviceType: input.serviceType,
    preferredDate,
    preferredTimeWindow: input.preferredTimeWindow,
    name: input.name,
    email: input.email,
    phone: input.phone,
    notes: input.notes || null,
  };
  try {
    const delivery = await sendAppointmentRequestEmail(appointment);
    if (delivery !== "SENT") {
      return json(
        {
          received: false,
          reference,
          retryAllowed: delivery === "FAILED",
          message:
            delivery === "FAILED"
              ? `Your request was not sent. Please try again or call the showroom. Your appointment is not confirmed. Reference ${reference}.`
              : `We could not confirm that your request was sent. Call the showroom and quote ${reference} before submitting another request. Your appointment is not confirmed.`,
        },
        503,
      );
    }
    try {
      await sendAppointmentPendingEmail(appointment);
    } catch {
      // Staff receipt is authoritative even if the optional customer receipt cannot be sent.
      console.error("[Appointments] Customer receipt could not be sent.");
    }
    return json({
      received: true,
      status: "pending",
      reference,
      message: `Request received. Your appointment is not confirmed yet. Staff will reply to your email to confirm the time or arrange an alternative. Reference ${reference}.`,
    });
  } catch {
    // Keep contact details and SMTP credentials out of server logs.
    console.error("[Appointments] Request receipt could not be confirmed.");
    return json(
      {
        received: false,
        reference,
        retryAllowed: false,
        message: `We could not confirm that your request was sent. Call the showroom and quote ${reference} before submitting another request. Your appointment is not confirmed.`,
      },
      503,
    );
  }
}
