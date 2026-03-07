import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  images: {
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
    ],
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
        source: "/designers/all-designer-brands/",
        destination: "/designers/all-designer-brands",
        permanent: true,
      },
      {
        source: "/designers/featured-designers/",
        destination: "/designers/featured-designers",
        permanent: true,
      },
      {
        source: "/for-men/:categorySlug/",
        destination: "/for-men/:categorySlug",
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
    ];
  },
};

export default withPayload(nextConfig, {
  devBundleServerPackages: false,
});
