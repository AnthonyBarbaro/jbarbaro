import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { ContentPost } from "@/types/content";
import { formatDate } from "@/lib/utils";

type NewsCheckerboardProps = {
  posts: ContentPost[];
};

export function NewsCheckerboard({ posts }: NewsCheckerboardProps) {
  if (!posts.length) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="teal">Editorial</Badge>
            <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Latest News & Style Stories</h2>
          </div>
          <Link href="/blog" className="text-sm font-semibold tracking-[0.12em] text-deep-teal uppercase hover:text-gold">
            View All Articles
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {posts.map((post, index) => (
            <article
              key={post.slug}
              className="group grid min-h-[260px] overflow-hidden rounded-3xl border border-ink/10 bg-ivory md:grid-cols-2"
            >
              <div className={`${index % 2 === 1 ? "md:order-2" : ""} relative`}>
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 md:p-8">
                <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">{formatDate(post.publishedAt)}</p>
                <h3 className="mt-3 font-heading text-3xl leading-tight text-ink">{post.title}</h3>
                <p className="mt-3 text-sm leading-7 text-smoke">{post.description}</p>
                <Link
                  href={`/${post.type}/${post.slug}`}
                  className="mt-5 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
                >
                  Read Story
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
