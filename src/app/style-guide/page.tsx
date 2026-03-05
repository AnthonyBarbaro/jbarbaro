import { PostCard } from "@/components/content/PostCard";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import { getCollection } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Style Guide",
  description:
    "Practical style guides for building a modern menswear wardrobe, from business casual to event-ready looks.",
  path: "/style-guide",
});

export default function StyleGuideIndexPage() {
  const posts = getCollection("style-guide");

  return (
    <>
      <PageHero
        title="Style Guide"
        description="Actionable frameworks from our stylists to help you dress well with less effort and better consistency."
      />
      <WaveSection topWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow="Practical Styling"
            title="Guides You Can Apply Today"
            description="From business casual planning to event dressing, each guide is built for real-world use."
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
