import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DESCRIPTIONS: Record<string, string> = {
  Muslins:
    "Soft, breathable, and big enough to properly swaddle in. Our organic muslin swaddle blankets are made from gentle cotton that keeps your little one cosy without overheating — perfect for newborns in every season. Use them for swaddling, as a pram cover, a burp cloth, or a nursing blanket. Once you feel the fabric, you'll understand why parents keep coming back for more.",
  "Changing Bags":
    "A baby changing bag built for real life. Side pockets for wipes and cream so you're not rummaging mid-change, plenty of room for nappies, bottles, and everything else, and designed to look good doing it. Lightweight enough for everyday use and spacious enough for full days out. Pairs beautifully with our changing mats for a matching set.",
  "Changing Mats":
    "A portable baby changing mat that actually feels nice for your little one. Towel-lined for warmth and comfort, compact enough to slip into any bag. Our travel changing mats give your baby a soft, familiar surface whether you're at home, visiting friends, or out for the day. No more cold, hard changing tables — just a quick unfold and you're sorted.",
  "Snuggy Bunny":
    "Part comforter, part best friend. The Snuggy Bunny baby comforter is the kind of soft that babies hold on to and don't let go. Designed to soothe and calm, it's perfect for nap time, bedtime, and all the in-between moments. A lovely baby shower gift or newborn present that they'll treasure. Made from gentle, hypoallergenic fabric that's safe from birth and machine washable — because life with a baby is messy and that's okay.",
};

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id, title, collections(title)");

  if (fetchError) {
    console.error("Failed to fetch products:", fetchError.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("No products found.");
    return;
  }

  console.log(`Found ${products.length} products. Updating descriptions…\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const collectionTitle =
      product.collections && typeof product.collections === "object"
        ? (product.collections as { title?: string }).title ?? null
        : null;

    if (!collectionTitle) {
      console.warn(`  SKIP  "${product.title}" — no collection`);
      skipped++;
      continue;
    }

    const description = DESCRIPTIONS[collectionTitle];
    if (!description) {
      console.warn(`  SKIP  "${product.title}" — unknown collection "${collectionTitle}"`);
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ description })
      .eq("id", product.id);

    if (updateError) {
      console.error(`  ERROR "${product.title}":`, updateError.message);
    } else {
      console.log(`  OK    "${product.title}" → ${collectionTitle}`);
      updated++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
