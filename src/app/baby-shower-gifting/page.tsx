"use client";

import { useCart } from "@/lib/store/cart";
import { fetchAllProductsPublic } from "@/lib/supabase/queries";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type BundleProduct = Awaited<
  ReturnType<typeof fetchAllProductsPublic>
>[number];

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/** Original list price in pence (first variant or product base price). */
function unitListPricePence(product: BundleProduct): number {
  const v0 = product.variants?.[0];
  const vp = v0?.price;
  return typeof vp === "number" && !Number.isNaN(vp) ? vp : product.price;
}

/** Bundle unit price: 90% of list, rounded to 2 decimal places in GBP. */
function bundleUnitPricePence(originalPence: number): number {
  const gbp = originalPence / 100;
  const discountedGbp = Math.round(gbp * 0.9 * 100) / 100;
  return Math.round(discountedGbp * 100);
}

export default function BabyShowerGiftingPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [products, setProducts] = useState<BundleProduct[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    void fetchAllProductsPublic()
      .then((rows) => {
        if (!cancelled) setProducts(rows);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load products.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedList = useMemo(
    () => products.filter((p) => selectedIds.has(p._id)),
    [products, selectedIds],
  );

  const totals = useMemo(() => {
    let original = 0;
    let finalTotal = 0;
    for (const p of selectedList) {
      const list = unitListPricePence(p);
      original += list;
      finalTotal += bundleUnitPricePence(list);
    }
    const discount = original - finalTotal;
    return { original, finalTotal, discount };
  }, [selectedList]);

  const handleAddBundle = useCallback(() => {
    for (const product of selectedList) {
      const list = unitListPricePence(product);
      const discounted = bundleUnitPricePence(list);
      const v0 = product.variants?.[0];
      const sku = v0?.sku;
      addItem({
        id: sku ? `${product._id}-${sku}` : product._id,
        title: v0?.title
          ? `${product.title} - ${v0.title}`
          : product.title,
        price: discounted,
        image: product.images[0] ?? "",
        quantity: 1,
        variant:
          v0 && sku
            ? { title: v0.title ?? "", sku }
            : undefined,
      });
    }
    router.push("/cart");
  }, [addItem, router, selectedList]);

  const n = selectedIds.size;
  const showBar = n >= 1;

  return (
    <div
      className={`min-h-screen bg-brand-bg pb-32 ${showBar ? "md:pb-36" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-brand-text md:text-4xl">
          Baby Shower Gifting
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-base text-brand-text/85 md:text-lg">
          Select 2 or more products and save 10% automatically.
        </p>

        {loading ? (
          <p className="mt-12 font-sans text-sm text-brand-text/70">
            Loading products…
          </p>
        ) : loadError ? (
          <p className="mt-12 font-sans text-sm text-red-800" role="alert">
            {loadError}
          </p>
        ) : products.length === 0 ? (
          <p className="mt-12 font-sans text-sm text-brand-text/70">
            No products available right now.
          </p>
        ) : (
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {products.map((p) => {
              const selected = selectedIds.has(p._id);
              const listPence = unitListPricePence(p);
              return (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => toggle(p._id)}
                    className={`group relative w-full cursor-pointer overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md ${
                      selected
                        ? "ring-2 ring-brand-primary"
                        : "hover:ring-brand-primary/40"
                    } `}
                  >
                    <div className="relative aspect-square w-full bg-brand-bg">
                      {p.images[0] ? (
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-xs text-brand-text/40"
                          aria-hidden
                        >
                          No image
                        </div>
                      )}
                      {selected ? (
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors"
                          aria-hidden
                        >
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-7 w-7 text-brand-primary"
                              aria-hidden
                            >
                              <path
                                d="M20 6L9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="font-heading text-base font-medium leading-snug text-brand-text md:text-lg">
                        {p.title}
                      </p>
                      <p className="mt-1 font-sans text-sm text-brand-text/80">
                        {formatGbp(listPence)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showBar ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-text/10 bg-white/95 px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm md:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-sans text-sm text-brand-text md:text-base">
              <p className="font-medium">
                {n} item{n === 1 ? "" : "s"} selected
              </p>
              <p className="mt-1 text-brand-text/80">
                Original total:{" "}
                <span className="tabular-nums text-brand-text">
                  {formatGbp(totals.original)}
                </span>
              </p>
              <p className="text-brand-text/80">
                10% bundle discount:{" "}
                <span className="tabular-nums text-brand-primary">
                  -{formatGbp(totals.discount)}
                </span>
              </p>
              <p className="mt-1 font-semibold text-brand-text">
                Final total:{" "}
                <span className="tabular-nums">{formatGbp(totals.finalTotal)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBundle}
              className="w-full shrink-0 cursor-pointer rounded-md bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              Add bundle to bag
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
