"use client";

import { deleteBlogPost } from "@/app/admin/blog/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePostButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `Delete “${title}”? This cannot be undone.`
    );
    if (!ok) return;
    setPending(true);
    const res = await deleteBlogPost(id);
    setPending(false);
    if (!res.ok) {
      window.alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
