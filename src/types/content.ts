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
