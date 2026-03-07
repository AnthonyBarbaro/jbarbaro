import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import type { ContentPost, ContentType } from "@/types/content";

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

export function getFileCollection(type: ContentType): ContentPost[] {
  const collectionPath = getCollectionPath(type);

  if (!fs.existsSync(collectionPath)) {
    return [];
  }

  return fs
    .readdirSync(collectionPath)
    .filter((entry) => entry.endsWith(".mdx"))
    .map((filename) => parsePostFile(type, filename))
    .sort((left, right) => +new Date(right.publishedAt) - +new Date(left.publishedAt));
}

export function getFilePostBySlug(type: ContentType, slug: string) {
  const filePath = path.join(getCollectionPath(type), `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return parsePostFile(type, `${slug}.mdx`);
}
