import { fetchProductBySlug } from "@/lib/supabase/queries";
import { getSupabase } from "@/lib/supabase/client";
import AddToCart from "@/components/commerce/AddToCart";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductImageGallery } from "./ProductImageGallery";

type ProductDoc = {
  title: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  price: number;
  comparePrice?: number | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = (await fetchProductBySlug(slug)) as ProductDoc | null;

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
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-brand-text/70">
        Product not found
      </div>
    );
  }

  const collectionSlug = product.collection?.slug?.current;
  const collectionTitle = product.collection?.title;

  const supabase = getSupabase();

  const { data: images } = await supabase
    .from("product_images")
    .select("id, url, position")
    .eq("product_id", product._id)
    .order("position", { ascending: true });

  const { data: productMeta } = await supabase
    .from("products")
    .select("collection_id")
    .eq("id", product._id)
    .maybeSingle();

  type RelatedRow = {
    id: string;
    title: string;
    slug: string;
    price: number;
    imageUrl: string | null;
  };

  let relatedProducts: RelatedRow[] = [];

  if (productMeta?.collection_id) {
    const { data: related } = await supabase
      .from("products")
      .select("id, title, slug, price")
      .eq("collection_id", productMeta.collection_id)
      .eq("hidden", false)
      .neq("id", product._id)
      .limit(4);

    const rel = related ?? [];
    if (rel.length > 0) {
      const { data: relatedImageRows } = await supabase
        .from("product_images")
        .select("product_id, url, position")
        .in(
          "product_id",
          rel.map((r) => r.id),
        )
        .order("position", { ascending: true });

      const imgRows = relatedImageRows ?? [];
      relatedProducts = rel.map((r) => {
        const forProduct = imgRows
          .filter((img) => img.product_id === r.id)
          .sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
          );
        return {
          id: r.id,
          title: r.title,
          slug: r.slug,
          price: r.price,
          imageUrl: forProduct[0]?.url ?? null,
        };
      });
    }
  }

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
          <ProductImageGallery
            images={images ?? []}
            productTitle={product.title}
          />

          <div>
            <h1 className="font-heading text-4xl font-medium tracking-tight text-brand-text">
              {product.title}
            </h1>
            {product.comparePrice != null &&
            typeof product.comparePrice === "number" ? (
              <p className="mt-4 flex flex-wrap items-baseline gap-3 font-sans text-xl">
                <span className="font-medium text-brand-text/45 line-through">
                  £{(product.comparePrice / 100).toFixed(2)}
                </span>
                <span className="font-medium text-[#8BA888]">
                  £{(product.price / 100).toFixed(2)}
                </span>
              </p>
            ) : (
              <p className="mt-4 font-sans text-xl font-medium text-brand-primary">
                £{(product.price / 100).toFixed(2)}
              </p>
            )}
            {product.description ? (
              <div className="mt-5 border-t border-brand-text/8 pt-5">
                {product.description
                  .split(/\.\s+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((sentence, i, arr) => (
                    <p
                      key={i}
                      className={`${i > 0 ? "mt-3" : ""} font-sans leading-relaxed ${
                        i === 0
                          ? "text-base text-brand-text/90"
                          : "text-sm text-brand-text/75"
                      }`}
                    >
                      {sentence.endsWith(".") ? sentence : `${sentence}.`}
                    </p>
                  ))}
              </div>
            ) : null}
            <div className="mt-8">
              <AddToCart product={product} />
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <section
            className="mt-16 border-t border-black/10 pt-14 md:mt-20 md:pt-16"
            aria-labelledby="related-heading"
          >
            <h2
              id="related-heading"
              className="font-heading text-2xl font-medium text-brand-text md:text-3xl"
            >
              You may also like
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <li key={rp.id}>
                  <Link
                    href={`/products/${rp.slug}`}
                    className="group block cursor-pointer overflow-hidden rounded-xl border border-brand-text/10 bg-white shadow-sm transition-shadow hover:border-brand-primary/35 hover:shadow-md"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-brand-secondary/25">
                      {rp.imageUrl ? (
                        <img
                          src={rp.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-sans text-xs text-brand-text/35">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="font-heading text-xs font-medium leading-snug text-brand-text group-hover:text-brand-primary">
                        {rp.title}
                      </p>
                      <p className="mt-0.5 font-sans text-xs tabular-nums text-brand-text/60">
                        £{(rp.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
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
