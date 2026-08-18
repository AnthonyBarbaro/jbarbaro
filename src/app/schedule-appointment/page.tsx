import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { appointmentLocations } from "@/data/locations";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { schedulePage, servicesPage } = pageContent;

export const metadata = buildMetadata({
  title: schedulePage.metaTitle,
  description: schedulePage.metaDescription,
  path: "/schedule-appointment",
});

export default function ScheduleAppointmentPage() {
  return (
    <>
      <PageHero title={schedulePage.hero.title} description={schedulePage.hero.description} />
      <WaveSection topWave="A" background="stone">
        <Container>
          <AppointmentForm
            locations={appointmentLocations}
            services={servicesPage.appointmentServices}
          />
        </Container>
      </WaveSection>
    </>
  );
}
