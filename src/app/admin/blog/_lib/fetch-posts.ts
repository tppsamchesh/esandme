import { getSupabase } from "@/lib/supabase/client";
import type { PortableTextBlock } from "@portabletext/types";

export type BlogPostListRow = {
  _id: string;
  title: string;
  slug?: { current?: string };
  publishedAt?: string | null;
  excerpt?: string | null;
  coverImage?: unknown;
  seoTitle?: string | null;
  thumbUrl: string | null;
};

export async function fetchBlogPostsForAdmin(): Promise<BlogPostListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, published_at, excerpt, cover_image_url, seo_title",
    )
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string | null;
    excerpt: string | null;
    cover_image_url: string | null;
    seo_title: string | null;
  }>).map((row) => ({
    _id: row.id,
    title: row.title,
    slug: { current: row.slug },
    publishedAt: row.published_at,
    excerpt: row.excerpt,
    seoTitle: row.seo_title,
    thumbUrl: row.cover_image_url,
    coverImage: row.cover_image_url,
  }));
}

export type BlogPostDetail = {
  _id: string;
  title: string;
  slug?: { current?: string };
  publishedAt?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  body?: PortableTextBlock[] | PortableTextBlock | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export async function fetchBlogPostById(
  id: string,
): Promise<BlogPostDetail | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    id: string;
    title: string;
    slug: string;
    published_at: string | null;
    excerpt: string | null;
    cover_image_url: string | null;
    body: unknown;
    seo_title: string | null;
    seo_description: string | null;
  };
  return {
    _id: row.id,
    title: row.title,
    slug: { current: row.slug },
    publishedAt: row.published_at,
    excerpt: row.excerpt,
    coverImage: row.cover_image_url,
    body: row.body as BlogPostDetail["body"],
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}
