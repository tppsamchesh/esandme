import { getSupabase } from "@/lib/supabase/client";

export type LowStockVariant = {
  productTitle: string;
  productSlug: string | null;
  variantTitle?: string;
  size?: string;
  colour?: string;
  sku?: string;
  stock: number;
};

export async function getProductCount(): Promise<number> {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch (e) {
    console.error("getProductCount", e);
    return 0;
  }
}

export async function getLowStockData(): Promise<{
  lowStockVariantCount: number;
  items: LowStockVariant[];
}> {
  try {
    const supabase = getSupabase();
    const { data: variants, error: ve } = await supabase
      .from("product_variants")
      .select("product_id, title, size, colour, sku, stock");
    if (ve || !variants?.length) {
      return { lowStockVariantCount: 0, items: [] };
    }

    const productIds = [
      ...new Set(
        variants.map((v: { product_id: string }) => v.product_id),
      ),
    ];
    const { data: products } = await supabase
      .from("products")
      .select("id, title, slug")
      .in("id", productIds);

    const pmap = new Map(
      (products ?? []).map((p: { id: string; title: string; slug: string }) => [
        p.id,
        p,
      ]),
    );

    const items: LowStockVariant[] = [];
    for (const v of variants as Array<{
      product_id: string;
      title: string | null;
      size: string | null;
      colour: string | null;
      sku: string | null;
      stock: number | null;
    }>) {
      const stock = v.stock;
      if (typeof stock === "number" && stock < 5) {
        const p = pmap.get(v.product_id);
        items.push({
          productTitle: p?.title ?? "—",
          productSlug: p?.slug ?? null,
          variantTitle: v.title ?? undefined,
          size: v.size ?? undefined,
          colour: v.colour ?? undefined,
          sku: v.sku ?? undefined,
          stock,
        });
      }
    }

    return {
      lowStockVariantCount: items.length,
      items,
    };
  } catch (e) {
    console.error("getLowStockData", e);
    return { lowStockVariantCount: 0, items: [] };
  }
}
