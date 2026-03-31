"use client";

import {
  createBlogPost,
  updateBlogPost,
  uploadCoverImage,
  type SaveBlogPostInput,
} from "@/app/admin/blog/actions";
import { slugifyTitle } from "@/app/admin/blog/_lib/slugify";
import type { BlogPostDetail } from "@/app/admin/blog/_lib/fetch-posts";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function seoDescTone(len: number): "good" | "warn" {
  if (len >= 140 && len <= 160) return "good";
  return "warn";
}

export function PostEditorForm({
  mode,
  initial,
  initialCoverUrl,
}: {
  mode: "new" | "edit";
  initial: BlogPostDetail | null;
  initialCoverUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const slugTouched = useRef(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug?.current ?? "");
  const [publishedLocal, setPublishedLocal] = useState(
    toDatetimeLocalValue(initial?.publishedAt ?? undefined)
  );
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [bodyMarkdown, setBodyMarkdown] = useState(
    initial && typeof initial.body === "string" ? initial.body : ""
  );
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial?.seoDescription ?? ""
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initialCoverUrl,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit") slugTouched.current = true;
  }, [mode]);

  useEffect(() => {
    if (mode !== "new" || slugTouched.current) return;
    setSlug(slugifyTitle(title));
  }, [title, mode]);

  async function onCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadCoverImage(fd);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCoverImageUrl(res.url);
  }

  function buildPayload(publish: boolean): SaveBlogPostInput {
    const publishedAtIso =
      publishedLocal.trim() !== ""
        ? new Date(publishedLocal).toISOString()
        : null;
    return {
      title,
      slug,
      excerpt,
      bodyMarkdown,
      seoTitle,
      seoDescription,
      publishedAt: publishedAtIso,
      publish,
      coverImageUrl,
    };
  }

  function submit(publish: boolean) {
    setError(null);
    const payload = buildPayload(publish);
    startTransition(async () => {
      if (mode === "new") {
        const res = await createBlogPost(payload);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.replace(`/admin/blog/${res.id}/edit`);
        router.refresh();
        return;
      }
      if (!initial?._id) return;
      const res = await updateBlogPost(initial._id, payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const seoLen = seoDescription.length;
  const seoTone = seoDescTone(seoLen);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/blog"
          className="text-sm text-brand-primary underline-offset-2 hover:underline"
        >
          ← Back to posts
        </Link>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(false)}
            className="rounded-md border border-brand-text/20 bg-white px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(true)}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="space-y-6 rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-text/20 px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Slug
          </span>
          <input
            value={slug}
            onChange={(e) => {
              slugTouched.current = true;
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
            }}
            className="mt-1 w-full rounded-md border border-brand-text/20 px-3 py-2 font-mono text-sm"
            placeholder="auto-from-title"
          />
          <span className="mt-1 block text-xs text-brand-text/50">
            Auto-generated from title; you can edit.
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Published date
          </span>
          <input
            type="datetime-local"
            value={publishedLocal}
            onChange={(e) => setPublishedLocal(e.target.value)}
            className="mt-1 w-full max-w-xs rounded-md border border-brand-text/20 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-brand-text/50">
            Used when you click Publish. Leave empty to use “now”.
          </span>
        </label>

        <div>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              Excerpt
            </span>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-brand-text/20 px-3 py-2 text-sm"
            />
          </label>
          <p className="mt-1 text-xs text-brand-text/50">
            {excerpt.length} characters
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Cover image
          </span>
          <div className="mt-2 flex flex-wrap items-start gap-4">
            {coverImageUrl ? (
              <div className="relative h-40 w-56 overflow-hidden rounded-lg border border-brand-text/10 bg-brand-bg">
                <Image
                  src={coverImageUrl}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                  sizes="224px"
                />
              </div>
            ) : (
              <div className="flex h-40 w-56 items-center justify-center rounded-lg border border-dashed border-brand-text/25 bg-brand-bg text-sm text-brand-text/50">
                No cover
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={onCoverFile}
                className="text-sm"
              />
              <p className="mt-2 text-xs text-brand-text/50">
                Upload a clear image; shown large on the public post.
              </p>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Body (Markdown)
          </span>
          <textarea
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            rows={18}
            className="mt-1 w-full rounded-md border border-brand-text/20 bg-brand-bg/50 px-3 py-2 font-mono text-sm leading-relaxed"
            placeholder="Write in Markdown. Blank paragraphs separate blocks."
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            SEO title
          </span>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-text/20 px-3 py-2 text-sm"
          />
        </label>

        <div>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
              SEO description
            </span>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                seoTone === "good"
                  ? "border-green-300/80 bg-green-50/50"
                  : "border-amber-200/80 bg-amber-50/50"
              }`}
            />
          </label>
          <p
            className={`mt-1 text-xs ${
              seoTone === "good" ? "text-green-800" : "text-amber-900"
            }`}
          >
            {seoLen} characters — ideal length 140–160 for search snippets.
          </p>
        </div>
      </div>
    </div>
  );
}
