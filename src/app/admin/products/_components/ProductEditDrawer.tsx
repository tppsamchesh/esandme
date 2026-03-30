"use client";

import { saveProduct } from "@/app/admin/products/actions";
import type { ProductListItem } from "@/app/admin/products/_lib/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type VariantEdit = {
  _key: string;
  title: string;
  sku: string;
  stock: number;
  pricePence: number | null;
  size: string;
  colour: string;
};

function poundsToPence(s: string): number | null {
  const n = parseFloat(s.replace(/£/g, "").trim());
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

function penceToPounds(p: number | null | undefined): string {
  if (p == null || Number.isNaN(p)) return "";
  return (p / 100).toFixed(2);
}

export function ProductEditDrawer({
  product,
  open,
  onClose,
}: {
  product: ProductListItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePounds, setPricePounds] = useState("");
  const [variants, setVariants] = useState<VariantEdit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !product) return;
    setError(null);
    setTitle(product.title);
    setDescription(product.description ?? "");
    setPricePounds((product.price / 100).toFixed(2));
    setVariants(
      (product.variants ?? []).map((v) => ({
        _key: v._key,
        title: v.title ?? "",
        sku: v.sku ?? "",
        stock:
          typeof v.stock === "number" && !Number.isNaN(v.stock)
            ? Math.max(0, v.stock)
            : 0,
        pricePence: typeof v.price === "number" ? v.price : null,
        size: v.size ?? "",
        colour: v.colour ?? "",
      }))
    );
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const basePence = product.price;

  function updateVariant(i: number, patch: Partial<VariantEdit>) {
    setVariants((prev) => {
      const next = [...prev];
      const row = next[i];
      if (!row) return prev;
      next[i] = { ...row, ...patch };
      return next;
    });
  }

  function setVariantStock(i: number, delta: number) {
    setVariants((prev) => {
      const next = [...prev];
      const row = next[i];
      if (!row) return prev;
      next[i] = {
        ...row,
        stock: Math.max(0, row.stock + delta),
      };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const doc = product;
    if (!doc) return;
    const pricePence = poundsToPence(pricePounds);
    if (pricePence == null) {
      setError("Enter a valid base price in pounds.");
      return;
    }

    startTransition(async () => {
      const res = await saveProduct({
        id: doc._id,
        title,
        description,
        pricePence,
        variants: variants.map((v) => ({
          _key: v._key,
          title: v.title,
          sku: v.sku,
          stock: v.stock,
          pricePence: v.pricePence,
          size: v.size,
          colour: v.colour,
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-xl flex-col border-l border-brand-text/10 bg-brand-bg shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-text/10 px-6 py-4">
          <div>
            <h2
              id="edit-product-title"
              className="font-heading text-2xl text-brand-text"
            >
              Edit product
            </h2>
            <p className="mt-1 text-xs text-brand-text/60">
              Prices save in pence; shown in £ for editing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-brand-text/70 hover:bg-brand-text/5"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {product.galleryUrls.length > 0 ? (
              <div className="mb-8">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-text/60">
                  Images
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.galleryUrls.map((url, i) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-lg border border-brand-text/10 bg-white"
                    >
                      <Image
                        src={url}
                        alt={`${product.title} ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mb-6 text-sm text-brand-text/60">No images.</p>
            )}

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                Title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm"
                required
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="mt-1 w-full resize-y rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                Base price (£)
              </span>
              <input
                value={pricePounds}
                onChange={(e) => setPricePounds(e.target.value)}
                inputMode="decimal"
                className="mt-1 w-full max-w-xs rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </label>

            <div className="mt-8">
              <h3 className="font-heading text-lg text-brand-text">Variants</h3>
              {variants.length === 0 ? (
                <p className="mt-2 text-sm text-brand-text/70">
                  No variants on this product.
                </p>
              ) : (
                <ul className="mt-4 space-y-6">
                  {variants.map((v, i) => (
                    <li
                      key={v._key}
                      className="rounded-lg border border-brand-text/10 bg-white p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="text-xs text-brand-text/60">
                            Title
                          </span>
                          <input
                            value={v.title}
                            onChange={(e) =>
                              updateVariant(i, { title: e.target.value })
                            }
                            className="mt-1 w-full rounded-md border border-brand-text/15 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs text-brand-text/60">SKU</span>
                          <input
                            value={v.sku}
                            onChange={(e) =>
                              updateVariant(i, { sku: e.target.value })
                            }
                            className="mt-1 w-full rounded-md border border-brand-text/15 px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs text-brand-text/60">
                            Price override (£)
                          </span>
                          <input
                            value={penceToPounds(v.pricePence)}
                            onChange={(e) => {
                              const p = e.target.value.trim();
                              if (p === "") {
                                updateVariant(i, { pricePence: null });
                                return;
                              }
                              const pe = poundsToPence(p);
                              updateVariant(i, {
                                pricePence: pe,
                              });
                            }}
                            inputMode="decimal"
                            placeholder={`Base ${(basePence / 100).toFixed(2)}`}
                            className="mt-1 w-full rounded-md border border-brand-text/15 px-2 py-1.5 text-sm"
                          />
                          <span className="mt-0.5 block text-[11px] text-brand-text/50">
                            Leave empty to use base price ({(basePence / 100).toFixed(2)} £).
                          </span>
                        </label>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="text-xs text-brand-text/60">Stock</span>
                        <div className="inline-flex items-center gap-1 rounded-md border border-brand-text/15 bg-brand-bg">
                          <button
                            type="button"
                            className="px-3 py-1.5 text-lg leading-none text-brand-text hover:bg-brand-text/5"
                            onClick={() => setVariantStock(i, -1)}
                            aria-label="Decrease stock"
                          >
                            −
                          </button>
                          <span
                            className={`min-w-[2rem] text-center text-sm tabular-nums ${v.stock === 0 ? "text-red-700 font-medium" : v.stock > 0 && v.stock < 5 ? "text-amber-800 font-medium" : "text-brand-text"}`}
                          >
                            {v.stock}
                          </span>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-lg leading-none text-brand-text hover:bg-brand-text/5"
                            onClick={() => setVariantStock(i, 1)}
                            aria-label="Increase stock"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error ? (
              <p className="mt-4 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="border-t border-brand-text/10 bg-brand-bg px-6 py-4">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
