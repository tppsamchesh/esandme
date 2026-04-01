import Link from "next/link";
import type { Metadata } from "next";
import { BlogDraftQueue } from "./_components/BlogDraftQueue";
import { fetchDraftBlogPosts } from "./_lib/fetch-drafts";

export const metadata: Metadata = {
  title: "Agents",
};

export default async function AdminAgentsPage() {
  const drafts = await fetchDraftBlogPosts();

  return (
    <div className="p-6 md:p-8">
      <div>
        <h1 className="font-heading text-3xl text-brand-text">Agents</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Automate your content and operations with AI
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <article className="flex flex-col rounded-xl border-2 border-brand-primary bg-white p-6 shadow-md shadow-brand-primary/10 ring-1 ring-brand-primary/20">
          <h2 className="font-heading text-xl text-brand-text">Blog Post Writer</h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-text/75">
            Give the AI a topic and it will write a full SEO-optimised blog post for
            you to review and publish
          </p>
          <div className="mt-6">
            <Link
              href="/admin/agents/blog-writer"
              className="inline-flex rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Write a Post
            </Link>
          </div>
        </article>

        <article className="flex flex-col rounded-xl border border-brand-text/15 bg-white/80 p-6 opacity-95 shadow-sm">
          <h2 className="font-heading text-xl text-brand-text/80">
            Product Manager{" "}
            <span className="text-sm font-normal text-brand-text/50">(Coming Soon)</span>
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-text/60">
            Add and update products by describing them in plain English
          </p>
          <div className="mt-6">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md border border-brand-text/15 bg-brand-text/5 px-4 py-2 text-sm font-medium text-brand-text/45"
            >
              Coming Soon
            </button>
          </div>
        </article>

        <article className="flex flex-col rounded-xl border border-brand-text/15 bg-white/80 p-6 opacity-95 shadow-sm">
          <h2 className="font-heading text-xl text-brand-text/80">
            Customer Email Responder{" "}
            <span className="text-sm font-normal text-brand-text/50">(Coming Soon)</span>
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-text/60">
            Automatically draft responses to customer enquiries
          </p>
          <div className="mt-6">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md border border-brand-text/15 bg-brand-text/5 px-4 py-2 text-sm font-medium text-brand-text/45"
            >
              Coming Soon
            </button>
          </div>
        </article>
      </div>

      <div className="mt-12">
        <h2 className="font-heading text-xl text-brand-text">
          Draft posts for review
        </h2>
        <p className="mt-1 text-sm text-brand-text/70">
          Approve to publish on the journal, or reject to mark as not used.
        </p>
        <BlogDraftQueue drafts={drafts} />
      </div>
    </div>
  );
}
