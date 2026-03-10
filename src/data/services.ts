import pageContentJson from "@content/site/page-content.json";

type ServicesData = {
  servicesPage: {
    serviceHighlights: Array<{ title: string; description: string }>;
    appointmentServices: string[];
  };
};

const services = pageContentJson as ServicesData;

export const serviceHighlights = services.servicesPage.serviceHighlights;
export const appointmentServices = services.servicesPage.appointmentServices;
