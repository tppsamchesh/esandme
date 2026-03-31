"use client";

import { createProduct } from "@/app/admin/products/actions";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export type AdminCollectionOption = { _id: string; title: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function poundsToPence(s: string): number | null {
  const n = parseFloat(s.replace(/£/g, "").trim());
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

type VariantDraft = {
  id: string;
  title: string;
  size: string;
  colour: string;
  sku: string;
  pricePounds: string;
  stock: string;
};

function newVariantRow(): VariantDraft {
  return {
    id: Math.random().toString(36).slice(2),
    title: "",
    size: "",
    colour: "",
    sku: "",
    pricePounds: "",
    stock: "0",
  };
}

export function CreateProductForm({
  collections,
}: {
  collections: AdminCollectionOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [collectionId, setCollectionId] = useState(
    collections[0]?._id ?? "",
  );
  const [published, setPublished] = useState(true);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited]);

  const resetForm = useCallback(() => {
    setTitle("");
    setSlug("");
    setSlugEdited(false);
    setDescription("");
    setBasePrice("");
    setCollectionId(collections[0]?._id ?? "");
    setPublished(true);
    setVariants([]);
    setImageFiles([]);
    setError(null);
  }, [collections]);

  function addVariant() {
    setVariants((v) => [...v, newVariantRow()]);
  }

  function updateVariant(i: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => {
      const next = [...prev];
      const row = next[i];
      if (!row) return prev;
      next[i] = { ...row, ...patch };
      return next;
    });
  }

  function removeVariant(i: number) {
    setVariants((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const pricePence = poundsToPence(basePrice);
    if (pricePence == null) {
      setError("Enter a valid base price in pounds.");
      return;
    }

    if (!collectionId) {
      setError("Choose a collection.");
      return;
    }

    const slugValue = slug.trim().toLowerCase();
    if (!slugValue) {
      setError("Slug is required.");
      return;
    }

    for (const v of variants) {
      const p = v.pricePounds.trim();
      if (p !== "" && poundsToPence(p) == null) {
        setError(
          `Enter a valid price in pounds for variant "${v.title.trim() || "untitled"}", or leave price empty.`,
        );
        return;
      }
    }

    const variantPayload = variants.map((v) => {
      let pricePenceVariant: number | null = null;
      const p = v.pricePounds.trim();
      if (p !== "") {
        pricePenceVariant = poundsToPence(p)!;
      }
      const stockN = Math.max(0, Math.floor(parseInt(v.stock, 10) || 0));
      return {
        title: v.title.trim(),
        size: v.size.trim(),
        colour: v.colour.trim(),
        sku: v.sku.trim(),
        stock: stockN,
        pricePence: pricePenceVariant,
      };
    });

    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(
          data?.error && typeof data.error === "string"
            ? data.error
            : `Image upload failed (${res.status})`,
        );
        return;
      }
      if (!data?.url || typeof data.url !== "string") {
        setError("Invalid response from image upload.");
        return;
      }
      imageUrls.push(data.url);
    }

    startTransition(async () => {
      const res = await createProduct({
        title: title.trim(),
        slug: slugValue,
        description,
        pricePence,
        collectionId,
        published,
        variants: variantPayload,
        imageUrls,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(
        published
          ? "Product created and published."
          : "Product saved as a draft (hidden). Turn on Published when creating to show it on the shop.",
      );
      resetForm();
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-brand-text/10 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-brand-text/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-heading text-xl text-brand-text">
            New product
          </h2>
          <p className="mt-0.5 text-xs text-brand-text/60">
            Creates a row in Supabase. Base price is stored in pence.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setError(null);
            setSuccess(null);
          }}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {open ? "Hide form" : "Create new product"}
        </button>
      </div>

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 px-4 py-6 sm:px-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                Product title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
                required
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                Slug
              </span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value);
                }}
                className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
                required
                autoComplete="off"
              />
              <span className="mt-1 block text-[11px] text-brand-text/50">
                Generated from the title; edit any time.
              </span>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full resize-y rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                Base price (£)
              </span>
              <input
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                inputMode="decimal"
                placeholder="18.00"
                className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                Collection
              </span>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
                required
                disabled={collections.length === 0}
              >
                {collections.length === 0 ? (
                  <option value="">No collections yet</option>
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

          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              Images
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const list = e.target.files;
                setImageFiles(list ? Array.from(list) : []);
              }}
              className="mt-2 block w-full text-sm text-brand-text/80 file:mr-3 file:rounded-md file:border-0 file:bg-brand-bg file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-text"
            />
            {imageFiles.length > 0 ? (
              <p className="mt-2 text-xs text-brand-text/60">
                {imageFiles.length} file{imageFiles.length === 1 ? "" : "s"}{" "}
                selected
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading text-lg text-brand-text">Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="rounded-md border border-brand-text/20 bg-brand-bg px-3 py-1.5 text-sm text-brand-text hover:bg-brand-text/5"
              >
                Add variant
              </button>
            </div>
            {variants.length === 0 ? (
              <p className="mt-2 text-sm text-brand-text/70">
                No variants yet. Use &quot;Add variant&quot; to add SKU rows.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {variants.map((v, i) => (
                  <li
                    key={v.id}
                    className="rounded-lg border border-brand-text/10 bg-brand-bg/50 p-4"
                  >
                    <div className="mb-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="text-xs text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="text-xs text-brand-text/60">Title</span>
                        <input
                          value={v.title}
                          onChange={(e) =>
                            updateVariant(i, { title: e.target.value })
                          }
                          className="mt-1 w-full rounded-md border border-brand-text/15 bg-white px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-brand-text/60">Size</span>
                        <input
                          value={v.size}
                          onChange={(e) =>
                            updateVariant(i, { size: e.target.value })
                          }
                          className="mt-1 w-full rounded-md border border-brand-text/15 bg-white px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-brand-text/60">
                          Colour
                        </span>
                        <input
                          value={v.colour}
                          onChange={(e) =>
                            updateVariant(i, { colour: e.target.value })
                          }
                          className="mt-1 w-full rounded-md border border-brand-text/15 bg-white px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-brand-text/60">SKU</span>
                        <input
                          value={v.sku}
                          onChange={(e) =>
                            updateVariant(i, { sku: e.target.value })
                          }
                          className="mt-1 w-full rounded-md border border-brand-text/15 bg-white px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-brand-text/60">
                          Price (£)
                        </span>
                        <input
                          value={v.pricePounds}
                          onChange={(e) =>
                            updateVariant(i, { pricePounds: e.target.value })
                          }
                          inputMode="decimal"
                          placeholder="Uses base if empty"
                          className="mt-1 w-full rounded-md border border-brand-text/15 bg-white px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-brand-text/60">
                          Stock quantity
                        </span>
                        <input
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(i, { stock: e.target.value })
                          }
                          inputMode="numeric"
                          className="mt-1 w-full rounded-md border border-brand-text/15 bg-white px-2 py-1.5 text-sm"
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-brand-text/30 text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-brand-text">Published</span>
          </label>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-green-800" role="status">
              {success}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-brand-text/10 pt-4">
            <button
              type="submit"
              disabled={pending || collections.length === 0}
              className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save product"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
