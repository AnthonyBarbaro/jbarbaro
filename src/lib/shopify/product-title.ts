type ProductTitleInput = {
  title: string;
  brand?: string | null;
  vendor?: string | null;
  productType?: string | null;
};

const garmentWords =
  /\b(?:shirts?|suits?|coats?|jackets?|pants?|trousers|jeans|denim|shorts|shoes?|boots?|loafers?|sneakers?|belts?|tuxedos?|vests?|polos?|sweaters?|sweatshirts?|t-shirts?|pullovers?|outerwear|bow\s?ties|knitwear)\b/i;

function tidyTitle(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/(['’])S\b/g, "$1s")
    .replace(/\bCasual Shirts\b/gi, "Casual Shirt")
    .replace(/\bDress Shirts\b/gi, "Dress Shirt")
    .replace(/\bKnit Shirts\b/gi, "Knit Shirt")
    .replace(/\bSport Coats\b/gi, "Sport Coat")
    .replace(/\bTuxedos\b/gi, "Tuxedo")
    .replace(/\bBelts\b/gi, "Belt")
    .replace(/\b1\/4\s+Zip\b/gi, "1/4-Zip")
    .replace(/\bSlip On\b/gi, "Slip-On")
    .replace(/\s+[-–—]\s+/g, " — ")
    .replace(/(?:\s*[—|,;:]\s*){2,}/g, " — ")
    .replace(/^[\s—|,;:/-]+|[\s—|,;:/-]+$/g, "")
    .trim();
}

function removeLeadingName(title: string, name: string): string {
  if (title.slice(0, name.length).toLowerCase() !== name.toLowerCase()) return title;
  const next = title[name.length];
  if (next && !/[\s—–,;:|/-]/.test(next)) return title;
  return tidyTitle(title.slice(name.length));
}

function isStyleCode(token: string): boolean {
  const value = token.replace(/^[([{]+|[)\]},;:]+$/g, "");
  if (value.includes("%")) return false;

  // Fractional zips, short numeric model names, and retail names such as 990v6 remain intact.
  const digits = value.replace(/\D/g, "").length;
  return (
    (/^[a-z]+\d[a-z\d/#.-]*$/i.test(value) && digits >= 4) ||
    (/^\d[a-z\d/#.-]*$/i.test(value) && /[a-z]/i.test(value) && digits >= 6) ||
    /^\d+[a-z]{2,}\d{4,}(?:[-/#.][a-z\d]+)*$/i.test(value) ||
    /^\d{3,}[/#]\d+[a-z\d/#.-]*$/i.test(value) ||
    /^\d{3,}-\d{1,3}(?:[-/]\d{1,3})*$/.test(value) ||
    /^\d{5,}(?:[/-]\d+)*$/.test(value)
  );
}

export function getProductDisplayTitle({
  title,
  brand,
  vendor,
  productType,
}: ProductTitleInput): string {
  const original = tidyTitle(title);
  let removedCode = false;
  const withoutNumericRuns = original.replace(
    /(^|[\s([,;:])\d{4,}(?:[/#-]\d+)?(?:[ \t]+\d{2,})+(?=$|[\s)\],;:])/g,
    (_match, prefix: string) => {
      removedCode = true;
      return prefix;
    },
  );
  let displayTitle = tidyTitle(
    withoutNumericRuns
      .split(/\s+/)
      .filter((token) => {
        if (!isStyleCode(token)) return true;
        removedCode = true;
        return false;
      })
      .join(" "),
  );

  const displayBrand = brand ? tidyTitle(brand) : "";
  if (displayBrand) {
    if (vendor) displayTitle = removeLeadingName(displayTitle, tidyTitle(vendor));
    displayTitle = removeLeadingName(displayTitle, displayBrand);
  }

  const type = productType ? tidyTitle(productType) : "";
  if (type && (!displayTitle || (removedCode && !garmentWords.test(displayTitle)))) {
    displayTitle = tidyTitle(`${displayTitle} ${type}`);
  }

  return tidyTitle([displayBrand, displayTitle].filter(Boolean).join(" ")) || "Product";
}
