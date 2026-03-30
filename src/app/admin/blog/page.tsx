import { DeletePostButton } from "@/app/admin/blog/_components/DeletePostButton";
import { fetchBlogPostsForAdmin } from "@/app/admin/blog/_lib/fetch-posts";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
};

function formatPublished(iso: string | null | undefined) {
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

export default async function AdminBlogPage() {
  const posts = await fetchBlogPostsForAdmin();

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-brand-text">Blog</h1>
          <p className="mt-1 text-sm text-brand-text/70">
            Manage journal posts stored in Sanity.
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center justify-center rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Write New Post
        </Link>
      </div>

      <div className="mt-2 rounded-lg border border-brand-secondary/30 bg-white/90 px-4 py-3 text-sm text-brand-text/85">
        <strong className="text-brand-text">Sanity write access:</strong> saving
        requires{" "}
        <code className="rounded bg-brand-bg px-1 py-0.5 text-xs">
          SANITY_API_TOKEN
        </code>{" "}
        with Editor permissions (project{" "}
        <span className="font-mono text-xs">2yjt26j6</span>, dataset production).
      </div>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-lg border border-brand-text/10 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-brand-text/85">
            No posts yet. When you&apos;re ready, write your first article — it
            will appear here and on the public blog.
          </p>
          <Link
            href="/admin/blog/new"
            className="mt-4 inline-block text-sm font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            Write New Post
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-brand-text/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-text/10 bg-brand-bg">
              <tr>
                <th className="px-3 py-3 font-medium text-brand-text">
                  Cover
                </th>
                <th className="px-3 py-3 font-medium text-brand-text">Title</th>
                <th className="px-3 py-3 font-medium text-brand-text">
                  Excerpt
                </th>
                <th className="px-3 py-3 font-medium text-brand-text">
                  Published
                </th>
                <th className="px-3 py-3 font-medium text-brand-text">
                  Status
                </th>
                <th className="px-3 py-3 font-medium text-brand-text">
                  SEO title
                </th>
                <th className="px-3 py-3 font-medium text-brand-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const hasSeo = Boolean(post.seoTitle?.trim());
                const published = Boolean(post.publishedAt);
                return (
                  <tr
                    key={post._id}
                    className="border-b border-brand-text/5 last:border-0"
                  >
                    <td className="px-3 py-2 align-middle">
                      <div className="relative h-12 w-20 overflow-hidden rounded bg-brand-bg">
                        {post.thumbUrl ? (
                          <Image
                            src={post.thumbUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-brand-text/35">
                            —
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[200px] px-3 py-2 font-medium text-brand-text">
                      {post.title}
                    </td>
                    <td className="max-w-xs px-3 py-2 text-brand-text/75">
                      <span className="line-clamp-2">
                        {post.excerpt?.trim() || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-brand-text/80">
                      {formatPublished(post.publishedAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {published ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-lg">
                      {hasSeo ? (
                        <span className="text-green-600" title="Set">
                          ✓
                        </span>
                      ) : (
                        <span className="text-brand-text/35" title="Not set">
                          ✗
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/blog/${post._id}/edit`}
                          className="rounded-md border border-brand-text/20 bg-white px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-bg"
                        >
                          Edit
                        </Link>
                        <DeletePostButton id={post._id} title={post.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
