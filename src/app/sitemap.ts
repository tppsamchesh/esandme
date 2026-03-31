import type { MetadataRoute } from "next";
import {
  fetchAllBlogPosts,
  fetchAllCollectionsPublic,
  fetchAllProductsPublic,
} from "@/lib/supabase/queries";

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const now = new Date();

  const [collections, products, posts] = await Promise.all([
    fetchAllCollectionsPublic(),
    fetchAllProductsPublic(),
    fetchAllBlogPosts(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/our-story`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];

  const collectionEntries: MetadataRoute.Sitemap = (collections ?? [])
    .map((c) => c.slug?.current)
    .filter(Boolean)
    .map((slug) => ({
      url: `${base}/collections/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

  const productEntries: MetadataRoute.Sitemap = (products ?? [])
    .map((p) => p.slug?.current)
    .filter(Boolean)
    .map((slug) => ({
      url: `${base}/products/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  const blogEntries: MetadataRoute.Sitemap = (posts ?? [])
    .map((p) => p.slug?.current)
    .filter(Boolean)
    .map((slug) => ({
      url: `${base}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    ...staticEntries,
    ...collectionEntries,
    ...productEntries,
    ...blogEntries,
  ];
}
