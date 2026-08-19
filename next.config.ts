import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    qualities: [75, 92],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.jasonbarbaro.com",
      },
      {
        protocol: "https",
        hostname: "jasonbarbaro.com",
      },
      {
        protocol: "https",
        hostname: "www.barbaroformalwear.com",
      },
      {
        protocol: "https",
        hostname: "scontent-lax3-1.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "www.macombnowmagazine.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/categories/:categorySlug",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/map",
        destination: "/locations",
        permanent: true,
      },
      {
        source: "/schedule-appointment/",
        destination: "/schedule-appointment",
        permanent: true,
      },
      {
        source: "/contact-us/",
        destination: "/contact-us",
        permanent: true,
      },
      {
        source: "/category/news_and_events/",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/category/style-guide/",
        destination: "/style-guide",
        permanent: true,
      },
      {
        source: "/designers/all-designer-brands",
        destination: "/shop/brands",
        permanent: true,
      },
      {
        source: "/designers/all-designer-brands/",
        destination: "/shop/brands",
        permanent: true,
      },
      {
        source: "/designers/featured-designers/",
        destination: "/designers/featured-designers",
        permanent: true,
      },
      {
        source: "/for-men",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/for-men/",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/for-men/:categorySlug",
        destination: "/categories/:categorySlug",
        permanent: true,
      },
      {
        source: "/for-men/:categorySlug/",
        destination: "/categories/:categorySlug",
        permanent: true,
      },
      {
        source: "/categories/all",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/categories/casual-shirts",
        destination: "/categories/shirts",
        permanent: true,
      },
      {
        source: "/categories/dress-pants",
        destination: "/categories/pants",
        permanent: true,
      },
      {
        source: "/categories/dress-shirts",
        destination: "/categories/shirts",
        permanent: true,
      },
      {
        source: "/categories/footwear",
        destination: "/categories/shoes",
        permanent: true,
      },
      {
        source: "/categories/sport-jacket",
        destination: "/categories/sport-coats",
        permanent: true,
      },
      {
        source: "/categories/suits-sports-coats",
        destination: "/categories/suits",
        permanent: true,
      },
      {
        source: "/categories/trousers",
        destination: "/categories/pants",
        permanent: true,
      },
      {
        source: "/categories/tuxedo",
        destination: "/categories/formalwear",
        permanent: true,
      },
      {
        source: "/categories/:categorySlug/",
        destination: "/categories/:categorySlug",
        permanent: true,
      },
      {
        source: "/suit-tuxedo-rentals/",
        destination: "/suit-tuxedo-rentals",
        permanent: true,
      },
      {
        source: "/register-your-wedding/",
        destination: "/register-your-wedding",
        permanent: true,
      },
      {
        source: "/tuxedos",
        destination: "/suit-tuxedo-rentals",
        permanent: true,
      },
      {
        source: "/location/great-lakes-crossing",
        destination: "/location/great-lakes-crossing-outlet",
        permanent: true,
      },
      {
        source: "/shop-coming-soon",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/admin/index.html",
        permanent: false,
      },
      {
        source: "/admin/",
        destination: "/admin/index.html",
        permanent: false,
      },
      {
        source: "/admin/login",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/admin/appointments",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/cms",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/cms/",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/cms/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
