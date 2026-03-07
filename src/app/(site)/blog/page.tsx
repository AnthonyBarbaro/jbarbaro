import { PostCard } from "@/components/content/PostCard";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import { getBlogIndexContent } from "@/lib/cms";
import { getCollection } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const content = await getBlogIndexContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/blog",
  });
}

export default async function BlogIndexPage() {
  const [content, posts] = await Promise.all([getBlogIndexContent(), getCollection("blog")]);

  return (
    <>
      <PageHero title={content.heroTitle} description={content.heroDescription} />
      <WaveSection topWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow={content.sectionEyebrow}
            title={content.sectionTitle}
            description={content.sectionDescription}
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
