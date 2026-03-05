type SeoJsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

function safeJson(data: Record<string, unknown> | Array<Record<string, unknown>>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function SeoJsonLd({ data }: SeoJsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(data) }} />;
}
