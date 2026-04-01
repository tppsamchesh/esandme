import { adminSupabase } from "@/lib/supabase/admin-client";
import { revalidatePath } from "next/cache";
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

  if (variantRows.length === 0) {
    const standaloneStock =
      typeof b.standaloneStock === "number" && Number.isFinite(b.standaloneStock)
        ? Math.max(0, Math.floor(b.standaloneStock))
        : 0;
    variantRows.push({
      title: "Default",
      size: "",
      colour: "",
      sku: "",
      stock: standaloneStock,
    });
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

  let pos = 0;
  for (const url of imageUrls) {
    console.log("[admin/products POST] inserting image row, position:", pos, "url:", url);
    const imgRes = await adminSupabase.from("product_images").insert({
      product_id: productId,
      url,
      position: pos++,
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

/**
 * PATCH /api/admin/products
 * Full product update: core fields, variants (replace all), images (add URLs / remove by id).
 * Price is accepted as pounds (pricePounds) and stored as pence.
 */
export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const productId = typeof b.productId === "string" ? b.productId.trim() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const description =
    typeof b.description === "string" ? b.description : "";
  const slug = typeof b.slug === "string" ? b.slug.trim().toLowerCase() : "";
  const collectionId =
    typeof b.collectionId === "string" ? b.collectionId.trim() : "";
  const published = b.published !== false;

  let pricePence: number;
  if (typeof b.pricePounds === "number" && Number.isFinite(b.pricePounds)) {
    pricePence = Math.round(b.pricePounds * 100);
  } else if (typeof b.pricePounds === "string") {
    const n = parseFloat(b.pricePounds.replace(/£/g, "").trim());
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json(
        { error: "Invalid pricePounds" },
        { status: 400 },
      );
    }
    pricePence = Math.round(n * 100);
  } else {
    return NextResponse.json(
      { error: "pricePounds is required (number or string in pounds)" },
      { status: 400 },
    );
  }

  const variantsRaw = Array.isArray(b.variants) ? b.variants : [];
  const imageUrlsToAdd = Array.isArray(b.imageUrlsToAdd)
    ? b.imageUrlsToAdd.filter(
        (u): u is string => typeof u === "string" && u.trim().length > 0,
      )
    : [];
  const imageIdsToRemove = Array.isArray(b.imageIdsToRemove)
    ? b.imageIdsToRemove.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      )
    : [];
  const imageOrderRaw = Array.isArray(b.imageOrder) ? b.imageOrder : [];
  const imageOrder = imageOrderRaw.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );

  if (!productId || !title || !slug || !collectionId) {
    return NextResponse.json(
      {
        error:
          "productId, title, slug, and collectionId are required",
      },
      { status: 400 },
    );
  }
  if (!Number.isFinite(pricePence) || pricePence < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  try {
    const { error: upErr } = await adminSupabase
      .from("products")
      .update({
        title,
        slug,
        description: description.trim() || null,
        price: pricePence,
        collection_id: collectionId,
        hidden: !published,
      })
      .eq("id", productId);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { error: delVErr } = await adminSupabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId);
    if (delVErr) throw delVErr;

    const variantRows: Record<string, unknown>[] = [];
    for (const v of variantsRaw) {
      if (v === null || typeof v !== "object") continue;
      const row = v as Record<string, unknown>;
      const stockRaw = row.stock;
      const stockNum =
        typeof stockRaw === "number" && !Number.isNaN(stockRaw)
          ? stockRaw
          : parseInt(String(stockRaw ?? "0"), 10);
      const vr: Record<string, unknown> = {
        product_id: productId,
        title: String(row.title ?? "").trim(),
        size: String(row.size ?? "").trim(),
        colour: String(row.colour ?? "").trim(),
        sku: String(row.sku ?? "").trim(),
        stock: Math.max(0, Math.floor(Number.isNaN(stockNum) ? 0 : stockNum)),
      };
      const pp = row.pricePence;
      if (
        pp != null &&
        typeof pp === "number" &&
        Number.isFinite(pp)
      ) {
        vr.price = Math.round(pp);
      } else {
        vr.price = null;
      }
      variantRows.push(vr);
    }

    if (variantRows.length === 0) {
      const standaloneStock =
        typeof b.standaloneStock === "number" &&
        Number.isFinite(b.standaloneStock)
          ? Math.max(0, Math.floor(b.standaloneStock))
          : 0;
      variantRows.push({
        product_id: productId,
        title: "Default",
        size: "",
        colour: "",
        sku: "",
        stock: standaloneStock,
        price: null,
      });
    }

    if (variantRows.length > 0) {
      const { error: vInsErr } = await adminSupabase
        .from("product_variants")
        .insert(variantRows);
      if (vInsErr) throw vInsErr;
    }

    for (const imgId of imageIdsToRemove) {
      const { error: delImgErr } = await adminSupabase
        .from("product_images")
        .delete()
        .eq("id", imgId)
        .eq("product_id", productId);
      if (delImgErr) throw delImgErr;
    }

    if (imageUrlsToAdd.length > 0) {
      const { data: maxRow, error: maxErr } = await adminSupabase
        .from("product_images")
        .select("position")
        .eq("product_id", productId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxErr) throw maxErr;
      let pos =
        maxRow &&
        typeof (maxRow as { position: unknown }).position === "number"
          ? (maxRow as { position: number }).position
          : -1;

      const imgRows = imageUrlsToAdd.map((url) => {
        pos += 1;
        return {
          product_id: productId,
          url: url.trim(),
          position: pos,
        };
      });
      const { error: imgInsErr } = await adminSupabase
        .from("product_images")
        .insert(imgRows);
      if (imgInsErr) throw imgInsErr;
    }

    if (imageOrder.length > 0) {
      const { data: imgRows, error: listImgErr } = await adminSupabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId);
      if (listImgErr) throw listImgErr;
      const valid = new Set(
        (imgRows ?? []).map((r: { id: string }) => r.id),
      );
      const ordered = imageOrder.filter((id) => valid.has(id));
      for (let i = 0; i < ordered.length; i++) {
        const { error: posErr } = await adminSupabase
          .from("product_images")
          .update({ position: i })
          .eq("id", ordered[i])
          .eq("product_id", productId);
        if (posErr) throw posErr;
      }
    }

    revalidatePath("/admin/products");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : e !== null &&
            typeof e === "object" &&
            "message" in e &&
            typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
