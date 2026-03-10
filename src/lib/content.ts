import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

export type ContentType = "blog" | "style-guide";

export type ContentPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  coverImage: string;
  tags: string[];
  body: string;
  type: ContentType;
};

const contentRoot = path.join(process.cwd(), "content");

function getCollectionPath(type: ContentType) {
  return path.join(contentRoot, type);
}

function parsePostFile(type: ContentType, filename: string): ContentPost {
  const slug = filename.replace(/\.mdx$/, "");
  const fullPath = path.join(getCollectionPath(type), filename);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: String(data.title),
    description: String(data.description),
    publishedAt: String(data.publishedAt),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    author: String(data.author || "J. Barbaro Editorial Team"),
    coverImage: String(data.coverImage || "/images/og-default.svg"),
    tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : [],
    body: content,
    type,
  };
}

export function getCollection(type: ContentType): ContentPost[] {
  const collectionPath = getCollectionPath(type);

  if (!fs.existsSync(collectionPath)) {
    return [];
  }

  return fs
    .readdirSync(collectionPath)
    .filter((entry) => entry.endsWith(".mdx"))
    .map((filename) => parsePostFile(type, filename))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export function getPostBySlug(type: ContentType, slug: string) {
  const filePath = path.join(getCollectionPath(type), `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return parsePostFile(type, `${slug}.mdx`);
}

export function getCollectionSlugs(type: ContentType) {
  return getCollection(type).map((post) => post.slug);
}

export function getFeaturedPosts(limit = 3) {
  return getCollection("blog").slice(0, limit);
}
