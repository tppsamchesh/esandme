import { CreateProductForm } from "./_components/CreateProductForm";
import type { ProductListItem } from "./_lib/types";
import {
  productStockBadge,
  totalVariantStock,
  variantNumericStock,
} from "./_lib/stock";
import { formatGbp } from "@/lib/admin/format";
import { adminSupabase } from "@/lib/supabase/admin-client";
import { getSupabase } from "@/lib/supabase/client";
import Image from "next/image";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Products",
};

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
        .select("id, product_id, url, position")
        .in("product_id", pids)
        .order("position", { ascending: true }),
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
    Array<{ id: string; url: string; position: number | null }>
  >();
  for (const im of imgs ?? []) {
    const row = im as {
      id: string;
      product_id: string;
      url: string;
      position: number | null;
    };
    const list = iByPid.get(row.product_id) ?? [];
    list.push(row);
    iByPid.set(row.product_id, list);
  }

  return products.map((p) => {
    const col = p.collection_id ? colMap.get(p.collection_id) : null;
    const vrows = vByPid.get(p.id) ?? [];
    const irows = [...(iByPid.get(p.id) ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
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

/** Turn thrown values / API errors into a safe string for UI (never [object Object]). */
function unknownErrorToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err !== null && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.error === "string" && o.error) return o.error;
    if (typeof o.details === "string" && o.details) return o.details;
    try {
      return JSON.stringify(err);
    } catch {
      return "Unknown error";
    }
  }
  if (typeof err === "string") {
    const t = err.trim();
    if (t === "[object Object]") return "Unknown error (no message).";
    return err;
  }
  const s = String(err);
  return s === "[object Object]" ? "Unknown error (no message)." : s;
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
    await adminSupabase
      .from("products")
      .update({ hidden: nextHidden })
      .eq("id", id);
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
    const { data: row, error: fetchErr } = await adminSupabase
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
        await adminSupabase
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
        await adminSupabase
          .from("products")
          .update({ price: salePence })
          .eq("id", id);
      } else {
        await adminSupabase
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
    const pid = id.trim();
    await adminSupabase.from("product_variants").delete().eq("product_id", pid);
    await adminSupabase.from("product_images").delete().eq("product_id", pid);
    const { error } = await adminSupabase.from("products").delete().eq("id", pid);
    if (error) throw error;
  } catch (e: unknown) {
    const msg = unknownErrorToString(e);
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
  { value: "Changing Mats", label: "Changing Mats" },
  { value: "Changing Bags", label: "Changing Bags" },
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
      .order("title", { ascending: true }),
  ]);
  const rawCollections = (colRes.data ?? []) as Array<{
    id: string;
    title: string;
  }>;

  const collections = rawCollections.map((c) => ({
    _id: c.id,
    title: c.title,
  }));

  const stats = globalStats(products);
  const returnTo = buildAdminProductsPath({
    q: sp.q,
    collection: sp.collection,
    editPanel: sp.editPanel,
  });
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
                : `Could not delete product: ${unknownErrorToString(
                    safeDecode(sp.deleteError),
                  )}`}
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
                className="w-full cursor-pointer rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
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
                      className="relative block aspect-[4/3] w-full cursor-pointer bg-brand-bg"
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
                                  className="cursor-pointer rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
                                >
                                  Confirm
                                </button>
                              </form>
                              <button
                                type="button"
                                data-close-details
                                className="cursor-pointer rounded-md border border-brand-text/20 bg-white px-3 py-1.5 text-sm text-brand-text hover:bg-brand-bg"
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
                          className="cursor-pointer rounded-md bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
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
                            className="cursor-pointer text-sm font-medium text-brand-primary underline underline-offset-2 hover:opacity-90"
                          >
                            Edit product
                          </Link>
                        </p>
                      ) : (
                        <form
                          data-edit-product-form=""
                          data-product-id={p._id}
                          data-redirect={saveVariantsRedirectTo}
                          className="mt-4 space-y-4 rounded-lg border border-brand-text/15 bg-brand-bg/50 p-3"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                            Product details
                          </p>
                          <label className="block text-[11px] text-brand-text/70">
                            Title
                            <input
                              data-ep-field="title"
                              type="text"
                              required
                              defaultValue={p.title}
                              className="mt-0.5 w-full rounded-md border border-brand-text/20 bg-white px-2 py-1.5 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
                              autoComplete="off"
                            />
                          </label>
                          <label className="block text-[11px] text-brand-text/70">
                            Slug
                            <input
                              data-ep-field="slug"
                              type="text"
                              required
                              defaultValue={p.slug?.current ?? ""}
                              className="mt-0.5 w-full rounded-md border border-brand-text/20 bg-white px-2 py-1.5 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
                              autoComplete="off"
                            />
                          </label>
                          <label className="block text-[11px] text-brand-text/70">
                            Description
                            <textarea
                              data-ep-field="description"
                              rows={3}
                              defaultValue={p.description ?? ""}
                              className="mt-0.5 w-full resize-y rounded-md border border-brand-text/20 bg-white px-2 py-1.5 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
                            />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-[11px] text-brand-text/70">
                              Base price (£)
                              <input
                                data-ep-field="pricePounds"
                                type="text"
                                inputMode="decimal"
                                required
                                defaultValue={(p.price / 100).toFixed(2)}
                                className="mt-0.5 w-full rounded-md border border-brand-text/20 bg-white px-2 py-1.5 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
                                autoComplete="off"
                              />
                            </label>
                            <label className="block text-[11px] text-brand-text/70">
                              Collection
                              <select
                                data-ep-field="collectionId"
                                className="mt-0.5 w-full cursor-pointer rounded-md border border-brand-text/20 bg-white px-2 py-1.5 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
                                defaultValue={p.collection?._id ?? ""}
                                required
                              >
                                {collections.length === 0 ? (
                                  <option value="">No collections</option>
                                ) : (
                                  collections.map((c) => (
                                    <option key={c._id} value={c._id}>
                                      {c.title}
                                    </option>
                                  ))
                                )}
                              </select>
                            </label>
                          </div>
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-text">
                            <input
                              data-ep-field="published"
                              type="checkbox"
                              defaultChecked={!isHidden}
                              className="h-4 w-4 cursor-pointer rounded border-brand-text/30 text-brand-primary focus:ring-brand-primary"
                            />
                            Published (visible in shop)
                          </label>
                          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                            Variants
                          </p>
                          <div
                            className="space-y-3"
                            data-ep-variant-list=""
                          >
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
                                  data-variant-row=""
                                  className="relative rounded-lg border border-brand-text/10 bg-white p-3"
                                >
                                  <input
                                    type="checkbox"
                                    data-variant-remove=""
                                    id={`rm-variant-${p._id}-${k}`}
                                    className="peer sr-only"
                                  />
                                  <div className="grid gap-2 pt-5 peer-checked:opacity-50 peer-checked:line-through sm:grid-cols-2 lg:grid-cols-3">
                                    <label className="block text-[11px] text-brand-text/70">
                                      Title
                                      <input
                                        data-v-field="title"
                                        type="text"
                                        defaultValue={v.title ?? ""}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Size
                                      <input
                                        data-v-field="size"
                                        type="text"
                                        defaultValue={v.size ?? ""}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Colour
                                      <input
                                        data-v-field="colour"
                                        type="text"
                                        defaultValue={v.colour ?? ""}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      SKU
                                      <input
                                        data-v-field="sku"
                                        type="text"
                                        defaultValue={v.sku ?? ""}
                                        className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                        autoComplete="off"
                                      />
                                    </label>
                                    <label className="block text-[11px] text-brand-text/70">
                                      Price (£)
                                      <input
                                        data-v-field="priceGbp"
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
                                        data-v-field="stock"
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
                          </div>
                          <div
                            id={`variant-template-wrap-${p._id}`}
                            className="hidden"
                            aria-hidden
                          >
                            <div
                              data-variant-row=""
                              className="relative rounded-lg border border-dashed border-brand-primary/40 bg-white p-3"
                            >
                              <input
                                type="checkbox"
                                data-variant-remove=""
                                id={`rm-variant-tpl-${p._id}`}
                                className="peer sr-only"
                              />
                              <div className="grid gap-2 pt-5 peer-checked:opacity-50 peer-checked:line-through sm:grid-cols-2 lg:grid-cols-3">
                                <label className="block text-[11px] text-brand-text/70">
                                  Title
                                  <input
                                    data-v-field="title"
                                    type="text"
                                    className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                    autoComplete="off"
                                  />
                                </label>
                                <label className="block text-[11px] text-brand-text/70">
                                  Size
                                  <input
                                    data-v-field="size"
                                    type="text"
                                    className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                    autoComplete="off"
                                  />
                                </label>
                                <label className="block text-[11px] text-brand-text/70">
                                  Colour
                                  <input
                                    data-v-field="colour"
                                    type="text"
                                    className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                    autoComplete="off"
                                  />
                                </label>
                                <label className="block text-[11px] text-brand-text/70">
                                  SKU
                                  <input
                                    data-v-field="sku"
                                    type="text"
                                    className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                    autoComplete="off"
                                  />
                                </label>
                                <label className="block text-[11px] text-brand-text/70">
                                  Price (£)
                                  <input
                                    data-v-field="priceGbp"
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
                                    data-v-field="stock"
                                    type="number"
                                    min={0}
                                    step={1}
                                    defaultValue="0"
                                    className="mt-0.5 w-full rounded border border-brand-text/20 px-2 py-1.5 text-sm"
                                    autoComplete="off"
                                  />
                                </label>
                              </div>
                              <label
                                htmlFor={`rm-variant-tpl-${p._id}`}
                                className="absolute right-2 top-2 cursor-pointer text-xs font-medium text-red-800 hover:underline"
                              >
                                Remove
                              </label>
                            </div>
                          </div>
                          {(p.variants ?? []).length === 0 ? (
                            <div
                              data-ep-standalone-stock-wrap=""
                              className="rounded-lg border border-brand-text/10 bg-white p-3"
                            >
                              <label className="block text-[11px] text-brand-text/70">
                                Stock (no variants — saved as a default row)
                                <input
                                  data-ep-field="standaloneStock"
                                  type="number"
                                  min={0}
                                  step={1}
                                  defaultValue="0"
                                  className="mt-0.5 w-full max-w-[12rem] rounded border border-brand-text/20 px-2 py-1.5 text-sm text-brand-text"
                                  autoComplete="off"
                                />
                              </label>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            data-add-variant=""
                            data-template-wrap={`variant-template-wrap-${p._id}`}
                            className="cursor-pointer text-sm font-medium text-brand-primary underline underline-offset-2 hover:opacity-90"
                          >
                            + Add variant
                          </button>
                          <div className="border-t border-brand-text/10 pt-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                              Images
                            </p>
                            <p className="mt-1 text-[11px] text-brand-text/50">
                              Mark an image for removal, or choose new files to
                              upload immediately. The first image is the shop
                              thumbnail — use Set as primary to change it.
                            </p>
                            <div
                              className="mt-2 flex flex-wrap gap-4"
                              data-ep-images-row=""
                            >
                              {(p.images ?? []).map((img, imgIdx) => {
                                const row = img as { id?: string; url?: string };
                                const imgId = row.id;
                                const thumb = row.url;
                                if (!imgId || !thumb) return null;
                                const isPrimary = imgIdx === 0;
                                return (
                                  <div
                                    key={imgId}
                                    data-img-thumb-wrap=""
                                    data-img-id={imgId}
                                    className="relative flex flex-col items-center gap-1.5 rounded-md"
                                  >
                                    <div className="relative">
                                      <input
                                        type="checkbox"
                                        data-img-remove=""
                                        data-img-id={imgId}
                                        id={`rm-img-${p._id}-${imgIdx}-${imgId}`}
                                        className="peer sr-only"
                                      />
                                      <div
                                        data-img-ring-wrap=""
                                        className={`peer-checked:opacity-40 peer-checked:grayscale ${isPrimary ? "ring-2 ring-brand-primary" : ""} rounded-md`}
                                      >
                                        <Image
                                          src={thumb}
                                          alt=""
                                          width={96}
                                          height={96}
                                          className="h-20 w-20 rounded-md border border-brand-text/15 object-cover"
                                        />
                                      </div>
                                      <span
                                        data-img-primary-badge=""
                                        className={
                                          isPrimary
                                            ? "absolute left-0.5 top-0.5 rounded bg-brand-primary px-1 py-0.5 text-[9px] font-semibold uppercase text-white"
                                            : "absolute left-0.5 top-0.5 hidden rounded bg-brand-primary px-1 py-0.5 text-[9px] font-semibold uppercase text-white"
                                        }
                                      >
                                        Primary
                                      </span>
                                      <label
                                        htmlFor={`rm-img-${p._id}-${imgIdx}-${imgId}`}
                                        className="absolute -right-1 -top-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-brand-text text-xs font-bold text-white shadow hover:bg-red-800"
                                        title="Remove image"
                                      >
                                        ×
                                      </label>
                                    </div>
                                      <button
                                        type="button"
                                        data-set-primary-img=""
                                        data-img-id={imgId}
                                        className={
                                          isPrimary
                                            ? "hidden cursor-pointer text-xs font-medium text-brand-primary underline underline-offset-2"
                                            : "cursor-pointer text-xs font-medium text-brand-primary underline underline-offset-2 hover:opacity-90"
                                        }
                                      >
                                        Set as primary
                                      </button>
                                      <span
                                        data-img-primary-sub=""
                                        className={
                                          isPrimary
                                            ? "text-[10px] text-brand-text/50"
                                            : "hidden text-[10px] text-brand-text/50"
                                        }
                                      >
                                        Thumbnail
                                      </span>
                                  </div>
                                );
                              })}
                              <div
                                data-pending-images=""
                                className="contents"
                              />
                            </div>
                            <label className="mt-3 block cursor-pointer text-[11px] text-brand-text/70">
                              Add images
                              <input
                                data-edit-images-input=""
                                type="file"
                                accept="image/*"
                                multiple
                                className="mt-1 block w-full cursor-pointer text-sm text-brand-text/80 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand-bg file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-text"
                              />
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="submit"
                              data-ep-submit=""
                              className="cursor-pointer rounded-md bg-brand-text px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                            >
                              Save product
                            </button>
                            <Link
                              href={saveVariantsRedirectTo}
                              className="cursor-pointer rounded-md border border-brand-text/25 bg-white px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg"
                            >
                              Cancel
                            </Link>
                          </div>
                        </form>
                      )}
                      {editPanelId !== p._id ? (
                        <form action={toggleProductHidden} className="mt-3">
                          <input type="hidden" name="id" value={p._id} />
                          <input
                            type="hidden"
                            name="nextHidden"
                            value={String(!isHidden)}
                          />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={returnTo}
                          />
                          <button
                            type="submit"
                            className={`inline-flex cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90 ${
                              isHidden
                                ? "bg-brand-text/10 text-brand-text/70"
                                : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {isHidden ? "Hidden" : "Live"}
                          </button>
                        </form>
                      ) : null}
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

function slugifyFromTitle(s){
var t=String(s||'');
t=t.replace(/ - /g,'-');
return t.toLowerCase().trim()
.replace(/[^\\w\\s-]/g,'')
.replace(/[\\s_]+/g,'-')
.replace(/^-+|-+$/g,'')
.replace(/-+/g,'-');
}

document.addEventListener('input',function(e){
var inp=e.target;
if(!inp||!inp.getAttribute||inp.getAttribute('data-ep-field')!=='title')return;
var form=inp.closest('[data-edit-product-form]');
if(!form)return;
if(form._epSlugManual)return;
var slugInp=form.querySelector('[data-ep-field="slug"]');
if(!slugInp)return;
slugInp.value=slugifyFromTitle(inp.value);
},true);

document.addEventListener('input',function(e){
var inp=e.target;
if(!inp||!inp.getAttribute||inp.getAttribute('data-ep-field')!=='slug')return;
var form=inp.closest('[data-edit-product-form]');
if(!form)return;
form._epSlugManual=true;
},true);

function parseGbp(s){
if(s==null)return null;
var t=String(s).trim();
if(!t)return null;
var n=parseFloat(t.replace(/£/g,'').trim());
if(isNaN(n)||n<0)return null;
return Math.round(n*100);
}

document.addEventListener('click',function(e){
var btn=e.target&&e.target.closest&&e.target.closest('[data-add-variant]');
if(!btn)return;
e.preventDefault();
var wid=btn.getAttribute('data-template-wrap');
var wrap=wid?document.getElementById(wid):null;
if(!wrap||!wrap.firstElementChild)return;
var row=wrap.firstElementChild.cloneNode(true);
var uid='nv-'+Date.now();
var cb=row.querySelector('[data-variant-remove]');
if(cb){cb.checked=false;cb.id='rm-'+uid;}
var lab=row.querySelector('label[for]');
if(lab&&cb)lab.setAttribute('for',cb.id);
row.querySelectorAll('input:not([type=checkbox])').forEach(function(inp){
if(inp.getAttribute('data-v-field')==='stock')inp.value='0';
else inp.value='';
});
var list=btn.closest('form')&&btn.closest('form').querySelector('[data-ep-variant-list]');
if(list)list.appendChild(row);
var standalone=btn.closest('form')&&btn.closest('form').querySelector('[data-ep-standalone-stock-wrap]');
if(standalone)standalone.style.display='none';
},true);

function epRefreshImagePrimaryUi(row){
if(!row)return;
var wraps=row.querySelectorAll('[data-img-thumb-wrap]');
wraps.forEach(function(w,idx){
var ring=w.querySelector('[data-img-ring-wrap]');
var badge=w.querySelector('[data-img-primary-badge]');
var b=w.querySelector('[data-set-primary-img]');
var sub=w.querySelector('[data-img-primary-sub]');
if(idx===0){
if(ring){ring.classList.add('ring-2','ring-brand-primary');}
if(badge)badge.classList.remove('hidden');
if(b)b.classList.add('hidden');
if(sub)sub.classList.remove('hidden');
}else{
if(ring){ring.classList.remove('ring-2','ring-brand-primary');}
if(badge)badge.classList.add('hidden');
if(b){b.classList.remove('hidden');}
if(sub)sub.classList.add('hidden');
}
});
}

document.addEventListener('click',function(e){
var pr=e.target&&e.target.closest&&e.target.closest('[data-set-primary-img]');
if(!pr||pr.classList.contains('hidden'))return;
e.preventDefault();
var wrap=pr.closest('[data-img-thumb-wrap]');
var row=pr.closest('[data-ep-images-row]');
if(!wrap||!row)return;
var first=row.querySelector('[data-img-thumb-wrap]');
if(first&&wrap!==first)row.insertBefore(wrap,first);
epRefreshImagePrimaryUi(row);
},true);

document.addEventListener('change',function(e){
var inp=e.target;
if(!inp||!inp.hasAttribute||!inp.hasAttribute('data-edit-images-input'))return;
var form=inp.closest('form');
if(!form||!form.hasAttribute('data-edit-product-form'))return;
var pendingHost=form.querySelector('[data-pending-images]');
if(!pendingHost)return;
var files=inp.files;
if(!files||!files.length)return;
inp.disabled=true;
form._pendingUrls=form._pendingUrls||[];
(function go(i){
if(i>=files.length){inp.value='';inp.disabled=false;return;}
var fd=new FormData();
fd.append('file',files[i]);
fetch('/api/admin/upload-image',{method:'POST',body:fd})
.then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j,r:r};});})
.then(function(x){
if(!x.ok||!x.j||!x.j.url)throw new Error((x.j&&x.j.error)||'Upload failed');
form._pendingUrls.push(x.j.url);
var im=document.createElement('img');
im.src=x.j.url;
im.alt='';
im.width=96;im.height=96;
im.className='h-20 w-20 rounded-md border border-brand-text/15 object-cover';
pendingHost.appendChild(im);
go(i+1);
}).catch(function(err){alert(err.message||String(err));inp.value='';inp.disabled=false;});
})(0);
},true);

document.addEventListener('submit',function(e){
var form=e.target;
if(!form||!form.hasAttribute||!form.hasAttribute('data-edit-product-form'))return;
e.preventDefault();
var pid=form.getAttribute('data-product-id');
var red=form.getAttribute('data-redirect')||'/admin/products';
if(!pid)return;
var title=(form.querySelector('[data-ep-field="title"]')||{}).value||'';
var slug=(form.querySelector('[data-ep-field="slug"]')||{}).value||'';
var description=(form.querySelector('[data-ep-field="description"]')||{}).value||'';
var collectionId=(form.querySelector('[data-ep-field="collectionId"]')||{}).value||'';
var priceRaw=(form.querySelector('[data-ep-field="pricePounds"]')||{}).value||'';
var pricePounds=parseFloat(String(priceRaw).replace(/£/g,'').trim());
if(isNaN(pricePounds)||pricePounds<0){alert('Enter a valid base price in pounds.');return;}
var published=!!(form.querySelector('[data-ep-field="published"]')&&form.querySelector('[data-ep-field="published"]').checked);
var variants=[];
var vlist=form.querySelector('[data-ep-variant-list]');
if(vlist)vlist.querySelectorAll('[data-variant-row]').forEach(function(row){
var rm=row.querySelector('[data-variant-remove]');
if(rm&&rm.checked)return;
var titleV=(row.querySelector('[data-v-field="title"]')||{}).value||'';
var sizeV=(row.querySelector('[data-v-field="size"]')||{}).value||'';
var colourV=(row.querySelector('[data-v-field="colour"]')||{}).value||'';
var skuV=(row.querySelector('[data-v-field="sku"]')||{}).value||'';
var stockRaw=(row.querySelector('[data-v-field="stock"]')||{}).value||'0';
var stock=Math.max(0,parseInt(stockRaw,10)||0);
var pp=parseGbp((row.querySelector('[data-v-field="priceGbp"]')||{}).value);
variants.push({title:titleV,size:sizeV,colour:colourV,sku:skuV,stock:stock,pricePence:pp});
});
var imageOrder=[];
var imgRow=form.querySelector('[data-ep-images-row]');
if(imgRow){
imgRow.querySelectorAll('[data-img-thumb-wrap]').forEach(function(w){
var rm=w.querySelector('[data-img-remove]');
if(rm&&rm.checked)return;
var id=w.getAttribute('data-img-id');
if(id)imageOrder.push(id);
});
}
var imageIdsToRemove=[];
form.querySelectorAll('[data-img-remove]').forEach(function(cb){
if(cb.checked&&cb.getAttribute('data-img-id'))imageIdsToRemove.push(cb.getAttribute('data-img-id'));
});
var imageUrlsToAdd=form._pendingUrls||[];
var sub=form.querySelector('[data-ep-submit]');
if(sub)sub.disabled=true;
var patchBody={
productId:pid,
title:title,
slug:slug,
description:description,
collectionId:collectionId,
published:published,
pricePounds:pricePounds,
variants:variants,
imageUrlsToAdd:imageUrlsToAdd,
imageIdsToRemove:imageIdsToRemove
};
if(imageOrder.length>0)patchBody.imageOrder=imageOrder;
if(variants.length===0){
var ss=form.querySelector('[data-ep-field="standaloneStock"]');
patchBody.standaloneStock=Math.max(0,parseInt((ss&&ss.value)||'0',10)||0);
}
fetch('/api/admin/products',{
method:'PATCH',
headers:{'Content-Type':'application/json'},
body:JSON.stringify(patchBody)
})
.then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j,r:r};});})
.then(function(x){
if(!x.ok)throw new Error((x.j&&x.j.error)||('Request failed ('+x.r.status+')'));
window.location.href=red;
})
.catch(function(err){alert(err.message||String(err));if(sub)sub.disabled=false;});
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
