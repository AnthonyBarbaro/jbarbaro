import { SeoJsonLd } from "@/components/SeoJsonLd";
import { BrandSearch } from "@/components/designers/BrandSearch";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { brands } from "@/data/brands";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata = buildMetadata({
  title: "All Designer Brands",
  description:
    "Browse all designer brands available at J. Barbaro Clothiers with quick search and A-Z filtering.",
  path: "/designers/all-designer-brands",
});

const crumbs = [
  { name: "Home", href: "/" },
  { name: "Designers", href: "/designers" },
  { name: "All Designer Brands", href: "/designers/all-designer-brands" },
];

export default function AllDesignerBrandsPage() {
  const grouped = brands.reduce<Record<string, typeof brands>>((acc, brand) => {
    const letter = brand.name.charAt(0).toUpperCase();

    if (!acc[letter]) {
      acc[letter] = [];
    }

    acc[letter].push(brand);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort();

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Designers", path: "/designers" },
          { name: "All Designer Brands", path: "/designers/all-designer-brands" },
        ])}
      />
      <Breadcrumbs items={crumbs} />
      <PageHero title="All Designer Brands" description="Search, filter, and browse our complete A–Z designer directory." />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <BrandSearch brands={brands} />
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <Card>
            <CardContent>
              <Badge variant="gold">A–Z Jump</Badge>
              <div className="mt-4 overflow-x-auto pb-1">
                <div className="flex w-max gap-2">
                  {letters.map((letter) => (
                    <a
                      key={letter}
                      href={`#letter-${letter}`}
                      className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold tracking-[0.1em] text-ink uppercase hover:border-gold hover:text-deep-teal"
                    >
                      {letter}
                    </a>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {letters.map((letter) => (
              <Card key={letter} id={`letter-${letter}`}>
                <CardContent>
                  <h2 className="font-heading text-3xl text-ink sm:text-4xl">{letter}</h2>
                  <ul className="mt-3 space-y-2 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                    {grouped[letter]
                      .sort((left, right) => left.name.localeCompare(right.name))
                      .map((brand) => (
                        <li key={brand.slug}>
                          <a href={`/collection-brand/${brand.slug}`} className="hover:text-deep-teal">
                            {brand.name}
                          </a>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
