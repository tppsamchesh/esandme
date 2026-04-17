"use client";

import { useCart } from "@/lib/store/cart";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export type BundleProductRow = {
  id: string;
  title: string;
  slug: string;
  price: number;
  imageUrl: string | null;
};

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function bundleUnitPricePence(originalPence: number): number {
  const gbp = originalPence / 100;
  const discountedGbp = Math.round(gbp * 0.9 * 100) / 100;
  return Math.round(discountedGbp * 100);
}

export function BabyShowerBundleClient({
  products,
}: {
  products: BundleProductRow[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedList = useMemo(
    () => products.filter((p) => selectedIds.has(p.id)),
    [products, selectedIds],
  );

  const totals = useMemo(() => {
    let original = 0;
    let finalTotal = 0;
    for (const p of selectedList) {
      original += p.price;
      finalTotal += bundleUnitPricePence(p.price);
    }
    const discount = original - finalTotal;
    return { original, finalTotal, discount };
  }, [selectedList]);

  const handleAddBundle = useCallback(() => {
    for (const product of selectedList) {
      const discounted = bundleUnitPricePence(product.price);
      addItem({
        id: product.id,
        title: product.title,
        price: discounted,
        image: product.imageUrl ?? "",
        quantity: 1,
      });
    }
    router.push("/cart");
  }, [addItem, router, selectedList]);

  const n = selectedIds.size;
  const showBar = n >= 1;

  return (
    <div
      className={`min-h-screen bg-brand-bg ${showBar ? "pb-28" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-brand-text md:text-4xl">
          Baby Shower Gifting
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-base text-brand-text/85 md:text-lg">
          Select 2 or more products and save 10% automatically.
        </p>

        {products.length === 0 ? (
          <p className="mt-12 font-sans text-sm text-brand-text/70">
            No products available right now.
          </p>
        ) : (
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => {
              const selected = selectedIds.has(p.id);
              const listPence = p.price;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`group relative w-full cursor-pointer overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md ${
                      selected
                        ? "ring-2 ring-brand-primary"
                        : "hover:ring-brand-primary/40"
                    } `}
                  >
                    <div className="relative aspect-[4/3] w-full bg-brand-bg">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
                        <span
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm"
                          aria-hidden
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-3.5 w-3.5"
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
                      ) : null}
                    </div>
                    <div className="p-2">
                      <p className="font-heading text-xs font-medium leading-snug text-brand-text">
                        {p.title}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-brand-text/80">
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
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 font-sans sm:px-6">
            <div className="min-w-0 flex-1 overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <p className="whitespace-nowrap text-sm text-brand-text tabular-nums">
                {n} item{n === 1 ? "" : "s"} selected · {formatGbp(totals.finalTotal)} ·{" "}
                <span className="text-[#8BA888]">
                  Save {formatGbp(totals.discount)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBundle}
              className="shrink-0 cursor-pointer rounded-md bg-brand-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 min-h-11"
            >
              Add bundle to bag
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
