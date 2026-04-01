import { getSupabase as createClient } from "@/lib/supabase/client";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createClient();
  const { slug } = await params;

  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id, title, slug, description, hero_image_url")
    .eq("slug", slug)
    .single();

  const { data: products, error: productsError } = collection
    ? await supabase
        .from("products")
        .select("id, title, slug, price")
        .eq("collection_id", collection.id)
        .eq("hidden", false)
    : { data: null, error: null };

  return (
    <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs">
      {JSON.stringify(
        {
          slug,
          collectionError: collectionError?.message,
          collection,
          productsError: productsError?.message,
          products,
        },
        null,
        2
      )}
    </pre>
  );
}
