import { adminSupabase } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

type VariantInput = {
  title?: string;
  size?: string;
  colour?: string;
  sku?: string;
  stock?: number;
  pricePence?: number | null;
};

/**
 * POST /api/admin/products
 * Expects JSON only (image URLs as strings — upload files via /api/admin/upload-image first).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.error("[admin/products POST] Failed to parse JSON body:", e);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log(
    "[admin/products POST] raw body:",
    typeof body === "object" && body !== null
      ? JSON.stringify(body, null, 2)
      : String(body),
  );

  if (body === null || typeof body !== "object") {
    console.log("[admin/products POST] rejected: body is not an object");
    return NextResponse.json({ error: "Expected JSON object body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const slug = typeof b.slug === "string" ? b.slug.trim().toLowerCase() : "";
  const description =
    typeof b.description === "string" ? b.description.trim() : "";
  const collectionId =
    typeof b.collectionId === "string" ? b.collectionId.trim() : "";
  const published = b.published !== false;
  const pricePence =
    typeof b.pricePence === "number" && Number.isFinite(b.pricePence)
      ? Math.round(b.pricePence)
      : NaN;

  const variantsRaw = Array.isArray(b.variants) ? b.variants : [];
  const imageUrls = Array.isArray(b.imageUrls)
    ? b.imageUrls.filter((u): u is string => typeof u === "string" && u.length > 0)
    : [];

  console.log("[admin/products POST] normalized fields:", {
    title,
    slug,
    descriptionLength: description.length,
    collectionId,
    published,
    pricePence,
    variantCount: variantsRaw.length,
    imageUrlCount: imageUrls.length,
  });

  if (!title || !slug) {
    console.log("[admin/products POST] validation failed: missing title or slug");
    return NextResponse.json(
      { error: "title and slug are required" },
      { status: 400 },
    );
  }
  if (!collectionId) {
    console.log("[admin/products POST] validation failed: missing collectionId");
    return NextResponse.json(
      { error: "collectionId is required" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(pricePence) || pricePence < 0) {
    console.log("[admin/products POST] validation failed: invalid pricePence", pricePence);
    return NextResponse.json(
      { error: "pricePence must be a non-negative number" },
      { status: 400 },
    );
  }

  const variantRows: Record<string, unknown>[] = [];
  for (const v of variantsRaw) {
    if (v === null || typeof v !== "object") continue;
    const row = v as VariantInput;
    const vr: Record<string, unknown> = {
      title: (row.title ?? "").trim(),
      size: (row.size ?? "").trim(),
      colour: (row.colour ?? "").trim(),
      sku: (row.sku ?? "").trim(),
      stock: Math.max(
        0,
        Math.floor(
          typeof row.stock === "number" && !Number.isNaN(row.stock)
            ? row.stock
            : 0,
        ),
      ),
    };
    if (
      row.pricePence != null &&
      typeof row.pricePence === "number" &&
      Number.isFinite(row.pricePence)
    ) {
      vr.price = Math.round(row.pricePence);
    }
    variantRows.push(vr);
  }

  console.log("[admin/products POST] inserting product row…");

  const insertRes = await adminSupabase
    .from("products")
    .insert({
      title,
      slug,
      description: description || null,
      price: pricePence,
      collection_id: collectionId,
      hidden: !published,
      compare_price: null,
    })
    .select("id")
    .single();

  console.log("[admin/products POST] Supabase products.insert result:", {
    data: insertRes.data,
    error: insertRes.error,
    errorDetail: insertRes.error
      ? JSON.stringify(insertRes.error, null, 2)
      : null,
  });

  if (insertRes.error) {
    return NextResponse.json(
      { error: insertRes.error.message },
      { status: 500 },
    );
  }

  const productId = (insertRes.data as { id: string }).id;

  if (variantRows.length > 0) {
    const withPid = variantRows.map((row) => ({
      ...row,
      product_id: productId,
    }));
    console.log(
      "[admin/products POST] inserting variants, count:",
      withPid.length,
    );
    const vRes = await adminSupabase.from("product_variants").insert(withPid);
    console.log("[admin/products POST] Supabase product_variants.insert result:", {
      data: vRes.data,
      error: vRes.error,
      errorDetail: vRes.error
        ? JSON.stringify(vRes.error, null, 2)
        : null,
    });
    if (vRes.error) {
      return NextResponse.json(
        { error: vRes.error.message, productId },
        { status: 500 },
      );
    }
  }

  let sort = 0;
  for (const url of imageUrls) {
    console.log("[admin/products POST] inserting image row, sort:", sort, "url:", url);
    const imgRes = await adminSupabase.from("product_images").insert({
      product_id: productId,
      url,
      sort_order: sort++,
    });
    console.log("[admin/products POST] Supabase product_images.insert result:", {
      data: imgRes.data,
      error: imgRes.error,
      errorDetail: imgRes.error
        ? JSON.stringify(imgRes.error, null, 2)
        : null,
    });
    if (imgRes.error) {
      return NextResponse.json(
        { error: imgRes.error.message, productId },
        { status: 500 },
      );
    }
  }

  console.log("[admin/products POST] success, productId:", productId);
  return NextResponse.json({ data: { id: productId }, error: null });
}
