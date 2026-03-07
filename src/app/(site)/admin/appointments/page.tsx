import { AppointmentStatus } from "@prisma/client";
import Link from "next/link";

import { logoutAdmin, updateAppointmentStatus } from "./actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Input, Select } from "@/components/ui/Field";
import { getLocations } from "@/lib/cms";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Admin Appointments",
  description: "Manage appointment submissions.",
  path: "/admin/appointments",
});

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; date?: string }>;
}) {
  const params = await searchParams;
  const locationFilter = params.location;
  const dateFilter = params.date;

  const filters: {
    locationSlug?: string;
    preferredDate?: {
      gte: Date;
      lt: Date;
    };
  } = {};

  if (locationFilter) {
    filters.locationSlug = locationFilter;
  }

  if (dateFilter) {
    const dateStart = new Date(`${dateFilter}T00:00:00`);
    const dateEnd = new Date(`${dateFilter}T23:59:59.999`);

    if (!Number.isNaN(dateStart.getTime())) {
      filters.preferredDate = {
        gte: dateStart,
        lt: dateEnd,
      };
    }
  }

  const appointments = await prisma.appointment.findMany({
    where: filters,
    orderBy: {
      createdAt: "desc",
    },
  });
  const locations = await getLocations();

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="teal">Admin</Badge>
          <h1 className="mt-3 font-heading text-3xl text-ink sm:text-5xl">Appointments Dashboard</h1>
          <p className="mt-1 text-sm text-smoke">View, filter, and update appointment request status.</p>
        </div>
        <form action={logoutAdmin}>
          <Button type="submit" variant="secondary" size="sm">
            Logout
          </Button>
        </form>
      </div>

      <Card className="mt-6">
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="location-filter" className="text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                Location
              </label>
              <Select id="location-filter" name="location" defaultValue={locationFilter || ""} className="mt-1">
                <option value="">All locations</option>
                {locations.map((location) => (
                  <option key={location.slug} value={location.slug}>
                    {location.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="date-filter" className="text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                Date
              </label>
              <Input id="date-filter" type="date" name="date" defaultValue={dateFilter || ""} className="mt-1" />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                Filter
              </Button>
              <Link
                href="/admin/appointments"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-ink/60 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-ink uppercase hover:border-gold hover:text-deep-teal"
              >
                Reset
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/10 bg-ivory luxe-shadow">
        <table className="min-w-[840px] w-full divide-y divide-ink/10 text-left text-sm">
          <thead className="bg-stone/70 text-xs font-semibold tracking-[0.08em] text-smoke uppercase">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Date/Time</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-4 py-3 text-smoke">{formatDate(appointment.createdAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{appointment.name}</p>
                  <p className="text-xs text-smoke">{appointment.email}</p>
                  <p className="text-xs text-smoke">{appointment.phone}</p>
                </td>
                <td className="px-4 py-3 text-smoke">{appointment.locationSlug}</td>
                <td className="px-4 py-3 text-smoke">
                  <p>{formatDate(appointment.preferredDate)}</p>
                  <p className="text-xs">{appointment.preferredTimeWindow}</p>
                </td>
                <td className="px-4 py-3">
                  <form action={updateAppointmentStatus} className="flex items-center gap-2">
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <Select name="status" defaultValue={appointment.status} className="mt-0 h-9 rounded-xl py-1 text-xs">
                      {Object.values(AppointmentStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                    <button type="submit" className="text-xs font-semibold tracking-[0.1em] text-deep-teal uppercase hover:text-gold">
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-smoke">No appointments match this filter.</p>
        ) : null}
      </div>
    </Container>
  );
}
