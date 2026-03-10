import pageContentJson from "@content/site/page-content.json";

import type { CtaTile, HeroSlide } from "@/types/site";

type HomeContent = {
  homePage: {
    heroSlides: HeroSlide[];
    ctaTiles: CtaTile[];
  };
};

const homeContent = pageContentJson as HomeContent;

export const heroSlides = homeContent.homePage.heroSlides;
export const ctaTiles = homeContent.homePage.ctaTiles;
