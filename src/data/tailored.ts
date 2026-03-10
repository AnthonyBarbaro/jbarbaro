import tailoredJson from "@content/site/tailored.json";
import pageContentJson from "@content/site/page-content.json";

type TailoredData = {
  tailoredSwatches: Array<{ sku: string; thumb: string; full: string }>;
};

type TailoredPageContent = {
  tailoredPage: {
    heroImage: string;
    insetImage: string;
    fitSection: {
      pillars: Array<{ title: string; copy: string }>;
    };
    processSection: {
      steps: Array<{ title: string; copy: string }>;
    };
    optionsSection: {
      options: Array<{ title: string; copy: string }>;
    };
    faqSection: {
      faqs: Array<{ question: string; answer: string }>;
    };
  };
};

const tailored = tailoredJson as TailoredData;
const pageContent = pageContentJson as TailoredPageContent;

export const tailoringHeroImage = pageContent.tailoredPage.heroImage;
export const tailoringInsetImage = pageContent.tailoredPage.insetImage;
export const tailoringPillars = pageContent.tailoredPage.fitSection.pillars;
export const tailoringSteps = pageContent.tailoredPage.processSection.steps;
export const tailoringOptions = pageContent.tailoredPage.optionsSection.options;
export const tailoredSwatches = tailored.tailoredSwatches;
export const tailoringFaqs = pageContent.tailoredPage.faqSection.faqs;
