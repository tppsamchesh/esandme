import { getSupabase as createClient } from "@/lib/supabase/client";
import Link from "next/link";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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

  return (
    <div className="w-full">
      <section
        className={`relative w-full min-h-[min(42vh,400px)] md:min-h-[min(48vh,520px)] ${
          col.hero_image_url ? "" : "bg-brand-primary/15"
        }`}
      >
        {col.hero_image_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${col.hero_image_url})` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-brand-text/45" aria-hidden />
          </>
        ) : null}
        <div className="relative z-10 flex min-h-[min(42vh,400px)] items-end px-4 pb-10 pt-24 md:min-h-[min(48vh,520px)] md:px-8 md:pb-14">
          <div className="mx-auto w-full max-w-7xl">
            <h1
              className={`font-heading text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl ${
                col.hero_image_url ? "text-brand-bg" : "text-brand-text"
              }`}
            >
              {col.title}
            </h1>
          </div>
        </div>
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
          <div className="mt-10 grid grid-cols-2 gap-5 gap-y-8 md:mt-12 md:grid-cols-3 md:gap-8">
            {products.map((product) => {
              const imageUrl = images?.find(
                (img) => img.product_id === product.id
              )?.url;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-xl border border-brand-text/10 bg-brand-bg shadow-sm transition-shadow duration-300 hover:border-brand-primary/35 hover:shadow-md">
                    <div className="relative aspect-square w-full overflow-hidden bg-brand-secondary/25">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-sans text-sm text-brand-text/35">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h2 className="font-heading text-lg font-medium leading-snug text-brand-text group-hover:text-brand-primary md:text-xl">
                        {product.title}
                      </h2>
                      <p className="mt-2 font-sans text-sm font-medium tabular-nums text-brand-primary md:text-base">
                        £{(product.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
