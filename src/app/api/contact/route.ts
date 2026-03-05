import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendContactSubmissionEmails } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { contactRateLimiter } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  message: z.string().min(8).max(2000),
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
    const parsed = contactSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid contact form data." }, { status: 400 });
    }

    if (parsed.data.website && parsed.data.website.trim() !== "") {
      return NextResponse.json({ message: "Message received." }, { status: 200 });
    }

    const ip = getRequestIp(request);
    const rateCheck = contactRateLimiter.check(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          message: "Too many submissions from this IP. Please try again later.",
        },
        { status: 429 },
      );
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
      },
    });

    const delivery = await sendContactSubmissionEmails(submission);
    const deliveryMessage =
      delivery.customer === "SENT"
        ? ` Message sent. A confirmation email has been sent. Reference #${submission.id}.`
        : ` Message sent. Reference #${submission.id}.`;

    return NextResponse.json({ message: deliveryMessage.trim() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}
