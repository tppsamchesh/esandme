import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { fetchBlogPostBySlug } from "@/lib/supabase/queries";
import type { Metadata } from "next";

function formatPublishedDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

type BlogPost = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  coverImage?: string | null;
  body?: unknown;
  seoTitle?: string;
  seoDescription?: string;
};

function bodyToMarkdown(body: unknown): string {
  if (body == null) return "";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = (await fetchBlogPostBySlug(slug)) as BlogPost | null;
  if (!post) return { title: "Post not found" };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = (await fetchBlogPostBySlug(slug)) as BlogPost | null;

  if (!post) notFound();

  const markdown = bodyToMarkdown(post.body);

  return (
    <article className="pb-16 md:pb-24">
      <div className="border-b border-black/10 bg-brand-bg/50">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <Link
            href="/blog"
            className="text-sm text-brand-text/55 transition-colors hover:text-brand-primary"
          >
            ← Journal
          </Link>
          {post.publishedAt ? (
            <time
              dateTime={post.publishedAt}
              className="mt-4 block text-sm text-brand-text/55"
            >
              {formatPublishedDate(post.publishedAt)}
            </time>
          ) : null}
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-brand-text md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-4 text-lg leading-relaxed text-brand-text/70">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </div>

      {post.coverImage ? (
        <div className="mx-auto max-w-4xl px-4 pt-10">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#E8E0D5]">
            <img
              src={post.coverImage}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      ) : null}

      {markdown.trim() ? (
        <div className="mx-auto max-w-3xl px-4 pt-10 md:pt-12">
          <div
            className="blog-body space-y-4 text-base leading-relaxed text-gray-600 [&_a]:text-brand-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-brand-text [&_h3]:mt-8 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-brand-text [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_strong]:font-semibold [&_strong]:text-brand-text [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
          >
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      ) : null}
    </article>
  );
}
