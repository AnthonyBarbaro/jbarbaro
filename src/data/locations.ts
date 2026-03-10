import locationsJson from "@content/site/locations.json";

import type { Location } from "@/types/site";

type LocationsData = {
  items: Location[];
};

const locationData = locationsJson as LocationsData;

export const locations = locationData.items;
export const locationMap = Object.fromEntries(locations.map((location) => [location.slug, location]));
