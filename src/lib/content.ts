import type { ContentPost, ContentType } from "@/types/content";

import { getPostBySlug as getCmsPostBySlug, getPosts } from "@/lib/cms";

export type { ContentPost, ContentType } from "@/types/content";

export async function getCollection(type: ContentType): Promise<ContentPost[]> {
  return getPosts(type);
}

export async function getPostBySlug(type: ContentType, slug: string) {
  return getCmsPostBySlug(type, slug);
}

export async function getCollectionSlugs(type: ContentType) {
  const posts = await getCollection(type);
  return posts.map((post) => post.slug);
}

export async function getFeaturedPosts(limit = 3) {
  const posts = await getCollection("blog");
  return posts.slice(0, limit);
}
