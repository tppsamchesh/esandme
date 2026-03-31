"use server";

import { getSupabase } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/supabase/storage";
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
  input: SaveProductInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  const { id, title, description, pricePence, variants } = input;

  if (!title.trim()) {
    return { ok: false, error: "Title is required." };
  }

  if (!Number.isFinite(pricePence) || pricePence < 0) {
    return { ok: false, error: "Price must be a valid amount in pence." };
  }

  try {
    const { error: pe } = await supabase
      .from("products")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        price: Math.round(pricePence),
      })
      .eq("id", id);
    if (pe) throw pe;

    for (const v of variants) {
      const row: Record<string, unknown> = {
        title: v.title ?? "",
        size: v.size ?? "",
        colour: v.colour ?? "",
        sku: v.sku ?? "",
        stock: Math.max(0, Math.floor(v.stock)),
      };
      if (v.pricePence != null && Number.isFinite(v.pricePence)) {
        row.price = Math.round(v.pricePence);
      } else {
        row.price = null;
      }
      const { error: ve } = await supabase
        .from("product_variants")
        .update(row)
        .eq("id", v._key)
        .eq("product_id", id);
      if (ve) throw ve;
    }

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

export async function createProduct(
  input: CreateProductInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
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
    const { data: inserted, error: insErr } = await supabase
      .from("products")
      .insert({
        title,
        slug: slugCurrent,
        description: description || null,
        price: Math.round(pricePence),
        collection_id: collectionId.trim(),
        hidden: !published,
        compare_price: null,
      })
      .select("id")
      .single();
    if (insErr) throw insErr;
    const productId = (inserted as { id: string }).id;

    if (variants.length > 0) {
      const variantRows = variants.map((v) => {
        const row: Record<string, unknown> = {
          product_id: productId,
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
      const { error: vErr } = await supabase
        .from("product_variants")
        .insert(variantRows);
      if (vErr) throw vErr;
    }

    let sort = 0;
    for (const file of imageFiles) {
      const url = await uploadPublicImage(file, "products");
      const { error: imgErr } = await supabase.from("product_images").insert({
        product_id: productId,
        url,
        sort_order: sort++,
      });
      if (imgErr) throw imgErr;
    }

    revalidatePath("/admin/products");
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
