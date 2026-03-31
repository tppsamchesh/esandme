import { getSupabase } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/supabase/storage";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Collections",
};

type CollectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
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

export async function saveCollection(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString()?.trim();
  const redirectTo =
    formData.get("redirectTo")?.toString() || "/admin/collections";
  if (!id) {
    redirect(redirectTo);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect(redirectTo);
  }

  const title = formData.get("title")?.toString()?.trim() ?? "";
  const description = formData.get("description")?.toString() ?? "";

  try {
    const supabase = getSupabase();
    const { data: row, error: fe } = await supabase
      .from("collections")
      .select("id, hero_image_url")
      .eq("id", id)
      .maybeSingle();
    if (fe || !row) {
      redirect(redirectTo);
    }

    const file = formData.get("heroImage");
    let hero_image_url = (row as CollectionRow).hero_image_url;
    if (file instanceof File && file.size > 0) {
      hero_image_url = await uploadPublicImage(file, "collections");
    }

    await supabase
      .from("collections")
      .update({
        title,
        description: description.trim() || null,
        hero_image_url,
      })
      .eq("id", id);
  } catch {
    // Leave UI unchanged on failure; user can retry
  }
  revalidatePath("/admin/collections");
  redirect(redirectTo);
}

export async function createCollection(formData: FormData) {
  "use server";
  const redirectTo =
    formData.get("redirectTo")?.toString() || "/admin/collections";
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect(redirectTo);
  }

  const title = formData.get("title")?.toString()?.trim() ?? "";
  let slugCurrent = formData.get("slug")?.toString()?.trim() ?? "";
  const description = formData.get("description")?.toString() ?? "";

  if (!title) {
    redirect(redirectTo);
  }
  if (!slugCurrent) {
    slugCurrent = slugify(title);
  }
  if (!slugCurrent) {
    redirect(redirectTo);
  }

  try {
    const supabase = getSupabase();
    const file = formData.get("heroImage");
    let hero_image_url: string | null = null;
    if (file instanceof File && file.size > 0) {
      hero_image_url = await uploadPublicImage(file, "collections");
    }

    await supabase.from("collections").insert({
      title,
      slug: slugCurrent,
      description: description.trim() || null,
      hero_image_url,
    });
  } catch {
    // ignore; user can retry
  }
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  const showNew = sp.new === "1" || sp.new === "true";

  const supabase = getSupabase();
  const { data: rowsData } = await supabase
    .from("collections")
    .select("id, title, slug, description, hero_image_url")
    .order("title");
  const rows = (rowsData ?? []) as CollectionRow[];

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

      {showNew ? (
        <form
          action={createCollection}
          encType="multipart/form-data"
          className="mt-8 space-y-4 rounded-xl border border-brand-text/10 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="redirectTo" value="/admin/collections" />
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
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              Hero image
            </span>
            <input
              name="heroImage"
              type="file"
              accept="image/*"
              className="mt-1 block w-full max-w-lg text-sm file:mr-3 file:rounded file:border-0 file:bg-[#8BA888] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-[#1C1C1C] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create collection
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

      {rows.length === 0 ? (
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
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const heroThumb = c.hero_image_url;
            const slugText = c.slug ?? "";
            return (
              <div
                key={c.id}
                className="flex flex-col overflow-hidden rounded-xl border border-brand-text/10 bg-white text-left shadow-sm transition-shadow hover:border-brand-primary/40 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full bg-brand-bg">
                  {heroThumb ? (
                    <Image
                      src={heroThumb}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-brand-text/40">
                      No hero image
                    </div>
                  )}
                </div>
                <form
                  action={saveCollection}
                  encType="multipart/form-data"
                  className="flex flex-1 flex-col gap-3 p-4"
                >
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    type="hidden"
                    name="redirectTo"
                    value="/admin/collections"
                  />
                  {slugText ? (
                    <p className="font-mono text-[11px] text-brand-text/45">
                      /collections/{slugText}
                    </p>
                  ) : null}
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                      Title
                    </span>
                    <input
                      name="title"
                      type="text"
                      defaultValue={c.title ?? ""}
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
                      name="description"
                      rows={4}
                      defaultValue={c.description ?? ""}
                      className="mt-1 w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
                    />
                  </label>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
                      Hero image
                    </span>
                    <p className="mt-1 text-[11px] text-brand-text/50">
                      Choose a file to replace the hero. Leave empty to keep the
                      current image.
                    </p>
                    <input
                      name="heroImage"
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-[#8BA888] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-1 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Save changes
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
