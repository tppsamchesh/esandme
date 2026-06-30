import type { MetadataRoute } from "next";

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/cart",
        "/checkout",
        "/order-confirmation",
      ],
    },
    host: base,
    sitemap: `${base}/sitemap.xml`,
  };
}
