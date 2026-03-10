import { PostCard } from "@/components/content/PostCard";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import { getCollection } from "@/lib/content";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { styleGuideIndex } = pageContent;

export const metadata = buildMetadata({
  title: styleGuideIndex.metaTitle,
  description: styleGuideIndex.metaDescription,
  path: "/style-guide",
});

export default function StyleGuideIndexPage() {
  const posts = getCollection("style-guide");

  return (
    <>
      <PageHero title={styleGuideIndex.heroTitle} description={styleGuideIndex.heroDescription} />
      <WaveSection topWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow={styleGuideIndex.sectionEyebrow}
            title={styleGuideIndex.sectionTitle}
            description={styleGuideIndex.sectionDescription}
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
