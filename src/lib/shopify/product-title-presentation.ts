import { getProductDisplayTitle } from "@/lib/shopify/product-title";

type ProductTitlePresentationInput = {
  title: string;
  vendor?: string | null;
  productType?: string | null;
};

// Descriptive names based on the matching merchant product photos; no fabric or fit inferred.
const photographedCanaliTitles: Record<string, string> = {
  "Canali Sport Coat CF00142/399": "Canali Windowpane Sport Coat — Navy",
  "Canali Sport Coat CF06192/111": "Canali Check Sport Coat",
  "Canali Sport Coat CU06189/111": "Canali Textured Sport Coat — Charcoal",
  "Canali Sport Coat CU04651/703": "Canali Textured Sport Coat — Beige",
  "Canali Tuxedos BF00263/311 Navy": "Canali Tuxedo — Navy",
  "Canali Tuxedos BF00263/105 Blk": "Canali Tuxedo — Black",
};

const vendorDisplayNames: Record<string, string> = {
  "renoir fashion": "Renoir",
  "sand triluxe apparel group": "Sand",
  "desoto railtown apparel group": "Desoto",
  "mattarazi unomo inc": "Mattarazi",
  "fabian couture group int ' l": "Fabian Couture",
  "joe's": "Joe's",
  "gimo's": "Gimo's",
  "j barbaro clothiers": "J. Barbaro Clothiers",
  jbarbaro: "J. Barbaro Clothiers",
};

// A supplier can carry several retail brands. Match the brand named on this product.
const retailBrandRules: Array<{ vendor: string; pattern: RegExp; brand: string }> = [
  { vendor: "gruppo bravo menswear", pattern: /\bMantoni\b/i, brand: "Mantoni" },
  { vendor: "gruppo bravo menswear", pattern: /\bEnzo\b/i, brand: "Enzo" },
  {
    vendor: "gruppo bravo menswear",
    pattern: /\bG(?:iorgio|riogio) Fiorelli\b/i,
    brand: "Giorgio Fiorelli",
  },
  { vendor: "sartorial apparel group", pattern: /\bBarocci\b/i, brand: "Barocci" },
  { vendor: "scott barber", pattern: /\bEterna\b/i, brand: "Eterna" },
  { vendor: "alberto", pattern: /\bMilestone\b/i, brand: "Milestone" },
  { vendor: "eros clothing inc", pattern: /\b7 Downie St\b/i, brand: "7 Downie St." },
  { vendor: "j barbaro clothiers", pattern: /\bFlorsheim\b/i, brand: "Florsheim" },
  { vendor: "schuler 4 clothing", pattern: /\bAlberto\b/i, brand: "Alberto" },
  { vendor: "isiand footwear", pattern: /\bAsher Green\b/i, brand: "Asher Green" },
  { vendor: "isiand footwear", pattern: /\bAmali\b/i, brand: "Amali" },
  { vendor: "renoir fashion", pattern: /\bAlessandro Vitello\b/i, brand: "Alessandro Vitello" },
  { vendor: "sand triluxe apparel group", pattern: /\bJerry Key\b/i, brand: "Jerry Key" },
  { vendor: "f/x fusion", pattern: /^Trend\b/i, brand: "Trend" },
  { vendor: "jbarbaro", pattern: /^Barbaro Limited\b/i, brand: "Barbaro Limited" },
];

export function getProductDisplayBrand({ title, vendor }: ProductTitlePresentationInput): string {
  const vendorName = vendor?.trim() ?? "";
  const vendorKey = vendorName.toLowerCase();
  const matched = retailBrandRules.find(
    (rule) => rule.vendor === vendorKey && rule.pattern.test(title),
  );
  return matched?.brand ?? vendorDisplayNames[vendorKey] ?? vendorName;
}

export function getStorefrontProductTitle(input: ProductTitlePresentationInput): string {
  // The gift-wrap service keeps the merchant's label independently of merchandise branding.
  if (
    input.productType?.toLowerCase() === "service" ||
    /\bgift[ -]?wrap(?:ping)?\b/i.test(input.title)
  ) {
    return input.title.trim();
  }

  const brand = getProductDisplayBrand(input);
  if (brand === "Canali" && photographedCanaliTitles[input.title]) {
    return photographedCanaliTitles[input.title];
  }
  let title = input.title
    .replace(/\b7 Downie ST\.?(?=\s|$)/gi, "7 Downie St.")
    .replace(/\bGriogio Fiorelli\b/g, "Giorgio Fiorelli");

  if (brand === "Mattarazi") title = title.replace(/\bMattarazi Unomo(?: Inc)?\b/gi, "Mattarazi");
  if (brand === "Milestone") {
    title = title
      .replace(/^(?:Alberto\s+)?(?:Outerwear\s+)?Milestone\b/i, "Milestone")
      .replace(/\bJK\b/gi, "Jacket");
  }
  if (brand === "Jerry Key") {
    title = title.replace(
      /^Sand Triluxe Apparel Group\s+Sport Coat\s+Jerry Key\b/i,
      "Jerry Key Sport Coat",
    );
  }
  if (input.vendor === "Lief Horsens") {
    title = title.replace(/\bSuit LH \d{4}-Rock\b/, "Rock Suit");
  }
  if (input.vendor === "Magnanni" && /\bMissani\b/.test(title)) {
    title = title.replace(/\b(?:3959|3906)\b/g, "");
  }
  if (input.vendor === "Sand Triluxe Apparel Group") {
    title = title.replace(/\bSport Coat 6951 Sherman 120\b/, "Sherman Sport Coat");
  }

  return getProductDisplayTitle({ ...input, title, brand });
}

export function getProductDisplayCategory({
  title,
  productType,
}: ProductTitlePresentationInput): string {
  const type = productType?.trim() ?? "";
  if (/\bjacket\b/i.test(title) && /^(?:suit|vest)$/i.test(type)) return "";
  if (type === "SH") return "Shorts";
  if (type === "TUX Shirt") return "Tuxedo Shirt";
  return type;
}
