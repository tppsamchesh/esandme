import { getSupabase } from "@/lib/supabase/client";
import { BabyShowerBundleClient } from "./BabyShowerBundleClient";

export const dynamic = "force-dynamic";

export default async function BabyShowerGiftingPage() {
  const supabase = getSupabase();

  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, price")
    .eq("hidden", false);

  const { data: images } = products?.length
    ? await supabase
        .from("product_images")
        .select("product_id, url")
        .in(
          "product_id",
          products.map((p) => p.id),
        )
        .order("position", { ascending: true })
    : { data: [] };

  const productsWithImages = (products || []).map((p) => ({
    ...p,
    imageUrl: images?.find((img) => img.product_id === p.id)?.url || null,
  }));

  return <BabyShowerBundleClient products={productsWithImages} />;
}
