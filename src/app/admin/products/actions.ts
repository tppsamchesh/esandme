"use server";

import { client } from "@/lib/sanity/client";
import { revalidatePath } from "next/cache";

export type SaveProductInput = {
  id: string;
  title: string;
  description: string;
  pricePence: number;
  variants: Array<{
    _key: string;
    title?: string;
    size?: string;
    colour?: string;
    sku?: string;
    stock: number;
    pricePence: number | null;
  }>;
};

export async function saveProduct(
  input: SaveProductInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.SANITY_API_TOKEN) {
    return {
      ok: false,
      error:
        "SANITY_API_TOKEN is not set. Add a token with write (Editor) access.",
    };
  }

  const { id, title, description, pricePence, variants } = input;

  if (!title.trim()) {
    return { ok: false, error: "Title is required." };
  }

  if (!Number.isFinite(pricePence) || pricePence < 0) {
    return { ok: false, error: "Price must be a valid amount in pence." };
  }

  try {
    const variantPayload = variants.map((v) => {
      const row: Record<string, unknown> = {
        _key: v._key,
        title: v.title ?? "",
        size: v.size ?? "",
        colour: v.colour ?? "",
        sku: v.sku ?? "",
        stock: Math.max(0, Math.floor(v.stock)),
      };
      if (v.pricePence != null && Number.isFinite(v.pricePence)) {
        row.price = Math.round(v.pricePence);
      }
      return row;
    });

    await client
      .patch(id)
      .set({
        title: title.trim(),
        description: description.trim() || undefined,
        price: Math.round(pricePence),
        variants: variantPayload,
      })
      .commit();

    revalidatePath("/admin/products");
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export type CreateProductVariantInput = {
  title: string;
  size: string;
  colour: string;
  sku: string;
  stock: number;
  pricePence: number | null;
};

export type CreateProductInput = {
  title: string;
  slug: string;
  description: string;
  pricePence: number;
  collectionId: string;
  published: boolean;
  variants: CreateProductVariantInput[];
  imageFiles: File[];
};

function randomKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.SANITY_API_TOKEN) {
    return {
      ok: false,
      error:
        "SANITY_API_TOKEN is not set. Add a token with write (Editor) access.",
    };
  }

  const title = input.title.trim();
  const slugCurrent = input.slug.trim().toLowerCase();
  const description = input.description.trim();
  const { pricePence, collectionId, published, variants } = input;

  if (!title) {
    return { ok: false, error: "Title is required." };
  }
  if (!slugCurrent) {
    return { ok: false, error: "Slug is required." };
  }
  if (!collectionId.trim()) {
    return { ok: false, error: "Choose a collection." };
  }
  if (!Number.isFinite(pricePence) || pricePence < 0) {
    return { ok: false, error: "Base price must be a valid amount." };
  }

  const imageFiles = input.imageFiles.filter(
    (f) => f instanceof File && f.size > 0,
  );

  try {
    const images: Array<Record<string, unknown>> = [];
    for (const file of imageFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await client.assets.upload("image", buffer, {
        filename: file.name,
        contentType: file.type || "image/jpeg",
      });
      images.push({
        _type: "image",
        _key: randomKey(),
        asset: {
          _type: "reference",
          _ref: asset._id,
        },
      });
    }

    const variantPayload = variants.map((v) => {
      const row: Record<string, unknown> = {
        _key: randomKey(),
        title: v.title?.trim() ?? "",
        size: v.size?.trim() ?? "",
        colour: v.colour?.trim() ?? "",
        sku: v.sku?.trim() ?? "",
        stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
      };
      if (v.pricePence != null && Number.isFinite(v.pricePence)) {
        row.price = Math.round(v.pricePence);
      }
      return row;
    });

    const doc = {
      _type: "product" as const,
      title,
      slug: { _type: "slug" as const, current: slugCurrent },
      ...(description ? { description } : {}),
      price: Math.round(pricePence),
      collection: {
        _type: "reference" as const,
        _ref: collectionId.trim(),
      },
      ...(images.length > 0 ? { images } : {}),
      ...(variantPayload.length > 0 ? { variants: variantPayload } : {}),
    };

    const created = await client.create(doc);

    if (published && created._id.startsWith("drafts.")) {
      const draftId = created._id;
      const publishedId = draftId.replace(/^drafts\./, "");
      await client.action({
        actionType: "sanity.action.document.publish",
        draftId,
        publishedId,
      });
    }

    revalidatePath("/admin/products");
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
