import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { locationMap } from "@/data/locations";
import { sendAppointmentEmails } from "@/lib/email";
import { getHolidayName, isClosedHoliday } from "@/lib/holidays";
import { getAvailableTimeSlots } from "@/lib/hours";
import { createSubmissionReference } from "@/lib/submission-reference";
import type { Location } from "@/types/site";
import type { AppointmentSubmissionPayload } from "@/types/submissions";

const appointmentSchema = z.object({
  locationSlug: z.string().min(1),
  serviceType: z.string().min(2),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTimeWindow: z.string().min(5),
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(7),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

const availabilitySchema = z.object({
  locationSlug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type LiveAvailabilityError = {
  error: string;
};

type LiveAvailabilitySuccess = {
  location: Location;
  selectedDate: Date;
  availableSlots: string[];
  message?: string;
};

async function getLiveAvailability(
  locationSlug: string,
  isoDate: string,
): Promise<LiveAvailabilityError | LiveAvailabilitySuccess> {
  const location = locationMap[locationSlug];

  if (!location) {
    return { error: "Invalid location selected." } as LiveAvailabilityError;
  }

  const selectedDate = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return { error: "Invalid preferred date." } as LiveAvailabilityError;
  }

  const allSlots = getAvailableTimeSlots(location, selectedDate);

  if (allSlots.length === 0) {
    const holidayName = getHolidayName(selectedDate);
    return {
      location,
      selectedDate,
      availableSlots: [],
      message: holidayName
        ? `This location is closed for ${holidayName}.`
        : "This location is closed on the selected date.",
    } as LiveAvailabilitySuccess;
  }

  return {
    location,
    selectedDate,
    availableSlots: allSlots,
    message: allSlots.length === 0 ? "No appointment times are available for this date. Please choose another day." : undefined,
  } as LiveAvailabilitySuccess;
}

export async function GET(request: NextRequest) {
  const queryPayload = {
    locationSlug: request.nextUrl.searchParams.get("locationSlug") || "",
    date: request.nextUrl.searchParams.get("date") || "",
  };
  const parsed = availabilitySchema.safeParse(queryPayload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid availability query." }, { status: 400 });
  }

  const availability = await getLiveAvailability(parsed.data.locationSlug, parsed.data.date);

  if ("error" in availability) {
    return NextResponse.json({ message: availability.error }, { status: 400 });
  }

  return NextResponse.json({
    availableSlots: availability.availableSlots,
    message: availability.message,
  });
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = appointmentSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid appointment form data." }, { status: 400 });
    }

    const payload = parsed.data;
    const location = locationMap[payload.locationSlug];

    if (!location) {
      return NextResponse.json({ message: "Invalid location selected." }, { status: 400 });
    }

    const preferredDate = new Date(`${payload.preferredDate}T00:00:00`);

    if (Number.isNaN(preferredDate.getTime())) {
      return NextResponse.json({ message: "Invalid preferred date." }, { status: 400 });
    }

    if (isClosedHoliday(preferredDate)) {
      const holidayName = getHolidayName(preferredDate);
      return NextResponse.json(
        {
          message: `The selected location is closed for ${holidayName || "this holiday"}.`,
        },
        { status: 400 },
      );
    }

    const liveAvailability = await getLiveAvailability(payload.locationSlug, payload.preferredDate);

    if ("error" in liveAvailability) {
      return NextResponse.json({ message: liveAvailability.error }, { status: 400 });
    }

    if (!liveAvailability.availableSlots.includes(payload.preferredTimeWindow)) {
      return NextResponse.json(
        {
          message: "That appointment time is not available for the selected date. Please choose another available slot.",
          availableSlots: liveAvailability.availableSlots,
        },
        { status: 400 },
      );
    }

    const appointment: AppointmentSubmissionPayload = {
      reference: createSubmissionReference("APT"),
      submittedAt: new Date(),
      locationSlug: payload.locationSlug,
      serviceType: payload.serviceType,
      preferredDate,
      preferredTimeWindow: payload.preferredTimeWindow,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      notes: payload.notes || null,
    };

    const delivery = await sendAppointmentEmails(appointment);
    const emailMessage =
      delivery.customer === "SENT"
        ? "A confirmation email with calendar options has been sent."
        : "We received your request and will follow up by email shortly.";

    return NextResponse.json({
      reference: appointment.reference,
      message: `${emailMessage} Reference ${appointment.reference}.`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}
