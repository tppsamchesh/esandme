import { client, urlFor } from "@/lib/sanity/client";
import { collectionBySlugQuery } from "@/lib/sanity/queries";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

type CollectionDoc = {
  title: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await client.fetch<CollectionDoc | null>(
    collectionBySlugQuery,
    { slug }
  );

  if (!collection) {
    return { title: "Collection not found" };
  }

  const pageTitle =
    collection.seoTitle || `${collection.title} | Es & Me`;

  return {
    title: { absolute: pageTitle },
    description:
      collection.seoDescription || collection.description || undefined,
    alternates: {
      canonical: `/collections/${slug}`,
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await client.fetch(collectionBySlugQuery, { slug });

  if (!collection) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-brand-text/70">
        Collection not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <header className="border-b border-black/10 pb-8">
        <h1 className="font-heading text-4xl font-medium tracking-tight text-brand-text md:text-5xl">
          {collection.title}
        </h1>
        {collection.description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-text/75">
            {collection.description}
          </p>
        ) : null}
      </header>

      <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3">
        {collection.products?.map((product: any) => (
          <Link
            key={product._id}
            href={`/products/${product.slug.current}`}
            className="group block"
          >
            <article className="rounded-lg transition-shadow duration-300 hover:shadow-md">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-[#E8E0D5]">
                {product.images?.[0] ? (
                  <Image
                    src={urlFor(product.images[0]).width(600).url()}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : null}
              </div>
              <div className="pt-4">
                <h2 className="font-sans text-base font-medium text-brand-text">
                  {product.title}
                </h2>
                <p className="mt-1 font-sans text-sm font-medium text-brand-primary">
                  £{(product.price / 100).toFixed(2)}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
