"use server";

import { AppointmentStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ADMIN_COOKIE_NAME } from "@/lib/constants";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function updateAppointmentStatus(formData: FormData) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    throw new Error("Unauthorized");
  }

  const appointmentId = Number(formData.get("appointmentId"));
  const status = formData.get("status");
  const statusValues = Object.values(AppointmentStatus);

  if (
    !appointmentId ||
    typeof status !== "string" ||
    !statusValues.includes(status as AppointmentStatus)
  ) {
    throw new Error("Invalid appointment status update payload");
  }

  const nextStatus = status as AppointmentStatus;
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

  if (nextStatus === AppointmentStatus.NEW || nextStatus === AppointmentStatus.CONFIRMED) {
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
      status: nextStatus,
    },
  });

  revalidatePath("/admin/appointments");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  revalidatePath("/admin/appointments");
}
