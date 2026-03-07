import { AppointmentStatus } from "@prisma/client";
import Link from "next/link";

import { updateCmsAppointmentStatus } from "./actions";
import { getLocations } from "@/lib/cms";
import { requirePayloadAdmin } from "@/lib/payload-admin";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{
    date?: string;
    location?: string;
  }>;
};

export default async function CmsAppointmentsPage({ searchParams }: PageProps) {
  await requirePayloadAdmin("/cms/appointments");

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

  const [appointments, locations] = await Promise.all([
    prisma.appointment.findMany({
      where: filters,
      orderBy: {
        createdAt: "desc",
      },
    }),
    getLocations(),
  ]);

  return (
    <main className="jb-admin-page">
      <div className="jb-admin-page__header">
        <div>
          <p className="jb-admin-page__eyebrow">Operations</p>
          <h1 className="jb-admin-page__title">Appointments</h1>
          <p className="jb-admin-page__copy">Manage appointment requests from the public booking form without leaving the CMS.</p>
        </div>
        <Link className="jb-admin-page__link" href="/cms">
          Back to CMS
        </Link>
      </div>

      <section className="jb-admin-panel jb-admin-panel--filters">
        <form className="jb-admin-filter-grid">
          <label className="jb-admin-control">
            <span className="jb-admin-control__label">Location</span>
            <select className="jb-admin-control__input" defaultValue={locationFilter || ""} name="location">
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location.slug} value={location.slug}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label className="jb-admin-control">
            <span className="jb-admin-control__label">Date</span>
            <input className="jb-admin-control__input" defaultValue={dateFilter || ""} name="date" type="date" />
          </label>

          <div className="jb-admin-filter-actions">
            <button className="jb-admin-button jb-admin-button--primary" type="submit">
              Filter
            </button>
            <Link className="jb-admin-button" href="/cms/appointments">
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="jb-admin-panel jb-admin-panel--table">
        <div className="jb-admin-table-wrap">
          <table className="jb-admin-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Client</th>
                <th>Service</th>
                <th>Location</th>
                <th>Date / Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{formatDate(appointment.createdAt)}</td>
                  <td>
                    <div className="jb-admin-table__stack">
                      <strong>{appointment.name}</strong>
                      <span>{appointment.email}</span>
                      <span>{appointment.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="jb-admin-table__stack">
                      <strong>{appointment.serviceType}</strong>
                      <span>Ref #{appointment.id}</span>
                    </div>
                  </td>
                  <td>{appointment.locationSlug}</td>
                  <td>
                    <div className="jb-admin-table__stack">
                      <strong>{formatDate(appointment.preferredDate)}</strong>
                      <span>{appointment.preferredTimeWindow}</span>
                    </div>
                  </td>
                  <td>
                    <form action={updateCmsAppointmentStatus} className="jb-admin-status-form">
                      <input name="appointmentId" type="hidden" value={appointment.id} />
                      <select className="jb-admin-control__input" defaultValue={appointment.status} name="status">
                        {Object.values(AppointmentStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button className="jb-admin-button jb-admin-button--primary" type="submit">
                        Save
                      </button>
                    </form>
                    {appointment.notes ? <p className="jb-admin-table__note">{appointment.notes}</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {appointments.length === 0 ? (
          <div className="jb-admin-empty">
            <p className="jb-admin-empty__title">No appointments match this filter.</p>
            <p className="jb-admin-empty__copy">Try a different location, date, or clear the filters.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
