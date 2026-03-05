import { AppointmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { locationMap } from "@/data/locations";
import { sendAppointmentConfirmationEmail } from "@/lib/email";
import { getHolidayName, isClosedHoliday } from "@/lib/holidays";
import { getAvailableTimeSlots } from "@/lib/hours";
import { prisma } from "@/lib/prisma";
import type { Location } from "@/types/site";

const ACTIVE_APPOINTMENT_STATUSES = [AppointmentStatus.NEW, AppointmentStatus.CONFIRMED] as const;

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
  bookedSlots: string[];
  message?: string;
};

function getDateRange(isoDate: string) {
  const start = new Date(`${isoDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function getBookedSlots(locationSlug: string, isoDate: string) {
  const { start, end } = getDateRange(isoDate);
  const appointments = await prisma.appointment.findMany({
    where: {
      locationSlug,
      preferredDate: {
        gte: start,
        lt: end,
      },
      status: {
        in: [...ACTIVE_APPOINTMENT_STATUSES],
      },
    },
    select: {
      preferredTimeWindow: true,
    },
  });

  return new Set(appointments.map((appointment) => appointment.preferredTimeWindow));
}

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
      bookedSlots: [],
      message: holidayName
        ? `This location is closed for ${holidayName}.`
        : "This location is closed on the selected date.",
    } as LiveAvailabilitySuccess;
  }

  const bookedSlots = await getBookedSlots(locationSlug, isoDate);
  const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

  return {
    location,
    selectedDate,
    availableSlots,
    bookedSlots: [...bookedSlots],
    message:
      availableSlots.length === 0
        ? "All appointment times are booked for this date. Please choose another day."
        : undefined,
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
    bookedSlots: availability.bookedSlots,
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
          message: "That time was just booked. Please choose another available slot.",
          availableSlots: liveAvailability.availableSlots,
        },
        { status: 409 },
      );
    }

    const { start, end } = getDateRange(payload.preferredDate);
    const alreadyBooked = await prisma.appointment.findFirst({
      where: {
        locationSlug: payload.locationSlug,
        preferredDate: {
          gte: start,
          lt: end,
        },
        preferredTimeWindow: payload.preferredTimeWindow,
        status: {
          in: [...ACTIVE_APPOINTMENT_STATUSES],
        },
      },
      select: {
        id: true,
      },
    });

    if (alreadyBooked) {
      return NextResponse.json(
        {
          message: "That appointment slot is no longer available. Please pick a different time.",
          availableSlots: liveAvailability.availableSlots.filter(
            (slot) => slot !== payload.preferredTimeWindow,
          ),
        },
        { status: 409 },
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        locationSlug: payload.locationSlug,
        serviceType: payload.serviceType,
        preferredDate,
        preferredTimeWindow: payload.preferredTimeWindow,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        notes: payload.notes || null,
      },
    });

    const emailStatus = await sendAppointmentConfirmationEmail(appointment);
    const emailMessage =
      emailStatus === "SENT"
        ? "A confirmation email with calendar options has been sent."
        : "We received your request and will email your confirmation shortly.";

    return NextResponse.json({
      appointmentId: appointment.id,
      message: `${emailMessage} Reference #${appointment.id}.`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}
