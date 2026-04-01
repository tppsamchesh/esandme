"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

const COLLECTIONS_API_PATH = "/api/admin/collections";

type CollectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  created_at?: string;
};

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type ApiListJson = { data: CollectionRow[] | null; error: string | null };
type ApiRowJson = {
  data: CollectionRow | null;
  error: string | null;
};

async function uploadHeroImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null;
  if (!res.ok) {
    throw new Error(
      data?.error ?? `Upload failed (${res.status})`,
    );
  }
  if (!data?.url) {
    throw new Error("Invalid upload response");
  }
  return data.url;
}

function HeroImageField({
  initialUrl,
  onUrlChange,
  inputId,
  onUploadingChange,
}: {
  initialUrl: string | null;
  onUrlChange: (url: string | null) => void;
  inputId: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(initialUrl);
  }, [initialUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    setUploadError(null);
    try {
      const publicUrl = await uploadHeroImage(file);
      setPreview(publicUrl);
      onUrlChange(publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      {preview ? (
        <div className="relative mt-2 h-32 w-full max-w-lg overflow-hidden rounded-md border border-brand-text/15 bg-brand-bg">
          <Image
            src={preview}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
            unoptimized={
              preview.startsWith("http") && !preview.includes("localhost")
            }
          />
        </div>
      ) : null}
      <p className="mt-1 text-[11px] text-brand-text/50">
        {preview
          ? "Choose another file to replace."
          : "Choose a file to upload a hero image."}
      </p>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={handleFileChange}
        className="mt-2 block w-full max-w-lg text-sm file:mr-3 file:rounded file:border-0 file:bg-[#8BA888] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
      />
      {uploading ? (
        <p className="mt-1 text-xs text-brand-text/60">Uploading…</p>
      ) : null}
      {uploadError ? (
        <p
          className="mt-2 text-sm text-red-800"
          role="alert"
        >
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}

function CollectionEditCard({
  collection,
  onRemoved,
  onUpdated,
}: {
  collection: CollectionRow;
  onRemoved: (id: string) => void;
  onUpdated: (row: CollectionRow) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [heroImageUrl, setHeroImageUrl] = useState(
    () => collection.hero_image_url ?? "",
  );
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState(collection.title);
  const [description, setDescription] = useState(collection.description ?? "");

  useEffect(() => {
    setHeroImageUrl(collection.hero_image_url ?? "");
    setTitle(collection.title);
    setDescription(collection.description ?? "");
  }, [
    collection.id,
    collection.hero_image_url,
    collection.title,
    collection.description,
  ]);

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(COLLECTIONS_API_PATH, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: collection.id }),
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const err =
          raw && typeof raw === "object" && "error" in raw
            ? String((raw as { error?: string }).error)
            : `Delete failed (${res.status})`;
        setDeleteError(err);
        return;
      }
      onRemoved(collection.id);
      setConfirmDelete(false);
    } catch {
      setDeleteError("Network error while deleting.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleHeroFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setHeroImageUploading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(
          data?.error ?? `Upload failed (${res.status})`,
        );
      }
      if (!data?.url || typeof data.url !== "string") {
        throw new Error("Invalid upload response");
      }

      setHeroImageUrl(data.url);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Upload failed.",
      );
    } finally {
      setHeroImageUploading(false);
      e.target.value = "";
    }
  }

  const handleSave = async () => {
    if (heroImageUploading) return;

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      console.log("Saving collection:", {
        id: collection.id,
        hero_image_url: heroImageUrl,
      });

      const res = await fetch("/api/admin/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: collection.id,
          hero_image_url: heroImageUrl,
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const data = (await res.json()) as {
        error?: string | null;
        message?: string;
        data?: CollectionRow | null;
      };
      console.log("Save response:", res.status, data);

      if (!res.ok) {
        setErrorMessage(
          data?.error ||
            data?.message ||
            "Save failed — status " + res.status,
        );
      } else {
        setSuccessMessage("Saved successfully");
        if (data?.data) onUpdated(data.data);
      }
    } catch (err) {
      console.error("Save error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  const slugText = collection.slug ?? "";
  const previewSrc = heroImageUrl.trim();

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-brand-text/10 bg-white text-left shadow-sm transition-shadow hover:border-brand-primary/40 hover:shadow-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="flex flex-1 flex-col gap-3 p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          {slugText ? (
            <p className="font-mono text-[11px] text-brand-text/45">
              /collections/{slugText}
            </p>
          ) : (
            <span />
          )}
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(true);
                setDeleteError(null);
              }}
              className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-100"
            >
              Delete
            </button>
          ) : null}
        </div>

        {confirmDelete ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-3 text-sm text-red-950"
            role="alert"
          >
            <p>
              Delete <span className="font-semibold">{collection.title}</span>
              ? This
              cannot be undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Confirm"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteError(null);
                }}
                className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-50"
              >
                Cancel
              </button>
            </div>
            {deleteError ? (
              <p className="mt-2 text-sm text-red-800">{deleteError}</p>
            ) : null}
          </div>
        ) : null}

        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-brand-bg">
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 33vw"
              unoptimized={
                previewSrc.startsWith("http") &&
                !previewSrc.includes("localhost")
              }
            />
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-brand-text/40">
              No hero image yet
            </div>
          )}
        </div>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Choose a new image to replace
          </span>
          <input
            type="file"
            accept="image/*"
            disabled={heroImageUploading}
            onChange={handleHeroFileChange}
            className="mt-2 block w-full max-w-lg text-sm file:mr-3 file:rounded file:border-0 file:bg-[#8BA888] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white disabled:opacity-60"
          />
          {heroImageUploading ? (
            <span className="mt-1 inline-block text-xs text-brand-text/60">
              Uploading...
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
            autoComplete="off"
          />
        </label>
        <label className="block flex-1">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
          />
        </label>

        <button
          type="submit"
          disabled={saving || heroImageUploading}
          className="mt-1 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        {successMessage && (
          <p className="text-sm font-medium text-[#8BA888]" role="status">
            {successMessage}
          </p>
        )}
        {errorMessage && (
          <p className="text-sm font-medium text-red-800" role="alert">
            {errorMessage}
          </p>
        )}
      </form>
    </div>
  );
}

function AdminCollectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showNew =
    searchParams.get("new") === "1" || searchParams.get("new") === "true";
  const queryError = searchParams.get("error")?.trim();

  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<
    string | undefined
  >();
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newHeroUrl, setNewHeroUrl] = useState<string | null>(null);
  const [newHeroUploading, setNewHeroUploading] = useState(false);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    setFetchErrorMessage(undefined);
    try {
      const listRes = await fetch(COLLECTIONS_API_PATH, { cache: "no-store" });
      const listJson = (await listRes.json()) as ApiListJson;
      if (!listRes.ok || listJson.error) {
        setFetchErrorMessage(
          listJson.error ?? `Could not load collections (${listRes.status})`,
        );
        setRows([]);
      } else {
        setRows(listJson.data ?? []);
      }
    } catch {
      setFetchErrorMessage("Could not parse collections API response.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    let slugCurrent = String(fd.get("slug") ?? "").trim();
    const description = String(fd.get("description") ?? "");

    if (!title) {
      setCreateError("Title is required.");
      return;
    }
    if (!slugCurrent) {
      slugCurrent = slugify(title);
    }
    if (!slugCurrent) {
      setCreateError("Could not generate a URL slug from the title.");
      return;
    }
    if (newHeroUploading) {
      setCreateError("Wait for the hero image to finish uploading.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(COLLECTIONS_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title,
          slug: slugCurrent,
          description: description.trim() || null,
          hero_image_url: newHeroUrl,
        }),
      });
      const raw = await res.json().catch(() => null);
      if (raw === null || typeof raw !== "object") {
        setCreateError("Invalid response from collections API.");
        return;
      }
      const json = raw as ApiRowJson;
      if (!res.ok || json.error) {
        setCreateError(json.error ?? `Create failed (${res.status})`);
        return;
      }
      if (json.data) {
        setRows((prev) => [...prev, json.data!]);
      }
      setNewHeroUrl(null);
      form.reset();
      router.push("/admin/collections");
    } catch {
      setCreateError("Network error while creating.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-brand-text">
            Collections
          </h1>
          <p className="mt-1 text-sm text-brand-text/70">
            Manage shop collections — titles, copy, and hero images (Supabase).
          </p>
        </div>
        {showNew ? (
          <Link
            href="/admin/collections"
            className="inline-flex items-center justify-center rounded-md border border-brand-text/20 bg-white px-5 py-2.5 text-sm font-medium text-brand-text shadow-sm transition-colors hover:bg-brand-bg"
          >
            Cancel
          </Link>
        ) : (
          <Link
            href="/admin/collections?new=1"
            className="inline-flex items-center justify-center rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            New Collection
          </Link>
        )}
      </div>

      {queryError ? (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{queryError}</p>
        </div>
      ) : null}

      {fetchErrorMessage ? (
        <div
          className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">Could not load collections</p>
          <p className="mt-1 whitespace-pre-wrap break-words">
            {fetchErrorMessage}
          </p>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-brand-text/70">Loading collections…</p>
      ) : null}

      {showNew ? (
        <form
          onSubmit={handleCreate}
          className="mt-8 space-y-4 rounded-xl border border-brand-text/10 bg-white p-5 shadow-sm"
        >
          <h2 className="font-heading text-xl text-brand-text">
            New collection
          </h2>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              Title
            </span>
            <input
              name="title"
              type="text"
              required
              className="mt-1 w-full max-w-lg rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
              placeholder="e.g. Muslins"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              Slug
            </span>
            <input
              name="slug"
              type="text"
              className="mt-1 w-full max-w-lg rounded-md border border-brand-text/20 bg-white px-3 py-2 font-mono text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
              placeholder="muslins (auto from title if left blank)"
              autoComplete="off"
            />
            <span className="mt-1 block text-[11px] text-brand-text/50">
              URL segment for <span className="font-mono">/collections/…</span>.
              Leave blank to generate from the title.
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              Description
            </span>
            <textarea
              name="description"
              rows={4}
              className="mt-1 w-full max-w-2xl rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
              placeholder="Short intro for the collection page…"
            />
          </label>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              Hero image
            </span>
            <HeroImageField
              initialUrl={newHeroUrl}
              onUrlChange={setNewHeroUrl}
              onUploadingChange={setNewHeroUploading}
              inputId="hero-new"
            />
          </div>
          {createError ? (
            <p className="text-sm text-red-800" role="alert">
              {createError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={creating || newHeroUploading}
            className="rounded-md bg-[#1C1C1C] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {newHeroUploading
              ? "Uploading image…"
              : creating
                ? "Creating…"
                : "Create collection"}
          </button>
        </form>
      ) : null}

      <div className="mt-8 rounded-lg border border-brand-secondary/40 bg-white/80 px-4 py-3 text-sm text-brand-text/90 shadow-sm">
        <p className="font-medium text-brand-text">Supabase</p>
        <p className="mt-1 text-brand-text/80">
          Collections are stored in Supabase. Hero images upload to the{" "}
          <code className="rounded bg-brand-bg px-1 py-0.5 text-xs">
            product-images
          </code>{" "}
          storage bucket.
        </p>
      </div>

      {!fetchErrorMessage && !loading && rows.length === 0 ? (
        <div className="mt-10 rounded-lg border border-brand-text/10 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-brand-text/85">
            No collections yet. Create one to group products on the storefront.
          </p>
          <Link
            href="/admin/collections?new=1"
            className="mt-4 inline-block text-sm font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            New Collection
          </Link>
        </div>
      ) : null}

      {!fetchErrorMessage && !loading && rows.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <CollectionEditCard
              key={c.id}
              collection={c}
              onRemoved={(id) =>
                setRows((prev) => prev.filter((row) => row.id !== id))
              }
              onUpdated={(row) =>
                setRows((prev) =>
                  prev.map((x) => (x.id === row.id ? row : x)),
                )
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminCollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-8 text-sm text-brand-text/70">
          Loading…
        </div>
      }
    >
      <AdminCollectionsContent />
    </Suspense>
  );
}
