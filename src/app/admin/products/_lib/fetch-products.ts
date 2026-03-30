import { client, urlFor } from "@/lib/sanity/client";
import { groq } from "next-sanity";
import type { ProductDoc, ProductListItem } from "./types";

const productsQuery = groq`
  *[_type == "product"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    price,
    comparePrice,
    images,
    collection->{ _id, title, slug },
    variants[]{ _key, title, size, colour, sku, price, stock }
  }
`;

function imageUrl(img: unknown, w: number, h: number): string | null {
  if (!img) return null;
  try {
    return urlFor(img).width(w).height(h).url();
  } catch {
    return null;
  }
}

export async function fetchProductsForAdmin(): Promise<ProductListItem[]> {
  const rows = await client.fetch<ProductDoc[]>(productsQuery);
  return rows.map((p) => {
    const imgs = p.images ?? [];
    const first = imgs[0];
    const thumbUrl = first ? imageUrl(first, 240, 240) : null;
    const galleryUrls = imgs
      .map((img) => imageUrl(img, 1200, 1200))
      .filter((u): u is string => u != null);
    return {
      ...p,
      thumbUrl,
      galleryUrls,
    };
  });
}
