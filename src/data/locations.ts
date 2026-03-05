import type { Location } from "@/types/site";

export const locations: Location[] = [
  {
    slug: "partridge-creek",
    name: "The Mall at Partridge Creek",
    brand: "J. Barbaro Clothiers",
    photo: "/images/remote/www.jasonbarbaro.com/assets/media/2020/05/s001.jpg",
    address: "17370 Hall Rd. Suite 111, Clinton Township, MI 48038",
    phone: "586-286-7400",
    latitude: 42.6276149,
    longitude: -82.9473183,
    note: "We are closed Easter, Thanksgiving and Christmas Day",
    hours: [
      { days: "Mon-Sat", open: "10:00 AM", close: "8:00 PM" },
      { days: "Sun", open: "12:00 PM", close: "6:00 PM" },
    ],
  },
  {
    slug: "great-lakes-crossing-outlet",
    name: "Great Lakes Crossing Outlet",
    brand: "J. Barbaro Clothiers",
    photo: "/images/remote/www.jasonbarbaro.com/assets/media/2020/05/s002.jpg",
    address: "Entrance 2, 4712 Baldwin Rd, Suite 209, Auburn Hills, MI 48326",
    phone: "248-332-2323",
    latitude: 42.705644,
    longitude: -83.306768,
    note: "We are closed Easter, Thanksgiving and Christmas Day",
    hours: [
      { days: "Mon-Thu", open: "11:00 AM", close: "7:00 PM" },
      { days: "Fri-Sat", open: "11:00 AM", close: "8:00 PM" },
      { days: "Sun", open: "11:00 AM", close: "6:00 PM" },
    ],
  },
];

export const locationMap = Object.fromEntries(
  locations.map((location) => [location.slug, location]),
);
