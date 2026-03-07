import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { getLocations, getSchedulePageContent, getServicesContent } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const content = await getSchedulePageContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/schedule-appointment",
  });
}

export default async function ScheduleAppointmentPage() {
  const [content, locations, servicesContent] = await Promise.all([
    getSchedulePageContent(),
    getLocations(),
    getServicesContent(),
  ]);

  return (
    <>
      <PageHero title={content.hero.title} description={content.hero.description} />
      <WaveSection topWave="A" background="stone">
        <Container>
          <AppointmentForm locations={locations} services={servicesContent.appointmentServices} />
        </Container>
      </WaveSection>
    </>
  );
}
