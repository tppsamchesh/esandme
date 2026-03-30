import { client } from "@/lib/sanity/client";
import {
  productsWithVariantsQuery,
  productCountQuery,
} from "@/lib/sanity/admin-queries";

export type LowStockVariant = {
  productTitle: string;
  productSlug: string | null;
  variantTitle?: string;
  size?: string;
  colour?: string;
  sku?: string;
  stock: number;
};

type ProductDoc = {
  _id: string;
  title: string;
  slug: string | null;
  variants?: Array<{
    title?: string;
    size?: string;
    colour?: string;
    sku?: string;
    stock?: number;
  }>;
};

export async function getProductCount(): Promise<number> {
  try {
    const n = await client.fetch<number>(productCountQuery);
    return typeof n === "number" ? n : 0;
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
    const products = await client.fetch<ProductDoc[]>(
      productsWithVariantsQuery
    );
    const items: LowStockVariant[] = [];
    for (const p of products) {
      const variants = p.variants ?? [];
      for (const v of variants) {
        const stock = v.stock;
        if (typeof stock === "number" && stock < 5) {
          items.push({
            productTitle: p.title,
            productSlug: p.slug,
            variantTitle: v.title,
            size: v.size,
            colour: v.colour,
            sku: v.sku,
            stock,
          });
        }
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
