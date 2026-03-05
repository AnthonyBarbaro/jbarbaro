import { AdminLoginForm } from "@/components/appointments/AdminLoginForm";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin Login",
  description: "Admin access for appointment dashboard.",
  path: "/admin/login",
});

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/admin/appointments";

  return (
    <>
      <PageHero title="Admin Access" description="Secure login for appointment management dashboard." />
      <WaveSection topWave="A" background="stone">
        <Container>
          <AdminLoginForm nextPath={nextPath} />
        </Container>
      </WaveSection>
    </>
  );
}
