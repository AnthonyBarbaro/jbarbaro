import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { locationMap } from "@/data/locations";
import { sendWeddingRegistrationEmails } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { weddingRateLimiter } from "@/lib/rate-limit";

const weddingRegistrationSchema = z.object({
  groomName: z.string().min(2),
  brideName: z.string().min(2),
  phone: z.string().min(7).max(30),
  email: z.email(),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  numberGroomsmen: z.number().int().min(1).max(50),
  locationSlug: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
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
    const parsed = weddingRegistrationSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid wedding registration data." }, { status: 400 });
    }

    if (parsed.data.website && parsed.data.website.trim() !== "") {
      return NextResponse.json({ message: "Registration received." }, { status: 200 });
    }

    if (parsed.data.locationSlug && !locationMap[parsed.data.locationSlug]) {
      return NextResponse.json({ message: "Invalid location selected." }, { status: 400 });
    }

    const weddingDate = new Date(`${parsed.data.weddingDate}T00:00:00`);

    if (Number.isNaN(weddingDate.getTime())) {
      return NextResponse.json({ message: "Invalid wedding date." }, { status: 400 });
    }

    const ip = getRequestIp(request);
    const rateCheck = weddingRateLimiter.check(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          message: "Too many submissions from this IP. Please try again later.",
        },
        { status: 429 },
      );
    }

    const registration = await prisma.weddingRegistration.create({
      data: {
        groomName: parsed.data.groomName,
        brideName: parsed.data.brideName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        weddingDate,
        numberGroomsmen: parsed.data.numberGroomsmen,
        locationSlug: parsed.data.locationSlug || null,
        notes: parsed.data.notes || null,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
      },
    });

    const delivery = await sendWeddingRegistrationEmails(registration);
    const deliveryMessage =
      delivery.customer === "SENT"
        ? `Wedding registration submitted. Reference #${registration.id}. A confirmation email has been sent.`
        : `Wedding registration submitted. Reference #${registration.id}.`;

    return NextResponse.json({
      message: deliveryMessage,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}
