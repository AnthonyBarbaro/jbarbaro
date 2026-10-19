import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { locationMap } from "@/data/locations";
import { parseAppointmentDate } from "@/lib/appointments/time";
import { sendWeddingRegistrationEmails } from "@/lib/email";
import {
  formReference,
  formRequestIp,
  invalidForm,
  readFormJson,
  submissionEmailResponse,
} from "@/lib/form-request";
import { weddingRateLimiter } from "@/lib/rate-limit";
import type { WeddingRegistrationPayload } from "@/types/submissions";

export const runtime = "nodejs";

const weddingRegistrationSchema = z
  .object({
    requestId: z.uuid(),
    groomName: z.string().trim().min(2).max(120),
    brideName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(30),
    email: z.email().max(254),
    weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    numberGroomsmen: z.number().int().min(1).max(50),
    locationSlug: z.string().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
    website: z.string().max(200).optional(),
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const raw = await readFormJson(request);
  if (!raw.ok) return raw.response;
  const parsed = weddingRegistrationSchema.safeParse(raw.value);
  if (!parsed.success || parsed.data.website?.trim()) {
    return invalidForm("Please check your names, email, phone, wedding date, and party size.");
  }
  if (parsed.data.locationSlug && !Object.hasOwn(locationMap, parsed.data.locationSlug)) {
    return invalidForm("Choose a valid showroom.");
  }
  const weddingDate = parseAppointmentDate(parsed.data.weddingDate);
  if (!weddingDate) return invalidForm("Enter a valid wedding date.");
  const ip = formRequestIp(request);
  if (!weddingRateLimiter.check(ip).allowed) {
    return invalidForm("Too many submissions. Please try later or call the showroom.", 429);
  }
  const registration: WeddingRegistrationPayload = {
    reference: formReference("WDG", parsed.data.requestId),
    submittedAt: new Date(),
    groomName: parsed.data.groomName,
    brideName: parsed.data.brideName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    weddingDate,
    numberGroomsmen: parsed.data.numberGroomsmen,
    locationSlug: parsed.data.locationSlug || null,
    notes: parsed.data.notes || null,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
  try {
    const delivery = await sendWeddingRegistrationEmails(registration);
    return submissionEmailResponse(delivery, registration.reference, "wedding registration");
  } catch {
    console.error("[Wedding] Request receipt could not be confirmed.");
    return submissionEmailResponse(
      { internal: "UNKNOWN", customer: "SKIPPED" },
      registration.reference,
      "wedding registration",
    );
  }
}
