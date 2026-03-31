"use server";

import { getSupabase } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/supabase/storage";
import { revalidatePath } from "next/cache";

function revalidateBlog() {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function uploadCoverImage(
  formData: FormData
): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No image file provided." };
  }
  try {
    const url = await uploadPublicImage(file, "blog");
    return { ok: true, url };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export type SaveBlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string | null;
  publish: boolean;
  coverImageUrl: string | null;
};

export async function createBlogPost(
  input: SaveBlogPostInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!title) return { ok: false, error: "Title is required." };
  if (!slug) return { ok: false, error: "Slug is required." };

  const body = input.bodyMarkdown;

  let published_at: string | null = null;
  if (input.publish) {
    published_at =
      input.publishedAt?.trim() ||
      new Date().toISOString();
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug,
        published_at,
        excerpt: input.excerpt.trim() || null,
        cover_image_url: input.coverImageUrl,
        body,
        seo_title: input.seoTitle.trim() || null,
        seo_description: input.seoDescription.trim() || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (!data?.id) throw new Error("No id returned");

    revalidateBlog();
    return { ok: true, id: data.id as string };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export async function updateBlogPost(
  id: string,
  input: SaveBlogPostInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!title) return { ok: false, error: "Title is required." };
  if (!slug) return { ok: false, error: "Slug is required." };

  const body = input.bodyMarkdown;

  let published_at: string | null = null;
  if (input.publish) {
    published_at =
      input.publishedAt?.trim() ||
      new Date().toISOString();
  } else {
    published_at = null;
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("blog_posts")
      .update({
        title,
        slug,
        excerpt: input.excerpt.trim() || null,
        body,
        seo_title: input.seoTitle.trim() || null,
        seo_description: input.seoDescription.trim() || null,
        published_at,
        cover_image_url: input.coverImageUrl,
      })
      .eq("id", id);
    if (error) throw error;

    revalidateBlog();
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export async function deleteBlogPost(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Supabase is not configured." };
  }
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) throw error;
    revalidateBlog();
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
