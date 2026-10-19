import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendContactSubmissionEmails } from "@/lib/email";
import {
  formReference,
  formRequestIp,
  invalidForm,
  readFormJson,
  submissionEmailResponse,
} from "@/lib/form-request";
import { contactRateLimiter } from "@/lib/rate-limit";
import type { ContactSubmissionPayload } from "@/types/submissions";

export const runtime = "nodejs";

const contactSchema = z
  .object({
    requestId: z.uuid(),
    name: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    phone: z.string().trim().max(30).optional(),
    message: z.string().trim().min(8).max(2000),
    website: z.string().max(200).optional(),
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const raw = await readFormJson(request);
  if (!raw.ok) return raw.response;
  const parsed = contactSchema.safeParse(raw.value);
  if (!parsed.success || parsed.data.website?.trim()) {
    return invalidForm("Please check your name, email, phone, and message.");
  }
  const ip = formRequestIp(request);
  if (!contactRateLimiter.check(ip).allowed) {
    return invalidForm("Too many submissions. Please try later or call the showroom.", 429);
  }
  const submission: ContactSubmissionPayload = {
    reference: formReference("CTC", parsed.data.requestId),
    submittedAt: new Date(),
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    message: parsed.data.message,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
  try {
    const delivery = await sendContactSubmissionEmails(submission);
    return submissionEmailResponse(delivery, submission.reference, "message");
  } catch {
    console.error("[Contact] Request receipt could not be confirmed.");
    return submissionEmailResponse(
      { internal: "UNKNOWN", customer: "SKIPPED" },
      submission.reference,
      "message",
    );
  }
}
