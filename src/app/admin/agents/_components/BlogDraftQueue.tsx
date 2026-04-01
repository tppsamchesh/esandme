"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DraftBlogPost } from "../_lib/fetch-drafts";

function formatCreated(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(s: string | null, max: number) {
  if (!s) return "—";
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function BlogDraftQueue({ drafts }: { drafts: DraftBlogPost[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(
    null,
  );

  async function callAction(
    id: string,
    action: "approve" | "reject",
  ): Promise<void> {
    setMessage(null);
    setPendingId(id);
    setPendingAction(action);
    const path =
      action === "approve"
        ? `/api/admin/blog/${encodeURIComponent(id)}/approve`
        : `/api/admin/blog/${encodeURIComponent(id)}/reject`;
    try {
      const res = await fetch(path, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setMessage({
          type: "error",
          text: json.error || `Request failed (${res.status})`,
        });
        return;
      }
      router.refresh();
    } catch (e: unknown) {
      const text = e instanceof Error ? e.message : "Something went wrong";
      setMessage({ type: "error", text });
    } finally {
      setPendingId(null);
      setPendingAction(null);
    }
  }

  if (drafts.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-brand-text/10 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm text-brand-text/75">
          No draft posts awaiting review.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {message ? (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {message.text}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-brand-text/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-brand-text/10 bg-brand-bg">
            <tr>
              <th className="px-3 py-3 font-medium text-brand-text">Title</th>
              <th className="px-3 py-3 font-medium text-brand-text">Slug</th>
              <th className="px-3 py-3 font-medium text-brand-text">Topic</th>
              <th className="px-3 py-3 font-medium text-brand-text">Excerpt</th>
              <th className="px-3 py-3 font-medium text-brand-text">Created</th>
              <th className="px-3 py-3 font-medium text-brand-text">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-text/10">
            {drafts.map((post) => {
              const busy =
                pendingId === post.id &&
                (pendingAction === "approve" || pendingAction === "reject");
              return (
                <tr key={post.id} className="bg-white">
                  <td className="px-3 py-3 align-top font-medium text-brand-text">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="text-brand-primary underline-offset-2 hover:underline"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="max-w-[140px] px-3 py-3 align-top text-brand-text/80">
                    <span className="break-all">{post.slug}</span>
                  </td>
                  <td className="max-w-[200px] px-3 py-3 align-top text-brand-text/75">
                    {truncate(post.topic_brief, 120)}
                  </td>
                  <td className="max-w-[220px] px-3 py-3 align-top text-brand-text/75">
                    {truncate(post.excerpt, 140)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-brand-text/65">
                    {formatCreated(post.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void callAction(post.id, "approve")}
                        className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy && pendingAction === "approve"
                          ? "…"
                          : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void callAction(post.id, "reject")}
                        className="rounded-md border border-brand-text/20 bg-white px-3 py-1.5 text-xs font-medium text-brand-text transition-colors hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy && pendingAction === "reject"
                          ? "…"
                          : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
