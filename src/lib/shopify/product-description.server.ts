import "server-only";

import sanitizeHtml from "sanitize-html";

const approvedImageHosts = new Set(["cdn.shopify.com", "jasonbarbaro.com", "www.jasonbarbaro.com"]);

function isApprovedImageSource(src: string | undefined): boolean {
  if (!src) {
    return false;
  }

  try {
    if (src.startsWith("/")) {
      const baseUrl = "https://description.example.invalid";
      const url = new URL(src, baseUrl);

      return url.origin === baseUrl && url.pathname.startsWith("/images/");
    }

    const url = new URL(src);

    return (
      url.protocol === "https:" &&
      approvedImageHosts.has(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function sanitizeProductDescriptionHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "a",
      "p",
      "div",
      "span",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "br",
      "hr",
      "img",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "small",
      "sub",
      "sup",
      "blockquote",
      "code",
      "pre",
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      "table",
      "caption",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height"],
      ol: ["start"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame: sanitizeHtml.IFrame): boolean =>
      frame.tag === "img" && !isApprovedImageSource(frame.attribs.src),
    nonTextTags: [
      "script",
      "style",
      "textarea",
      "option",
      "xmp",
      "svg",
      "math",
      "iframe",
      "object",
      "embed",
      "template",
      "noscript",
    ],
  });
}
