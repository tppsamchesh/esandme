import { client, urlFor } from "@/lib/sanity/client";
import { productBySlugQuery } from "@/lib/sanity/queries";
import AddToCart from "@/components/commerce/AddToCart";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

type ProductDoc = {
  title: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  price: number;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await client.fetch<ProductDoc | null>(productBySlugQuery, {
    slug,
  });

  if (!product) {
    return { title: "Product not found" };
  }

  const pageTitle = product.seoTitle || `${product.title} | Es & Me`;

  return {
    title: { absolute: pageTitle },
    description:
      product.seoDescription || product.description || undefined,
    alternates: {
      canonical: `/products/${slug}`,
    },
  };
}

function ReviewStars({ rating }: { rating: number }) {
  const safe = Math.min(5, Math.max(0, Math.round(Number(rating)) || 0));
  return (
    <div
      className="flex gap-0.5 text-brand-secondary"
      aria-label={`${safe} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={
            i < safe ? "h-4 w-4" : "h-4 w-4 text-brand-text/20"
          }
          aria-hidden
        >
          <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
        </svg>
      ))}
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await client.fetch(productBySlugQuery, { slug });

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-brand-text/70">
        Product not found
      </div>
    );
  }

  const collectionSlug = product.collection?.slug?.current;
  const collectionTitle = product.collection?.title;

  const schemaDescription =
    typeof product.description === "string" ? product.description : "";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: schemaDescription,
    offers: {
      "@type": "Offer",
      price: product.price / 100,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <div>
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {collectionTitle && collectionSlug ? (
          <nav
            className="mb-8 text-sm text-brand-text/55"
            aria-label="Breadcrumb"
          >
            <Link
              href={`/collections/${collectionSlug}`}
              className="transition-colors hover:text-brand-primary"
            >
              {collectionTitle}
            </Link>
            <span className="mx-2 text-brand-text/35" aria-hidden>
              →
            </span>
            <span className="text-brand-text/70" aria-current="page">
              {product.title}
            </span>
          </nav>
        ) : null}

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-14">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-[#E8E0D5]">
            {product.images?.[0] ? (
              <Image
                src={urlFor(product.images[0]).width(800).url()}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : null}
          </div>

          <div>
            <h1 className="font-heading text-4xl font-medium tracking-tight text-brand-text">
              {product.title}
            </h1>
            <p className="mt-4 font-sans text-xl font-medium text-brand-primary">
              £{(product.price / 100).toFixed(2)}
            </p>
            {product.description ? (
              <p className="mt-6 font-sans leading-relaxed text-gray-600">
                {product.description}
              </p>
            ) : null}
            <div className="mt-8">
              <AddToCart product={product} />
            </div>
          </div>
        </div>
        </div>

        {product.reviews?.length > 0 ? (
          <section
            className="border-t border-black/10 bg-brand-bg/40"
            aria-labelledby="product-reviews-heading"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
              <h2
                id="product-reviews-heading"
                className="font-heading text-2xl font-medium text-brand-text md:text-3xl"
              >
                Reviews
              </h2>
              <ul className="mt-8 divide-y divide-black/10">
                {product.reviews.map((review: any, i: number) => (
                  <li key={i} className="py-8 first:pt-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <ReviewStars rating={review.rating} />
                      <span className="font-sans text-sm font-medium text-brand-text">
                        {review.author}
                      </span>
                    </div>
                    {review.body ? (
                      <p className="mt-4 font-sans text-sm leading-relaxed text-gray-600">
                        {review.body}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
