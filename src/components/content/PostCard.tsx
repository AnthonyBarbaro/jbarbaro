import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { ContentPost } from "@/types/content";
import { formatDate } from "@/lib/utils";

type PostCardProps = {
  post: ContentPost;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="group h-full transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <Badge variant="gold">{post.type === "blog" ? "Blog" : "Style Guide"}</Badge>
        </div>
      </div>
      <CardContent className="flex h-full flex-col">
        <p className="text-xs tracking-[0.14em] text-smoke uppercase">{formatDate(post.publishedAt)}</p>
        <h3 className="mt-3 font-heading text-2xl leading-tight text-ink">{post.title}</h3>
        <p className="mt-3 text-sm leading-7 text-smoke">{post.description}</p>
        <Link
          href={`/${post.type}/${post.slug}`}
          className="mt-5 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
        >
          Read More
        </Link>
      </CardContent>
    </Card>
  );
}
