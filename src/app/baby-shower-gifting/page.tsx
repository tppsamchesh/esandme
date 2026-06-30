import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase/client";
import { BabyShowerBundleClient } from "./BabyShowerBundleClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Baby Shower Gifting — Build a Bundle & Save 10%",
  description:
    "Create the perfect baby shower gift. Pick your favourite Es & Me muslins, changing essentials and the Snuggy Bunny, bundle them and save 10%.",
  alternates: { canonical: "/baby-shower-gifting" },
  openGraph: {
    type: "website",
    title: "Baby Shower Gifting | Es & Me",
    description:
      "Build a personalised baby shower gift bundle and save 10%.",
    url: "/baby-shower-gifting",
  },
};

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
