import { getSupabase } from "@/lib/supabase/client";

/** Maps DB slug column to the slug object shape used across the app. */
export function slugRef(slug: string | null | undefined): { current: string } {
  return { current: slug ?? "" };
}

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  hidden: boolean | null;
  collection_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  reviews: unknown;
};

type VariantRow = {
  id: string;
  product_id: string;
  title: string | null;
  size: string | null;
  colour: string | null;
  sku: string | null;
  price: number | null;
  stock: number | null;
};

type ImageRow = {
  product_id: string;
  url: string;
  position: number | null;
};

type CollectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: unknown;
  published_at: string | null;
  cover_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

function groupByProductId<T extends { product_id: string }>(
  rows: T[] | null,
): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows ?? []) {
    const list = m.get(r.product_id) ?? [];
    list.push(r);
    m.set(r.product_id, list);
  }
  return m;
}

function mapVariant(v: VariantRow) {
  return {
    _key: v.id,
    title: v.title ?? undefined,
    size: v.size ?? undefined,
    colour: v.colour ?? undefined,
    sku: v.sku ?? undefined,
    price: v.price ?? undefined,
    stock: v.stock ?? undefined,
  };
}

function mapProductImages(rows: ImageRow[] | undefined): string[] {
  const sorted = [...(rows ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  return sorted.map((r) => r.url).filter(Boolean);
}

/** Former `allCollectionsQuery` — list all collections. */
export async function fetchAllCollectionsPublic(): Promise<
  Array<{
    _id: string;
    title: string;
    slug: { current: string };
    description: string | null;
    heroImage: string | null;
  }>
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("collections")
    .select(
      "id, slug, title, description, hero_image_url, seo_title, seo_description",
    )
    .order("title");
  if (error || !data) return [];
  return (data as CollectionRow[]).map((row) => ({
    _id: row.id,
    title: row.title,
    slug: slugRef(row.slug),
    description: row.description,
    heroImage: row.hero_image_url,
  }));
}

/** Former `allProductsQuery` — products where hidden is not true. */
export async function fetchAllProductsPublic(): Promise<
  Array<{
    _id: string;
    title: string;
    slug: { current: string };
    price: number;
    comparePrice: number | null;
    images: string[];
    collection: { title: string; slug: { current: string } } | null;
    variants: ReturnType<typeof mapVariant>[];
    seoTitle: string | null;
    seoDescription: string | null;
  }>
> {
  const supabase = getSupabase();
  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, slug, title, price, compare_price, hidden, collection_id, seo_title, seo_description",
    );
  if (error || !products?.length) return [];

  const rows = (products as ProductRow[]).filter(
    (p) => p.hidden !== true,
  );
  const ids = rows.map((p) => p.id);
  const cids = [
    ...new Set(rows.map((p) => p.collection_id).filter(Boolean)),
  ] as string[];

  const [{ data: variants }, { data: images }, { data: cols }] =
    await Promise.all([
      supabase.from("product_variants").select("*").in("product_id", ids),
      supabase
        .from("product_images")
        .select("product_id, url, position")
        .in("product_id", ids)
        .order("position", { ascending: true }),
      cids.length
        ? supabase.from("collections").select("id, title, slug").in("id", cids)
        : Promise.resolve({ data: [] as CollectionRow[], error: null }),
    ]);

  const vByPid = groupByProductId(variants as VariantRow[]);
  const imgByPid = groupByProductId(images as ImageRow[]);
  const colMap = new Map(
    (cols as CollectionRow[] | null)?.map((c) => [c.id, c]) ?? [],
  );

  return rows.map((p) => {
    const col = p.collection_id ? colMap.get(p.collection_id) : null;
    const vrows = vByPid.get(p.id) ?? [];
    const irows = imgByPid.get(p.id) ?? [];
    return {
      _id: p.id,
      title: p.title,
      slug: slugRef(p.slug),
      price: p.price,
      comparePrice:
        p.compare_price != null ? p.compare_price : null,
      images: mapProductImages(irows),
      collection: col
        ? { title: col.title, slug: slugRef(col.slug) }
        : null,
      variants: vrows.map((v) => mapVariant(v as VariantRow)),
      seoTitle: p.seo_title,
      seoDescription: p.seo_description,
    };
  });
}

async function loadProductWithRelations(slug: string): Promise<{
  product: ProductRow;
  variants: VariantRow[];
  imageUrls: string[];
  collection: { title: string; slug: { current: string } } | null;
} | null> {
  const supabase = getSupabase();
  const { data: p, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !p) return null;
  const row = p as ProductRow;
  if (row.hidden === true) return null;

  const [{ data: variants }, { data: images }, colRes] = await Promise.all([
    supabase.from("product_variants").select("*").eq("product_id", row.id),
    supabase
      .from("product_images")
      .select("product_id, url, position")
      .eq("product_id", row.id)
      .order("position", { ascending: true }),
    row.collection_id
      ? supabase
          .from("collections")
          .select("title, slug")
          .eq("id", row.collection_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const col = colRes.data as { title: string; slug: string } | null;
  return {
    product: row,
    variants: (variants ?? []) as VariantRow[],
    imageUrls: mapProductImages((images ?? []) as ImageRow[]),
    collection: col
      ? { title: col.title, slug: slugRef(col.slug) }
      : null,
  };
}

/** Former `productBySlugQuery` result shape. */
export async function fetchProductBySlug(slug: string) {
  const loaded = await loadProductWithRelations(slug);
  if (!loaded) return null;
  const { product: p, variants, imageUrls, collection } = loaded;
  let reviews: unknown[] = [];
  if (Array.isArray(p.reviews)) {
    reviews = p.reviews as unknown[];
  } else if (typeof p.reviews === "string" && p.reviews.trim()) {
    try {
      const parsed = JSON.parse(p.reviews) as unknown;
      reviews = Array.isArray(parsed) ? parsed : [];
    } catch {
      reviews = [];
    }
  }

  return {
    _id: p.id,
    title: p.title,
    slug: slugRef(p.slug),
    description: p.description,
    price: p.price,
    comparePrice: p.compare_price != null ? p.compare_price : null,
    images: imageUrls,
    collection,
    variants: variants.map(mapVariant),
    reviews,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
  };
}

/** Former `collectionBySlugQuery` result shape. */
export async function fetchCollectionBySlug(slug: string) {
  const supabase = getSupabase();
  const { data: col, error } = await supabase
    .from("collections")
    .select(
      "id, slug, title, description, hero_image_url, seo_title, seo_description",
    )
    .eq("slug", slug.trim())
    .maybeSingle();
  if (error || !col) return null;
  const c = col as CollectionRow;

  const { data: prows, error: productsError } = await supabase
    .from("products")
    .select("id, slug, title, price, compare_price, hidden")
    .eq("collection_id", c.id)
    .or("hidden.eq.false,hidden.is.null");

  if (productsError) {
    console.error("fetchCollectionBySlug products:", productsError.message);
  }

  const productsRaw = (prows ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    price: number;
    compare_price: number | null;
    hidden: boolean | null;
  }>;
  const filtered = productsRaw.filter((p) => p.hidden !== true);
  const pids = filtered.map((p) => p.id);

  let variants: VariantRow[] = [];
  let images: ImageRow[] = [];
  if (pids.length) {
    const [vr, ir] = await Promise.all([
      supabase.from("product_variants").select("*").in("product_id", pids),
      supabase
        .from("product_images")
        .select("product_id, url, position")
        .in("product_id", pids)
        .order("position", { ascending: true }),
    ]);
    variants = (vr.data ?? []) as VariantRow[];
    images = (ir.data ?? []) as ImageRow[];
  }

  const vByPid = groupByProductId(variants);
  const imgByPid = groupByProductId(images);

  const products = filtered.map((p) => ({
    _id: p.id,
    title: p.title,
    slug: slugRef(p.slug),
    price: p.price,
    comparePrice: p.compare_price != null ? p.compare_price : null,
    images: mapProductImages(imgByPid.get(p.id)),
    variants: (vByPid.get(p.id) ?? []).map((v) => mapVariant(v as VariantRow)),
  }));

  return {
    _id: c.id,
    title: c.title,
    slug: slugRef(c.slug),
    description: c.description,
    heroImage: c.hero_image_url,
    seoTitle: c.seo_title,
    seoDescription: c.seo_description,
    products,
  };
}

/** Former `allBlogPostsQuery`. */
export async function fetchAllBlogPosts(): Promise<
  Array<{
    _id: string;
    title: string;
    slug: { current: string };
    publishedAt?: string;
    excerpt?: string;
    coverImage: string | null;
  }>
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, published_at, cover_image_url, seo_title, seo_description",
    )
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return (data as BlogRow[]).map((row) => ({
    _id: row.id,
    title: row.title,
    slug: slugRef(row.slug),
    publishedAt: row.published_at ?? undefined,
    excerpt: row.excerpt ?? undefined,
    coverImage: row.cover_image_url,
  }));
}

/** Former `blogPostBySlugQuery` result shape. */
export async function fetchBlogPostBySlug(slug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as BlogRow;
  return {
    _id: row.id,
    title: row.title,
    slug: slugRef(row.slug),
    publishedAt: row.published_at ?? undefined,
    excerpt: row.excerpt ?? undefined,
    coverImage: row.cover_image_url,
    body: row.body ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
  };
}

/** Former `siteSettingsQuery` result shape. */
export async function fetchSiteSettings(): Promise<{
  announcementBar: string | null;
  freeDeliveryThreshold: number | null;
  nav: unknown;
} | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("site_settings")
    .select("announcement_bar, free_delivery_threshold, nav")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    announcement_bar: string | null;
    free_delivery_threshold: number | null;
    nav: unknown;
  };
  return {
    announcementBar: row.announcement_bar,
    freeDeliveryThreshold: row.free_delivery_threshold,
    nav: row.nav,
  };
}

/** Admin dashboard: total product rows. */
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

export type LowStockVariant = {
  productTitle: string;
  productSlug: string | null;
  variantTitle?: string;
  size?: string;
  colour?: string;
  sku?: string;
  stock: number;
};

/** Admin dashboard: variants with stock below 5. */
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
