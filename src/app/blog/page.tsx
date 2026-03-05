import { PostCard } from "@/components/content/PostCard";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import { getCollection } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog",
  description: "Menswear insights, tailoring guides, and seasonal updates from J. Barbaro Clothiers.",
  path: "/blog",
});

export default function BlogIndexPage() {
  const posts = getCollection("blog");

  return (
    <>
      <PageHero
        title="Blog"
        description="Menswear insight from our team on fit, tailoring, seasonal transitions, and occasion styling."
      />
      <WaveSection topWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow="Editorial Journal"
            title="Latest Stories"
            description="Practical advice and inspiration designed for modern professional wardrobes."
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
