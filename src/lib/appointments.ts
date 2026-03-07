import { AppointmentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function updateAppointmentStatusRecord(args: {
  appointmentId: number;
  status: AppointmentStatus;
}) {
  const { appointmentId, status } = args;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      locationSlug: true,
      preferredDate: true,
      preferredTimeWindow: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  if (status === AppointmentStatus.NEW || status === AppointmentStatus.CONFIRMED) {
    const dateStart = new Date(appointment.preferredDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const conflict = await prisma.appointment.findFirst({
      where: {
        id: {
          not: appointment.id,
        },
        locationSlug: appointment.locationSlug,
        preferredDate: {
          gte: dateStart,
          lt: dateEnd,
        },
        preferredTimeWindow: appointment.preferredTimeWindow,
        status: {
          in: [AppointmentStatus.NEW, AppointmentStatus.CONFIRMED],
        },
      },
      select: {
        id: true,
      },
    });

    if (conflict) {
      throw new Error("This time slot is already booked by another active appointment.");
    }
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status,
    },
  });
}
