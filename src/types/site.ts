export type SocialLink = {
  label: string;
  href: string;
};

export type LocationHours = {
  days: string;
  open: string;
  close: string;
};

export type Location = {
  slug: string;
  name: string;
  brand: string;
  photo: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  note: string;
  hours: LocationHours[];
};

export type MenCategory = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
};

export type Brand = {
  slug: string;
  name: string;
  image: string;
  logo: string;
  featured: boolean;
  description: string;
};

export type Testimonial = {
  id: string;
  name: string;
  rating: number;
  locationSlug: string;
  quote: string;
  date: string;
};

export type HeroSlide = {
  id: string;
  title: string;
  caption: string;
  href: string;
  image: string;
  external?: boolean;
};

export type CtaTile = {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  external?: boolean;
};
