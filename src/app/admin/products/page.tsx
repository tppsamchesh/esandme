import { CreateProductForm } from "./_components/CreateProductForm";
import type { ProductListItem } from "./_lib/types";
import {
  productStockBadge,
  totalVariantStock,
  variantNumericStock,
} from "./_lib/stock";
import { formatGbp } from "@/lib/admin/format";
import { getSupabase } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/supabase/storage";
import Image from "next/image";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Products",
};

const COLLECTION_TITLES = [
  "Muslins",
  "Baby Changing",
  "Snuggy Bunny",
] as const;

type ProductAdminRow = ProductListItem & {
  hidden?: boolean | null;
  comparePrice?: number | null;
};

function poundsToPence(s: string): number | null {
  const n = parseFloat(s.replace(/£/g, "").trim());
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

function parseOptionalPence(raw: string | undefined): number | undefined {
  const t = (raw ?? "").trim();
  if (t === "") return undefined;
  const p = poundsToPence(t);
  return p ?? undefined;
}

type DbProduct = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  hidden: boolean | null;
  collection_id: string | null;
};

async function fetchProductsForAdminPage(): Promise<ProductAdminRow[]> {
  const supabase = getSupabase();
  const { data: prows, error } = await supabase
    .from("products")
    .select("*")
    .order("title");
  if (error || !prows?.length) return [];

  const products = prows as DbProduct[];
  const pids = products.map((p) => p.id);
  const cids = [
    ...new Set(products.map((p) => p.collection_id).filter(Boolean)),
  ] as string[];

  const [{ data: cols }, { data: variants }, { data: imgs }] =
    await Promise.all([
      cids.length
        ? supabase.from("collections").select("id, title, slug").in("id", cids)
        : Promise.resolve({ data: [] }),
      supabase.from("product_variants").select("*").in("product_id", pids),
      supabase
        .from("product_images")
        .select("id, product_id, url, sort_order")
        .in("product_id", pids)
        .order("sort_order", { ascending: true }),
    ]);

  const colMap = new Map(
    (cols ?? []).map((c: { id: string; title: string; slug: string }) => [
      c.id,
      c,
    ]),
  );

  const vByPid = new Map<
    string,
    Array<{
      id: string;
      title: string | null;
      size: string | null;
      colour: string | null;
      sku: string | null;
      price: number | null;
      stock: number | null;
    }>
  >();
  for (const v of variants ?? []) {
    const vr = v as {
      product_id: string;
      id: string;
      title: string | null;
      size: string | null;
      colour: string | null;
      sku: string | null;
      price: number | null;
      stock: number | null;
    };
    const list = vByPid.get(vr.product_id) ?? [];
    list.push(vr);
    vByPid.set(vr.product_id, list);
  }

  const iByPid = new Map<
    string,
    Array<{ id: string; url: string; sort_order: number | null }>
  >();
  for (const im of imgs ?? []) {
    const row = im as {
      id: string;
      product_id: string;
      url: string;
      sort_order: number | null;
    };
    const list = iByPid.get(row.product_id) ?? [];
    list.push(row);
    iByPid.set(row.product_id, list);
  }

  return products.map((p) => {
    const col = p.collection_id ? colMap.get(p.collection_id) : null;
    const vrows = vByPid.get(p.id) ?? [];
    const irows = [...(iByPid.get(p.id) ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    const galleryUrls = irows.map((r) => r.url);
    const thumbUrl = galleryUrls[0] ?? null;

    const variantsMapped = vrows.map((vr) => ({
      _key: vr.id,
      title: vr.title ?? undefined,
      size: vr.size ?? undefined,
      colour: vr.colour ?? undefined,
      sku: vr.sku ?? undefined,
      price: vr.price ?? undefined,
      stock: vr.stock ?? undefined,
    }));

    const row: ProductAdminRow = {
      _id: p.id,
      title: p.title,
      slug: { current: p.slug },
      description: p.description,
      price: p.price,
      comparePrice: p.compare_price,
      hidden: p.hidden,
      images: irows.map((r) => ({ id: r.id, url: r.url })),
      collection: col
        ? {
            _id: col.id,
            title: col.title,
            slug: { current: col.slug },
          }
        : null,
      variants: variantsMapped,
      thumbUrl,
      galleryUrls,
    };
    return row;
  });
}

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function buildAdminProductsPath(sp: {
  q?: string;
  collection?: string;
  editPanel?: string;
  extraVariantRows?: string;
}) {
  const params = new URLSearchParams();
  if (sp.q?.trim()) params.set("q", sp.q.trim());
  if (sp.collection && sp.collection !== "all") {
    params.set("collection", sp.collection);
  }
  if (sp.editPanel?.trim()) params.set("editPanel", sp.editPanel.trim());
  if (sp.extraVariantRows?.trim()) {
    const n = parseInt(sp.extraVariantRows.trim(), 10);
    if (!Number.isNaN(n) && n > 0) {
      params.set("extraVariantRows", String(Math.min(50, n)));
    }
  }
  const s = params.toString();
  return s ? `/admin/products?${s}` : "/admin/products";
}

function globalStats(products: ProductAdminRow[]) {
  let totalVariants = 0;
  let lowStockVariants = 0;
  let outOfStockVariants = 0;
  for (const p of products) {
    const vs = p.variants ?? [];
    totalVariants += vs.length;
    for (const v of vs) {
      const n = variantNumericStock(v.stock);
      if (n === 0) outOfStockVariants++;
      else if (n < 5) lowStockVariants++;
    }
  }
  return {
    totalProducts: products.length,
    totalVariants,
    lowStockVariants,
    outOfStockVariants,
  };
}

export async function toggleProductHidden(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString();
  const redirectTo = formData.get("redirectTo")?.toString() || "/admin/products";
  if (!id) {
    redirect(redirectTo);
  }
  const nextHidden = formData.get("nextHidden") === "true";
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect(redirectTo);
  }
  try {
    const supabase = getSupabase();
    await supabase.from("products").update({ hidden: nextHidden }).eq("id", id);
  } catch {
    // Leave UI unchanged on failure; user can retry
  }
  revalidatePath("/admin/products");
  redirect(redirectTo);
}

export async function saveProductSale(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString()?.trim();
  const salePounds = (formData.get("salePrice")?.toString() ?? "").trim();
  const redirectTo = formData.get("redirectTo")?.toString() || "/admin/products";
  if (!id) {
    redirect(redirectTo);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect(redirectTo);
  }
  try {
    const supabase = getSupabase();
    const { data: row, error: fetchErr } = await supabase
      .from("products")
      .select("price, compare_price")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr || !row) {
      redirect(redirectTo);
    }
    const currentPrice = (row as { price: number }).price;
    const currentCompare = (row as { compare_price: number | null })
      .compare_price;

    if (salePounds === "") {
      if (currentCompare != null) {
        await supabase
          .from("products")
          .update({
            price: currentCompare,
            compare_price: null,
          })
          .eq("id", id);
      }
    } else {
      const salePence = poundsToPence(salePounds);
      if (salePence == null) {
        redirect(redirectTo);
      }
      if (currentCompare != null) {
        await supabase
          .from("products")
          .update({ price: salePence })
          .eq("id", id);
      } else {
        await supabase
          .from("products")
          .update({
            compare_price: currentPrice,
            price: salePence,
          })
          .eq("id", id);
      }
    }
  } catch {
    // ignore; user can retry
  }
  revalidatePath("/admin/products");
  redirect(redirectTo);
}

export async function saveProductVariantsAndImages(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString()?.trim();
  const redirectTo = formData.get("redirectTo")?.toString() || "/admin/products";
  if (!id) {
    redirect(redirectTo);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect(redirectTo);
  }

  const extraRowsRaw = formData.get("extraVariantRows")?.toString();
  const extraVariantRows = Math.min(
    50,
    Math.max(0, parseInt(extraRowsRaw ?? "0", 10) || 0),
  );

  try {
    const supabase = getSupabase();
    const { data: prod, error: pe } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (pe || !prod) {
      redirect(redirectTo);
    }

    const removeVariantKeys = new Set(
      formData.getAll("removeVariant").map((v) => String(v)),
    );
    const removeImageIds = new Set(
      formData.getAll("removeImageId").map((v) => String(v)),
    );

    const { data: dbVariantRows } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id);
    const dbVariantIds = new Set(
      (dbVariantRows ?? []).map((r: { id: string }) => r.id),
    );

    for (const rid of removeVariantKeys) {
      if (dbVariantIds.has(rid)) {
        await supabase.from("product_variants").delete().eq("id", rid);
      }
    }

    for (const vid of dbVariantIds) {
      if (removeVariantKeys.has(vid)) continue;

      const title = formData.get(`variant_${vid}_title`)?.toString() ?? "";
      const size = formData.get(`variant_${vid}_size`)?.toString() ?? "";
      const colour = formData.get(`variant_${vid}_colour`)?.toString() ?? "";
      const sku = formData.get(`variant_${vid}_sku`)?.toString() ?? "";
      const priceGbp =
        formData.get(`variant_${vid}_priceGbp`)?.toString() ?? "";
      const stockRaw = formData.get(`variant_${vid}_stock`)?.toString() ?? "";

      const pricePence = parseOptionalPence(priceGbp);
      const stock =
        stockRaw.trim() === ""
          ? 0
          : Math.max(0, parseInt(stockRaw, 10) || 0);

      const upd: Record<string, unknown> = {
        title,
        size,
        colour,
        sku,
        stock,
      };
      if (pricePence != null) upd.price = pricePence;
      else upd.price = null;

      await supabase
        .from("product_variants")
        .update(upd)
        .eq("id", vid)
        .eq("product_id", id);
    }

    for (let i = 0; i < extraVariantRows; i++) {
      const title = formData.get(`new_${i}_title`)?.toString() ?? "";
      const size = formData.get(`new_${i}_size`)?.toString() ?? "";
      const colour = formData.get(`new_${i}_colour`)?.toString() ?? "";
      const sku = formData.get(`new_${i}_sku`)?.toString() ?? "";
      const priceGbp = formData.get(`new_${i}_priceGbp`)?.toString() ?? "";
      const stockRaw = formData.get(`new_${i}_stock`)?.toString() ?? "";

      const empty =
        !title.trim() &&
        !size.trim() &&
        !colour.trim() &&
        !sku.trim() &&
        !priceGbp.trim() &&
        !stockRaw.trim();
      if (empty) continue;

      const pricePence = parseOptionalPence(priceGbp);
      const stock =
        stockRaw.trim() === ""
          ? 0
          : Math.max(0, parseInt(stockRaw, 10) || 0);

      const ins: Record<string, unknown> = {
        product_id: id,
        title: title.trim(),
        size: size.trim(),
        colour: colour.trim(),
        sku: sku.trim(),
        stock,
      };
      if (pricePence != null) ins.price = pricePence;
      await supabase.from("product_variants").insert(ins);
    }

    for (const imgId of removeImageIds) {
      await supabase
        .from("product_images")
        .delete()
        .eq("id", imgId)
        .eq("product_id", id);
    }

    const { data: sortRow } = await supabase
      .from("product_images")
      .select("sort_order")
      .eq("product_id", id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    let sortBase =
      typeof (sortRow as { sort_order: number | null } | null)?.sort_order ===
      "number"
        ? (sortRow as { sort_order: number }).sort_order
        : -1;

    const newFiles = formData.getAll("newImages");
    for (const f of newFiles) {
      if (!(f instanceof File) || f.size === 0) continue;
      sortBase += 1;
      const url = await uploadPublicImage(f, "products");
      await supabase.from("product_images").insert({
        product_id: id,
        url,
        sort_order: sortBase,
      });
    }
  } catch {
    // Leave UI unchanged on failure; user can retry
  }
  revalidatePath("/admin/products");
  redirect(redirectTo);
}

export async function deleteProduct(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString();
  const returnTo = formData.get("returnTo")?.toString() || "/admin/products";
  if (!id?.trim()) {
    redirect(returnTo);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const sep = returnTo.includes("?") ? "&" : "?";
    redirect(`${returnTo}${sep}deleteError=token`);
  }
  try {
    const supabase = getSupabase();
    const pid = id.trim();
    await supabase.from("product_variants").delete().eq("product_id", pid);
    await supabase.from("product_images").delete().eq("product_id", pid);
    const { error } = await supabase.from("products").delete().eq("id", pid);
    if (error) throw error;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const sep = returnTo.includes("?") ? "&" : "?";
    redirect(
      `${returnTo}${sep}deleteError=${encodeURIComponent(msg.slice(0, 500))}`,
    );
  }
  revalidatePath("/admin/products");
  redirect(returnTo);
}

const COLLECTION_FILTERS = [
  { value: "all", label: "All collections" },
  { value: "Muslins", label: "Muslins" },
  { value: "Baby Changing", label: "Baby Changing" },
  { value: "Snuggy Bunny", label: "Snuggy Bunny" },
] as const;

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-1.746-.267a49.417 49.417 0 00-6.441-.509 49.417 49.417 0 00-6.441.509l-1.746.267a.75.75 0 11-.256-1.478 48.816 48.816 0 013.878-.512V4.478c0-1.652 1.3-2.994 2.908-2.994h3.168c1.608 0 2.908 1.342 2.908 2.994zM9.75 9.75v7.5a.75.75 0 001.5 0v-7.5a.75.75 0 00-1.5 0zm3.75-.75a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5a.75.75 0 01.75-.75zm3 .75v7.5a.75.75 0 001.5 0v-7.5a.75.75 0 00-1.5 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    collection?: string;
    deleteError?: string;
    editPanel?: string;
    extraVariantRows?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = getSupabase();
  const [products, colRes] = await Promise.all([
    fetchProductsForAdminPage(),
    supabase
      .from("collections")
      .select("id, title")
      .in("title", [...COLLECTION_TITLES]),
  ]);
  const rawCollections = (colRes.data ?? []) as Array<{
    id: string;
    title: string;
  }>;

  const order = new Map<string, number>(
    COLLECTION_TITLES.map((title, index) => [title, index]),
  );
  const collections = [...rawCollections]
    .map((c) => ({ _id: c.id, title: c.title }))
    .sort(
      (a, b) => (order.get(a.title) ?? 99) - (order.get(b.title) ?? 99),
    );

  const stats = globalStats(products);
  const returnTo = buildAdminProductsPath({
    q: sp.q,
    collection: sp.collection,
    editPanel: sp.editPanel,
    extraVariantRows: sp.extraVariantRows,
  });
  const extraVariantRowsCount = Math.min(
    50,
    Math.max(0, parseInt(sp.extraVariantRows ?? "0", 10) || 0),
  );
  const editPanelId = sp.editPanel?.trim() || undefined;
  const saveVariantsRedirectTo = buildAdminProductsPath({
    q: sp.q,
    collection: sp.collection,
  });

  const collectionFilter = sp.collection ?? "all";
  const q = (sp.q ?? "").trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (collectionFilter !== "all") {
      const t = p.collection?.title?.trim();
      if (t !== collectionFilter) return false;
    }
    if (!q) return true;
    return (p.title ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-heading text-3xl text-brand-text">Products & stock</h1>
      <p className="mt-1 text-sm text-brand-text/70">
        View stock levels and edit product details. Changes save to Supabase.
      </p>
      <div className="mt-8 space-y-8">
        <CreateProductForm collections={collections} />

        <div className="space-y-8">
          {sp.deleteError ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="alert"
            >
              {sp.deleteError === "token"
                ? "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL). Cannot delete."
                : `Could not delete product: ${safeDecode(sp.deleteError)}`}
            </div>
          ) : null}

          <div className="rounded-lg border border-brand-secondary/40 bg-white/80 px-4 py-3 text-sm text-brand-text/90 shadow-sm">
            <p className="font-medium text-brand-text">Supabase</p>
            <p className="mt-1 text-brand-text/80">
              Product data is stored in Supabase. Ensure{" "}
              <code className="rounded bg-brand-bg px-1 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="rounded bg-brand-bg px-1 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              are set, and RLS policies allow the operations you need.
            </p>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Products" value={String(stats.totalProducts)} />
            <StatCard label="Total Variants" value={String(stats.totalVariants)} />
            <StatCard
              label="Low stock (under 5)"
              value={String(stats.lowStockVariants)}
              tone="amber"
            />
            <StatCard
              label="Out of stock (0)"
              value={String(stats.outOfStockVariants)}
              tone="red"
            />
          </section>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <form
              className="max-w-md flex-1"
              action="/admin/products"
              method="get"
            >
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <input type="hidden" name="collection" value={collectionFilter} />
              <input
                id="product-search"
                name="q"
                type="search"
                placeholder="Search by product name…"
                defaultValue={sp.q ?? ""}
                className="w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
              />
            </form>
            <form
              className="w-full max-w-xs"
              action="/admin/products"
              method="get"
            >
              <label htmlFor="collection-filter" className="sr-only">
                Collection
              </label>
              <input type="hidden" name="q" value={sp.q ?? ""} />
              <select
                id="collection-filter"
                name="collection"
                defaultValue={collectionFilter}
                className="w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
              >
                {COLLECTION_FILTERS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </form>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg border border-brand-text/10 bg-white px-6 py-14 text-center shadow-sm">
              <p className="text-brand-text/85">
                No products found yet. Create a product with the form above.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-brand-text/10 bg-white px-6 py-14 text-center shadow-sm">
              <p className="text-brand-text/85">
                No products match your search or collection filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => {
                const badge = productStockBadge(p.variants);
                const stockSum = totalVariantStock(p.variants);
                const isHidden = Boolean(p.hidden);
                return (
                  <div
                    key={p._id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-brand-text/10 bg-white text-left shadow-sm transition-shadow hover:border-brand-primary/40 hover:shadow-md"
                  >
                    <Link
                      href={`/products/${p.slug?.current ?? ""}`}
                      className="relative block aspect-[4/3] w-full bg-brand-bg"
                    >
                      {p.thumbUrl ? (
                        <Image
                          src={p.thumbUrl}
                          alt={p.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-brand-text/40">
                          No image
                        </div>
                      )}
                      {badge === "out" ? (
                        <span className="absolute right-2 top-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Out of stock
                        </span>
                      ) : badge === "low" ? (
                        <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                          Low stock
                        </span>
                      ) : null}
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="min-w-0 flex-1 font-heading text-lg leading-snug text-brand-text group-hover:text-brand-primary">
                          {p.title}
                        </h2>
                        <details className="relative shrink-0">
                          <summary
                            className="list-none cursor-pointer rounded-md p-1.5 text-brand-text/50 outline-none ring-brand-primary hover:bg-brand-text/5 hover:text-red-700 focus-visible:ring-2 [&::-webkit-details-marker]:hidden"
                            aria-label={`Delete ${p.title}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </summary>
                          <div className="absolute right-0 z-20 mt-1 w-[min(100vw-2rem,18rem)] rounded-lg border border-brand-text/15 bg-white p-3 text-left shadow-lg">
                            <p className="text-sm text-brand-text">
                              Delete <span className="font-medium">{p.title}</span>
                              ? This cannot be undone.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <form action={deleteProduct}>
                                <input type="hidden" name="id" value={p._id} />
                                <input
                                  type="hidden"
                                  name="returnTo"
                                  value={returnTo}
                                />
                                <button
                                  type="submit"
                                  className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
                                >
                                  Confirm
                                </button>
                              </form>
                              <button
                                type="button"
                                data-close-details
                                className="rounded-md border border-brand-text/20 bg-white px-3 py-1.5 text-sm text-brand-text hover:bg-brand-bg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </details>
                      </div>
                      <p className="mt-1 text-sm text-brand-text/65">
                        {p.collection?.title ?? "—"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-text/5 pt-3 text-sm">
                        <div className="min-w-0">
                          {p.comparePrice != null &&
                          typeof p.comparePrice === "number" ? (
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-sm text-brand-text/45 line-through">
                                {formatGbp(p.comparePrice)}
                              </span>
                              <span className="font-medium text-brand-primary">
                                {formatGbp(p.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium text-brand-text">
                              {formatGbp(p.price)}
                            </span>
                          )}
                        </div>
                        <span className="text-brand-text/70">
                          Stock:{" "}
                          <span className="tabular-nums text-brand-text">
                            {stockSum}
                          </span>
                        </span>
                      </div>
                      <form action={saveProductSale} className="mt-3 space-y-2">
                        <input type="hidden" name="id" value={p._id} />
                        <input type="hidden" name="redirectTo" value={returnTo} />
                        <label className="block">
                          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                            Sale price (£)
                          </span>
                          <input
                            name="salePrice"
                            type="text"
                            inputMode="decimal"
                            placeholder={
                              p.comparePrice != null
                                ? (p.price / 100).toFixed(2)
                                : "e.g. 12.00"
                            }
                            defaultValue={
                              p.comparePrice != null
                                ? (p.price / 100).toFixed(2)
                                : ""
                            }
                            className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
                            autoComplete="off"
                          />
                        </label>
                        <p className="text-[11px] text-brand-text/50">
                          Sets a discount: sale becomes the main price; full price
                          is kept for display. Clear the field and save to end the
                          sale.
                        </p>
                        <button
                          type="submit"
                          className="rounded-md bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                        >
                          Save sale price
                        </button>
                      </form>
                      {editPanelId !== p._id ? (
                        <p className="mt-3">
                          <Link
                            href={buildAdminProductsPath({
                              q: sp.q,
                              collection: sp.collection,
                              editPanel: p._id,
                            })}
                            className="text-sm font-medium text-[#8BA888] underline underline-offset-2 hover:opacity-90"
                          >
                            Edit variants &amp; images
                          </Link>
                        </p>
                      ) : (
                        <form
                          action={saveProductVariantsAndImages}
                          encType="multipart/form-data"
                          className="mt-4 space-y-4 rounded-lg border border-brand-text/15 bg-brand-bg/50 p-3"
                        >
                          <input type="hidden" name="id" value={p._id} />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={saveVariantsRedirectTo}
                          />
                          <input
                            type="hidden"
                            name="extraVariantRows"
                            value={String(extraVariantRowsCount)}
                          />
                          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                            Variants
                          </p>
                          <div className="space-y-3">
                            {(p.variants ?? []).map((v) => {
                              const k = v._key;
                              if (!k) return null;
                              const priceGbp =
                                typeof v.price === "number" &&
                                !Number.isNaN(v.price)
                                  ? (v.price / 100).toFixed(2)
                                  : "";
                              const stockStr =
                                typeof v.stock === "number" &&
                                !Number.isNaN(v.stock)
                                  ? String(v.stock)
                                  : "";
                              return (
                                <div
                                  key={k}
                                  className="relative rounded-lg border border-brand-text/10 bg-white p-3"
                                >
                                  <input
                                    type="checkbox"
                                    name="removeVariant"
                                    value={k}
                                    id={`rm-variant-${p._id}-${k}`}
                                    className="peer sr-only"
                                  />
                                  <div className="grid gap-2 pt-5 peer-checked:opacity-50 peer-checked:line-through sm:grid-cols-2 lg:grid-cols-3">
                                    <label className="block text-[11px] text-brand-text/70">
                                      Title
                                      <input
                                        name={`variant_${k}_title`}
                                        type="text"
                                        defaultValue={v.title ?? ""}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Size
                                      <input
                                        name={`variant_${k}_size`}
                                        type="text"
                                        defaultValue={v.size ?? ""}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Colour
                                      <input
                                        name={`variant_${k}_colour`}
                                        type="text"
                                        defaultValue={v.colour ?? ""}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      SKU
                                      <input
                                        name={`variant_${k}_sku`}
                                        type="text"
                                        defaultValue={v.sku ?? ""}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Price (£)
                                      <input
                                        name={`variant_${k}_priceGbp`}
                                        type="text"
                                        inputMode="decimal"
                                        defaultValue={priceGbp}
                                        placeholder="0.00"
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Stock
                                      <input
                                        name={`variant_${k}_stock`}
                                        type="number"
                                        min={0}
                                        step={1}
                                        defaultValue={stockStr}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                  </div>
                                  <label
                                    htmlFor={`rm-variant-${p._id}-${k}`}
                                    className="absolute right-2 top-2 cursor-pointer text-xs font-medium text-red-800 hover:underline"
                                  >
                                    Remove
                                  </label>
                                </div>
                              );
                            })}
                            {Array.from(
                              { length: extraVariantRowsCount },
                              (_, i) => (
                                <div
                                  key={`new-${i}`}
                                  className="rounded-lg border border-dashed border-[#8BA888]/50 bg-white p-3"
                                >
                                  <p className="mb-2 text-[11px] font-medium text-[#8BA888]">
                                    New variant
                                  </p>
                                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    <label className="block text-[11px] text-brand-text/70">
                                      Title
                                      <input
                                        name={`new_${i}_title`}
                                        type="text"
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Size
                                      <input
                                        name={`new_${i}_size`}
                                        type="text"
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Colour
                                      <input
                                        name={`new_${i}_colour`}
                                        type="text"
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      SKU
                                      <input
                                        name={`new_${i}_sku`}
                                        type="text"
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Price (£)
                                      <input
                                        name={`new_${i}_priceGbp`}
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Stock
                                      <input
                                        name={`new_${i}_stock`}
                                        type="number"
                                        min={0}
                                        step={1}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                        autoComplete="off"
                                      />
                                    </label>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                          <Link
                            href={buildAdminProductsPath({
                              q: sp.q,
                              collection: sp.collection,
                              editPanel: p._id,
                              extraVariantRows: String(
                                extraVariantRowsCount + 1,
                              ),
                            })}
                            className="inline-flex text-sm font-medium text-[#8BA888] underline underline-offset-2 hover:opacity-90"
                          >
                            + Add variant
                          </Link>
                          <div className="border-t border-brand-text/10 pt-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                              Images
                            </p>
                            <p className="mt-1 text-[11px] text-brand-text/50">
                              Check &quot;Remove&quot; to drop an image on save.
                              New files upload when you save.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-3">
                              {(p.images ?? []).map((img, imgIdx) => {
                                const row = img as { id?: string; url?: string };
                                const imgId = row.id;
                                const thumb = row.url;
                                if (!imgId || !thumb) return null;
                                return (
                                  <div
                                    key={imgId}
                                    className="relative"
                                  >
                                    <input
                                      type="checkbox"
                                      name="removeImageId"
                                      value={imgId}
                                      id={`rm-img-${p._id}-${imgIdx}-${imgId}`}
                                      className="peer sr-only"
                                    />
                                    <div className="peer-checked:opacity-40 peer-checked:grayscale">
                                      <Image
                                        src={thumb}
                                        alt=""
                                        width={96}
                                        height={96}
                                        className="h-20 w-20 rounded-md border border-brand-text/15 object-cover"
                                      />
                                    </div>
                                    <label
                                      htmlFor={`rm-img-${p._id}-${imgIdx}-${imgId}`}
                                      className="absolute -right-1 -top-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-brand-text text-xs font-bold text-white shadow hover:bg-red-800"
                                      title="Remove image"
                                    >
                                      ×
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                            <label className="mt-3 block text-[11px] text-brand-text/70">
                              Add images
                              <input
                                name="newImages"
                                type="file"
                                accept="image/*"
                                multiple
                                className="mt-1 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-[#8BA888] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                              />
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="submit"
                              className="rounded-md bg-[#1C1C1C] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                            >
                              Save variants &amp; images
                            </button>
                            <Link
                              href={saveVariantsRedirectTo}
                              className="rounded-md border border-brand-text/25 bg-white px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg"
                            >
                              Cancel
                            </Link>
                          </div>
                        </form>
                      )}
                      <form action={toggleProductHidden} className="mt-3">
                        <input type="hidden" name="id" value={p._id} />
                        <input
                          type="hidden"
                          name="nextHidden"
                          value={String(!isHidden)}
                        />
                        <input type="hidden" name="redirectTo" value={returnTo} />
                        <button
                          type="submit"
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90 ${
                            isHidden
                              ? "bg-brand-text/10 text-brand-text/70"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {isHidden ? "Hidden" : "Live"}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
document.addEventListener('click',function(e){
var t=e.target;if(!t||!t.closest)return;
var c=t.closest('[data-close-details]');
if(c){e.preventDefault();var d=c.closest('details');if(d)d.open=false;}
},true);
})();`,
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200/80 bg-amber-50/80"
      : tone === "red"
        ? "border-red-200/80 bg-red-50/80"
        : "border-brand-text/10 bg-white";
  return (
    <div
      className={`rounded-lg border px-4 py-4 shadow-sm ${toneClass}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl text-brand-text">{value}</p>
    </div>
  );
}
