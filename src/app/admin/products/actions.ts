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
