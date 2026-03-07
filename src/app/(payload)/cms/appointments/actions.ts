"use server";

import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { updateAppointmentStatusRecord } from "@/lib/appointments";
import { requirePayloadAdmin } from "@/lib/payload-admin";

export async function updateCmsAppointmentStatus(formData: FormData) {
  await requirePayloadAdmin("/cms/appointments");

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

  revalidatePath("/cms/appointments");
}
