import Link from "next/link";
import { fetchAllBlogPosts } from "@/lib/supabase/queries";

function formatPublishedDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

type BlogPostCard = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  coverImage?: string | null;
};

export default async function BlogPage() {
  const posts = await fetchAllBlogPosts();

  return (
    <div>
      <section
        className="w-full bg-gradient-to-b from-brand-bg to-[#E8EFE7] px-4 py-16 text-center md:py-20"
        aria-labelledby="journal-heading"
      >
        <h1
          id="journal-heading"
          className="font-heading text-4xl font-medium tracking-tight text-brand-text md:text-5xl"
        >
          Journal
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-brand-text/75">
          Stories, tips, and gentle advice for new parents
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        {!posts?.length ? (
          <p className="text-center text-sm text-brand-text/60">
            New stories are on the way. Check back soon.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <li key={post._id}>
                <article>
                  <Link
                    href={`/blog/${post.slug.current}`}
                    className="group block"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#E8E0D5]">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : null}
                    </div>
                    {post.publishedAt ? (
                      <time
                        dateTime={post.publishedAt}
                        className="mt-4 block text-sm text-brand-text/55"
                      >
                        {formatPublishedDate(post.publishedAt)}
                      </time>
                    ) : null}
                    <h2 className="mt-2 font-heading text-2xl font-medium tracking-tight text-brand-text transition-colors group-hover:text-brand-primary">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-3 font-sans text-sm leading-relaxed text-gray-600 md:text-base">
                        {post.excerpt}
                      </p>
                    ) : null}
                    <span className="mt-4 inline-block text-sm font-medium text-brand-primary">
                      Read more →
                    </span>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
