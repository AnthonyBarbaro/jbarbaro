import { PostCard } from "@/components/content/PostCard";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import { getCollection } from "@/lib/content";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { blogIndex } = pageContent;

export const metadata = buildMetadata({
  title: blogIndex.metaTitle,
  description: blogIndex.metaDescription,
  path: "/blog",
});

export default function BlogIndexPage() {
  const posts = getCollection("blog");

  return (
    <>
      <PageHero title={blogIndex.heroTitle} description={blogIndex.heroDescription} />
      <WaveSection topWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow={blogIndex.sectionEyebrow}
            title={blogIndex.sectionTitle}
            description={blogIndex.sectionDescription}
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
