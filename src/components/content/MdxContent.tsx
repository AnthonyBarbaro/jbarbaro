import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { useMdxComponents } from "@/lib/mdx-components";

type MdxContentProps = {
  source: string;
};

export function MdxContent({ source }: MdxContentProps) {
  return (
    <MDXRemote
      source={source}
      components={useMdxComponents({})}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "append" }]],
        },
      }}
    />
  );
}
