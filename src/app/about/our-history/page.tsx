import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata = buildMetadata({
  title: "Our History",
  description:
    "Read the story behind J. Barbaro Clothiers and how our heritage in premium menswear continues to shape service today.",
  path: "/about/our-history",
});

const crumbs = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Our History", href: "/about/our-history" },
];

const milestones = [
  {
    year: "Foundation",
    title: "Built on Fit-First Service",
    detail:
      "J. Barbaro Clothiers began with a commitment to expert fit guidance and personalized menswear recommendations.",
  },
  {
    year: "Growth",
    title: "Expanding Across Metro Detroit",
    detail:
      "As demand grew, additional location coverage made premium styling and tailoring more accessible.",
  },
  {
    year: "Today",
    title: "Luxury Retail, Modern Experience",
    detail:
      "The brand continues to merge old-school service values with contemporary designer curation and digital convenience.",
  },
];

export default function OurHistoryPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
          { name: "Our History", path: "/about/our-history" },
        ])}
      />
      <Breadcrumbs items={crumbs} />

      <PageHero
        title="Our History"
        description="A legacy of style, fit, and personal service carried forward with a modern menswear perspective."
      />

      <WaveSection topWave="B" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            {milestones.map((milestone) => (
              <Card key={milestone.title} className="h-full">
                <CardContent>
                  <p className="text-xs font-semibold tracking-[0.16em] text-deep-teal uppercase">{milestone.year}</p>
                  <h2 className="mt-3 font-heading text-2xl text-ink sm:text-3xl">{milestone.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{milestone.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <Card className="bg-ink text-ivory">
            <CardContent>
              <h2 className="font-heading text-3xl sm:text-4xl">Experience the Next Chapter</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ivory/80">
                Book a one-on-one appointment and experience our modern approach to luxury menswear, tailoring, and wardrobe planning.
              </p>
              <ButtonLink href="/schedule-appointment" className="mt-6 w-full sm:w-auto">
                Book an Appointment
              </ButtonLink>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
