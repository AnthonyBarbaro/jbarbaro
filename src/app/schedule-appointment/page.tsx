import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { locations } from "@/data/locations";
import { appointmentServices } from "@/data/services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Schedule Appointment",
  description:
    "Schedule a menswear appointment at J. Barbaro Clothiers. Choose location, service type, and preferred date/time.",
  path: "/schedule-appointment",
});

export default function ScheduleAppointmentPage() {
  return (
    <>
      <PageHero
        title="Schedule an Appointment"
        description="Reserve one-on-one time for styling, tailoring, event wear, or a complete wardrobe refresh."
      />
      <WaveSection topWave="A" background="stone">
        <Container>
          <AppointmentForm locations={locations} services={appointmentServices} />
        </Container>
      </WaveSection>
    </>
  );
}
