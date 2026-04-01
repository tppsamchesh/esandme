import { adminSupabase } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  const originalName =
    fileEntry.name.replace(/^.*[/\\]/, "").trim() || "image";
  const filename = `${Date.now()}-${originalName}`;

  const buffer = Buffer.from(await fileEntry.arrayBuffer());

  const { error } = await adminSupabase.storage
    .from("product-images")
    .upload(filename, buffer, {
      contentType: fileEntry.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL" },
      { status: 500 },
    );
  }

  const url = `${base}/storage/v1/object/public/product-images/${filename}`;
  return NextResponse.json({ url });
}
