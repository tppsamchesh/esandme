"use server";

import { markdownToPortableText } from "@/app/admin/blog/_lib/portable-text";
import { client } from "@/lib/sanity/client";
import { revalidatePath } from "next/cache";

function revalidateBlog() {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function uploadCoverImage(
  formData: FormData
): Promise<
  { ok: true; assetId: string; url: string } | { ok: false; error: string }
> {
  if (!process.env.SANITY_API_TOKEN) {
    return { ok: false, error: "SANITY_API_TOKEN is not configured." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No image file provided." };
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename: file.name,
      contentType: file.type || "image/jpeg",
    });
    const url = asset.url ?? "";
    return { ok: true, assetId: asset._id, url };
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
  coverAssetId: string | null;
};

export async function createBlogPost(
  input: SaveBlogPostInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!process.env.SANITY_API_TOKEN) {
    return { ok: false, error: "SANITY_API_TOKEN is not configured." };
  }
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!title) return { ok: false, error: "Title is required." };
  if (!slug) return { ok: false, error: "Slug is required." };

  const body = markdownToPortableText(input.bodyMarkdown);

  let publishedAt: string | undefined;
  if (input.publish) {
    publishedAt =
      input.publishedAt?.trim() ||
      new Date().toISOString();
  }

  try {
    const doc = await client.create({
      _type: "blogPost",
      title,
      slug: { _type: "slug", current: slug } as const,
      ...(publishedAt ? { publishedAt } : {}),
      excerpt: input.excerpt.trim() || undefined,
      ...(input.coverAssetId
        ? {
            coverImage: {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: input.coverAssetId,
              },
            },
          }
        : {}),
      body,
      seoTitle: input.seoTitle.trim() || undefined,
      seoDescription: input.seoDescription.trim() || undefined,
    });

    revalidateBlog();
    return { ok: true, id: doc._id };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export async function updateBlogPost(
  id: string,
  input: SaveBlogPostInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.SANITY_API_TOKEN) {
    return { ok: false, error: "SANITY_API_TOKEN is not configured." };
  }
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!title) return { ok: false, error: "Title is required." };
  if (!slug) return { ok: false, error: "Slug is required." };

  const body = markdownToPortableText(input.bodyMarkdown);

  let publishedAt: string | null | undefined = undefined;
  if (input.publish) {
    publishedAt =
      input.publishedAt?.trim() ||
      new Date().toISOString();
  } else {
    publishedAt = null;
  }

  try {
    let mutation = client.patch(id).set({
      title,
      slug: { current: slug },
      excerpt: input.excerpt.trim() || undefined,
      body,
      seoTitle: input.seoTitle.trim() || undefined,
      seoDescription: input.seoDescription.trim() || undefined,
    });

    if (publishedAt === null) {
      mutation = mutation.unset(["publishedAt"]);
    } else if (publishedAt) {
      mutation = mutation.set({ publishedAt });
    }

    if (input.coverAssetId) {
      mutation = mutation.set({
        coverImage: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: input.coverAssetId,
          },
        },
      });
    }

    await mutation.commit();

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
  if (!process.env.SANITY_API_TOKEN) {
    return { ok: false, error: "SANITY_API_TOKEN is not configured." };
  }
  try {
    await client.delete(id);
    revalidateBlog();
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
