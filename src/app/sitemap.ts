import type { MetadataRoute } from "next";
import { adminSupabase } from "@/lib/supabase/admin-client";

function getBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const now = new Date();

  const [
    { data: collections },
    { data: products },
    { data: posts },
  ] = await Promise.all([
    adminSupabase
      .from("collections")
      .select("slug, created_at"),
    adminSupabase
      .from("products")
      .select("slug, created_at")
      .neq("hidden", true),
    adminSupabase
      .from("blog_posts")
      .select("slug, published_at")
      .not("published_at", "is", null),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/baby-shower-gifting`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/our-story`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  const collectionEntries: MetadataRoute.Sitemap = (collections ?? [])
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${base}/collections/${c.slug}`,
      lastModified: c.created_at ? new Date(c.created_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  const productEntries: MetadataRoute.Sitemap = (products ?? [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const blogEntries: MetadataRoute.Sitemap = (posts ?? [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [
    ...staticEntries,
    ...collectionEntries,
    ...productEntries,
    ...blogEntries,
  ];
}
