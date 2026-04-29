import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendNewsletterSignupEmail } from "@/lib/email";
import { newsletterRateLimiter } from "@/lib/rate-limit";
import { createSubmissionReference } from "@/lib/submission-reference";
import type { NewsletterSignupPayload } from "@/types/submissions";

const newsletterSchema = z.object({
  email: z.email(),
  source: z.string().min(2).max(80),
  website: z.string().optional(),
});

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }

  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = newsletterSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }

    if (parsed.data.website && parsed.data.website.trim() !== "") {
      return NextResponse.json({ message: "You're on the list." }, { status: 200 });
    }

    const ip = getRequestIp(request);
    const rateCheck = newsletterRateLimiter.check(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json({ message: "Too many signups from this IP. Please try again later." }, { status: 429 });
    }

    const signup: NewsletterSignupPayload = {
      reference: createSubmissionReference("NWS"),
      submittedAt: new Date(),
      email: parsed.data.email,
      source: parsed.data.source,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent"),
    };

    await sendNewsletterSignupEmail(signup);

    return NextResponse.json({ message: "You're on the list." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}
