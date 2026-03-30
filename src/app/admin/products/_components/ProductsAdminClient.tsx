"use client";

import type { ProductListItem } from "@/app/admin/products/_lib/types";
import {
  productStockBadge,
  totalVariantStock,
  variantNumericStock,
} from "@/app/admin/products/_lib/stock";
import { formatGbp } from "@/lib/admin/format";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ProductEditDrawer } from "./ProductEditDrawer";

const COLLECTION_FILTERS = [
  { value: "all", label: "All collections" },
  { value: "Muslins", label: "Muslins" },
  { value: "Baby Changing", label: "Baby Changing" },
  { value: "Snuggy Bunny", label: "Snuggy Bunny" },
] as const;

function globalStats(products: ProductListItem[]) {
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

export function ProductsAdminClient({
  products,
}: {
  products: ProductListItem[];
}) {
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState<string>("all");
  const [selected, setSelected] = useState<ProductListItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stats = useMemo(() => globalStats(products), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (collection !== "all") {
        const t = p.collection?.title?.trim();
        if (t !== collection) return false;
      }
      if (!q) return true;
      return (p.title ?? "").toLowerCase().includes(q);
    });
  }, [products, search, collection]);

  function openProduct(p: ProductListItem) {
    setSelected(p);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelected(null);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-brand-secondary/40 bg-white/80 px-4 py-3 text-sm text-brand-text/90 shadow-sm">
        <p className="font-medium text-brand-text">Sanity API token</p>
        <p className="mt-1 text-brand-text/80">
          Saving changes requires{" "}
          <code className="rounded bg-brand-bg px-1 py-0.5 text-xs">
            SANITY_API_TOKEN
          </code>{" "}
          with <strong>Editor</strong> (write) permissions — not a viewer token.
          Check{" "}
          <span className="whitespace-nowrap">
            Sanity → Settings → API → Tokens
          </span>{" "}
          in the project (e.g.{" "}
          <span className="font-mono text-xs">2yjt26j6</span> / production).
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
        <div className="max-w-md flex-1">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            placeholder="Search by product name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
          />
        </div>
        <div className="w-full max-w-xs">
          <label htmlFor="collection-filter" className="sr-only">
            Collection
          </label>
          <select
            id="collection-filter"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
          >
            {COLLECTION_FILTERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-brand-text/10 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-brand-text/85">
            No products found yet. Add products in Sanity Studio — they will
            show up here automatically.
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
            return (
              <button
                key={p._id}
                type="button"
                onClick={() => openProduct(p)}
                className="group flex flex-col overflow-hidden rounded-xl border border-brand-text/10 bg-white text-left shadow-sm transition-shadow hover:border-brand-primary/40 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full bg-brand-bg">
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
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-heading text-lg leading-snug text-brand-text group-hover:text-brand-primary">
                    {p.title}
                  </h2>
                  <p className="mt-1 text-sm text-brand-text/65">
                    {p.collection?.title ?? "—"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-text/5 pt-3 text-sm">
                    <span className="font-medium text-brand-text">
                      {formatGbp(p.price)}
                    </span>
                    <span className="text-brand-text/70">
                      Stock:{" "}
                      <span className="tabular-nums text-brand-text">
                        {stockSum}
                      </span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <ProductEditDrawer
        product={selected}
        open={drawerOpen}
        onClose={closeDrawer}
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
