export type ShowroomPhoto = {
  src: string;
  alt: string;
  quality?: number;
};

export type ShowroomVideoAsset = {
  src: string;
  poster: string;
  width: number;
  height: number;
};

type Showroom = {
  name: string;
  photos: ShowroomPhoto[];
  video?: ShowroomVideoAsset;
};

export const partridgeCreekShowroomPhotos: ShowroomPhoto[] = [
  {
    src: "/images/locations/partridge-creek/showroom-02-2400.webp",
    alt: "Partridge Creek showroom with tailored jackets, dress shirts, denim, and seasonal displays",
  },
  {
    src: "/images/locations/partridge-creek/showroom-05-2400.webp",
    alt: "Contemporary sportswear and mannequin displays inside the Partridge Creek showroom",
  },
  {
    src: "/images/locations/partridge-creek/showroom-07-2400.webp",
    alt: "Canali suits and sport coats displayed at J. Barbaro Partridge Creek",
  },
  {
    src: "/images/locations/partridge-creek/showroom-03-2400.webp",
    alt: "Patterned and linen sport shirts on display at the Partridge Creek store",
  },
  {
    src: "/images/locations/partridge-creek/showroom-01-2400.webp",
    alt: "Accessories, footwear, and service counter inside J. Barbaro Partridge Creek",
  },
  {
    src: "/images/locations/partridge-creek/showroom-06-2400.webp",
    alt: "Premium denim selection arranged inside the Partridge Creek showroom",
  },
  {
    src: "/images/locations/partridge-creek/showroom-04-2400.webp",
    alt: "Colorful polos and casual menswear displayed at J. Barbaro Partridge Creek",
  },
  {
    src: "/images/locations/DSC_0546.jpg",
    alt: "Jason Barbaro, owner of J. Barbaro Clothiers, at the Partridge Creek showroom counter",
    quality: 92,
  },
];

const greatLakesShowroomPhotos: ShowroomPhoto[] = [
  {
    src: "/images/locations/great-lakes/storefront.webp",
    alt: "J. Barbaro Clothiers storefront at Great Lakes Crossing Outlet",
  },
  {
    src: "/images/locations/great-lakes/showroom.webp",
    alt: "Wide view of the Great Lakes Crossing showroom with jackets and folded menswear",
  },
  {
    src: "/images/locations/great-lakes/mannequin-display.webp",
    alt: "Mannequins in sport coats and layered menswear inside the store",
  },
  {
    src: "/images/locations/great-lakes/suits-and-dress-shirts.webp",
    alt: "Dress shirts on display in front of a wall of suits",
  },
  {
    src: "/images/locations/great-lakes/menswear-racks.webp",
    alt: "Rows of shirts, knitwear, and jackets along the showroom wall",
  },
  {
    src: "/images/locations/great-lakes/accessories-counter.webp",
    alt: "Glass accessories counter and a display of ties",
  },
  {
    src: "/images/locations/great-lakes/jackets-and-formalwear.webp",
    alt: "Colorful vests and jackets on racks in the Great Lakes Crossing showroom",
  },
  {
    src: "/images/locations/great-lakes/seating-area.webp",
    alt: "Showroom seating area looking toward the mall entrance",
  },
];

export const showroomGalleries: Partial<Record<string, Showroom>> = {
  "partridge-creek": {
    name: "Partridge Creek",
    photos: partridgeCreekShowroomPhotos,
    video: {
      src: "/images/locations/partridge-creek/store-tour.mp4",
      poster: "/images/locations/partridge-creek/store-tour-poster.webp",
      width: 1280,
      height: 720,
    },
  },
  "great-lakes-crossing-outlet": {
    name: "Great Lakes Crossing",
    photos: greatLakesShowroomPhotos,
    video: {
      src: "/images/locations/great-lakes/store-tour.mp4",
      poster: "/images/locations/great-lakes/store-tour-poster.webp",
      width: 1280,
      height: 720,
    },
  },
};
