import type {
  AboutPageContent,
  ContactPageContent,
  DesignersPageContent,
  ForMenPageContent,
  HomePageContent,
  LocationsPageContent,
  NavigationContent,
  OurHistoryPageContent,
  PostIndexContent,
  RentalsPageContent,
  ReviewsPageContent,
  SchedulePageContent,
  ServicesContent,
  SiteSettingsContent,
  TailoredPageContent,
  WeddingPageContent,
} from "@/lib/cms-defaults";
import navigationJson from "@content/site/navigation.json";
import pageContentJson from "@content/site/page-content.json";
import siteSettingsJson from "@content/site/site-settings.json";

type PageContent = {
  homePage: HomePageContent;
  aboutPage: AboutPageContent;
  servicesPage: ServicesContent;
  contactPage: ContactPageContent;
  reviewsPage: ReviewsPageContent;
  schedulePage: SchedulePageContent;
  rentalsPage: RentalsPageContent;
  weddingPage: WeddingPageContent;
  designersPage: DesignersPageContent;
  forMenPage: ForMenPageContent;
  locationsPage: LocationsPageContent;
  tailoredPage: TailoredPageContent;
  ourHistoryPage: OurHistoryPageContent;
  blogIndex: PostIndexContent;
  styleGuideIndex: PostIndexContent;
};

export const siteSettings = siteSettingsJson as SiteSettingsContent;
export const navigationContent = navigationJson as NavigationContent;
export const pageContent = pageContentJson as PageContent;
