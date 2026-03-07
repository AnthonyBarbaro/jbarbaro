"use server";

import { AppointmentStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { updateAppointmentStatusRecord } from "@/lib/appointments";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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

  await updateAppointmentStatusRecord({
    appointmentId,
    status: status as AppointmentStatus,
  });

  revalidatePath("/admin/appointments");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  revalidatePath("/admin/appointments");
}
