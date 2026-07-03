import type { Metadata } from "next";
import { getSupabase as createClient } from "@/lib/supabase/client";
import { CollectionProductCard } from "./CollectionProductCard";
import {
  SITE,
  breadcrumbJsonLd,
  collectionJsonLd,
  jsonLdScript,
  truncateForMeta,
} from "@/lib/seo/site";

// ISR: serve a cached, statically-rendered page and refresh it at most once
// per hour. Far better TTFB / Core Web Vitals than force-dynamic, while keeping
// product listings reasonably fresh. Admin edits can trigger on-demand revalidation.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const supabase = createClient();
  const { slug } = await params;
  // Note: the collections table has no seo_title/seo_description columns
  // (unlike products/blog_posts), so we only request columns that exist.
  const { data } = await supabase
    .from("collections")
    .select("title, description, hero_image_url")
    .eq("slug", slug)
    .single();

  if (!data) {
    return { title: "Collection not found" };
  }

  const title = `${data.title} | ${SITE.name}`;
  // On-page intro copy can run long; keep the meta/OG description tight.
  const description = truncateForMeta(
    data.description ||
      `Shop the ${data.title} collection at ${SITE.name}. ${SITE.description}`,
  );

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/collections/${slug}`,
      ...(data.hero_image_url
        ? { images: [{ url: data.hero_image_url }] }
        : {}),
    },
  };
}

type CollectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
};

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  price: number;
};

type ProductImageRow = {
  product_id: string;
  url: string;
};

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createClient();
  const { slug } = await params;

  const { data: collection } = await supabase
    .from("collections")
    .select("id, title, slug, description, hero_image_url")
    .eq("slug", slug)
    .single();

  if (!collection) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-brand-text/80">
        <p className="font-sans text-lg">Collection not found</p>
      </div>
    );
  }

  const col = collection as CollectionRow;

  const { data: productsData } = await supabase
    .from("products")
    .select("id, title, slug, price")
    .eq("collection_id", col.id)
    .eq("hidden", false);

  const products = (productsData ?? []) as ProductRow[];

  let images: ProductImageRow[] | null = null;
  if (products.length > 0) {
    const { data: imagesData } = await supabase
      .from("product_images")
      .select("product_id, url")
      .in(
        "product_id",
        products.map((p) => p.id)
      )
      .order("position", { ascending: true });
    images = imagesData as ProductImageRow[] | null;
  }

  const collectionSchema = collectionJsonLd({
    title: col.title,
    slug: col.slug,
    description: col.description,
    products: products.map((p) => ({ title: p.title, slug: p.slug })),
  });
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: col.title, path: `/collections/${col.slug}` },
  ]);

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([collectionSchema, breadcrumbSchema]),
        }}
      />
      <section className="w-full">
        {col.hero_image_url ? (
          <div className="relative w-full">
            <img
              src={col.hero_image_url}
              alt={`${col.title} collection`}
              fetchPriority="high"
              decoding="async"
              className="h-48 sm:h-64 md:h-72 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" aria-hidden />
            <h1
              className="absolute bottom-8 left-8 max-w-[calc(100%-4rem)] font-heading text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl"
              style={{
                textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              {col.title}
            </h1>
          </div>
        ) : (
          <div className="bg-brand-primary/15 px-4 py-12 md:px-8 md:py-16">
            <div className="mx-auto max-w-7xl">
              <h1 className="font-heading text-4xl font-medium tracking-tight text-brand-text md:text-5xl lg:text-6xl">
                {col.title}
              </h1>
            </div>
          </div>
        )}
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        {col.description ? (
          <p className="max-w-3xl font-sans text-base leading-relaxed text-brand-text/80 md:text-lg">
            {col.description}
          </p>
        ) : null}

        {products.length === 0 ? (
          <p className="mt-12 text-center font-sans text-base text-brand-text/65 md:mt-16">
            No products in this collection yet
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:mt-12 lg:grid-cols-4">
            {products.map((product) => {
              const imageUrl = images?.find(
                (img) => img.product_id === product.id
              )?.url;

              return (
                <CollectionProductCard
                  key={product.id}
                  productId={product.id}
                  title={product.title}
                  slug={product.slug}
                  pricePence={product.price}
                  imageUrl={imageUrl ?? null}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
