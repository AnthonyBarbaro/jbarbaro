import Link from "next/link";
import { notFound } from "next/navigation";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { MdxContent } from "@/components/content/MdxContent";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { getCollectionSlugs, getPostBySlug } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return getCollectionSlugs("blog").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug("blog", slug);

  if (!post) {
    return {};
  }

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug("blog", slug);

  if (!post) {
    notFound();
  }

  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  const articleData = articleJsonLd({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    image: post.coverImage,
    author: post.author,
  });

  return (
    <>
      <SeoJsonLd data={[breadcrumbData, articleData]} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      <WaveSection topWave="B" bottomWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase">{formatDate(post.publishedAt)}</p>
            <h1 className="mt-4 font-heading text-3xl leading-tight text-ink sm:text-5xl lg:text-6xl">{post.title}</h1>
            <p className="mt-4 text-sm font-semibold tracking-[0.08em] text-smoke uppercase">By {post.author}</p>
            <p className="mt-6 text-lg leading-8 text-smoke">{post.description}</p>

            <div className="mt-10 rounded-3xl border border-ink/10 bg-ivory p-3 sm:mt-12 sm:px-6 sm:py-6">
              <MdxContent source={post.body} />
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <Card tone="stone">
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">Ready for In-Person Guidance?</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">
                    Book an appointment and we&apos;ll translate these recommendations into a curated fitting session.
                  </p>
                  <ButtonLink href="/schedule-appointment" className="mt-5">
                    Book Appointment
                  </ButtonLink>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">Continue Reading</h2>
                  <Link href="/style-guide" className="mt-3 block text-sm text-deep-teal hover:text-gold">
                    Explore Style Guide →
                  </Link>
                  <Link href="/blog" className="mt-2 block text-sm text-deep-teal hover:text-gold">
                    Back to Blog Index →
                  </Link>
                </CardContent>
              </Card>
            </div>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
