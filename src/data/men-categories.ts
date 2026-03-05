import type { MenCategory } from "@/types/site";

export const menCategories: MenCategory[] = [
  {
    slug: "accessories",
    name: "Accessories",
    shortDescription: "Polished finishing details for every look.",
    longDescription:
      "Elevate any outfit with refined belts, wallets, pocket squares, and luxury leather goods selected for modern professionals.",
  },
  {
    slug: "casual-shirts",
    name: "Casual Shirts",
    shortDescription: "Premium fabrics with a relaxed tailored fit.",
    longDescription:
      "From weekend-ready button-downs to elevated knit polos, our casual shirts blend comfort, structure, and modern styling.",
  },
  {
    slug: "denim",
    name: "Denim",
    shortDescription: "Designer denim with modern silhouettes.",
    longDescription:
      "Explore handcrafted denim from trusted global makers featuring clean washes, superior stretch, and easy day-to-night wear.",
  },
  {
    slug: "dress-shirts",
    name: "Dress Shirts",
    shortDescription: "Crisp tailoring for boardroom and black-tie events.",
    longDescription:
      "Our dress shirts are curated for business, weddings, and formal occasions with refined collars, breathable cottons, and timeless fit profiles.",
  },
  {
    slug: "footwear",
    name: "Footwear",
    shortDescription: "Distinctive shoes that ground your wardrobe.",
    longDescription:
      "Shop handcrafted loafers, lace-ups, boots, and sneakers designed to pair seamlessly with suiting and smart casual styling.",
  },
  {
    slug: "formalwear",
    name: "Formalwear",
    shortDescription: "Event-ready pieces with a luxury edge.",
    longDescription:
      "Discover tuxedos, dinner jackets, formal shirts, and premium accessories for galas, weddings, and memorable milestone events.",
  },
  {
    slug: "neckwear",
    name: "Neckwear",
    shortDescription: "Sophisticated ties and bow ties for modern men.",
    longDescription:
      "Our neckwear collection includes silk ties, textured knits, and occasion-ready bow ties that complete tailored looks with precision.",
  },
  {
    slug: "outerwear",
    name: "Outerwear",
    shortDescription: "Performance-minded outer layers with style.",
    longDescription:
      "From lightweight field jackets to wool overcoats, our outerwear balances weather protection with elevated menswear design.",
  },
  {
    slug: "suits-sports-coats",
    name: "Suits & Sports Coats",
    shortDescription: "Signature tailoring built for confidence.",
    longDescription:
      "Find luxury suits and sport coats in modern fits, premium fabrics, and versatile constructions ideal for work, travel, and special occasions.",
  },
  {
    slug: "sweaters",
    name: "Sweaters",
    shortDescription: "Fine-gauge knitwear with seasonal versatility.",
    longDescription:
      "Layer effortlessly with merino, cashmere blends, and textured knits crafted for comfort, warmth, and refined everyday styling.",
  },
  {
    slug: "trousers",
    name: "Trousers",
    shortDescription: "Tailored pants with all-day comfort.",
    longDescription:
      "Our trouser assortment features polished dress slacks and contemporary stretch styles built for office, events, and travel.",
  },
];

export const menCategoryMap = Object.fromEntries(menCategories.map((category) => [category.slug, category]));
