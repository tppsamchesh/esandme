import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin-client";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing post id" }, { status: 400 });
  }

  const published_at = new Date().toISOString();

  const { data, error } = await adminSupabase
    .from("blog_posts")
    .update({
      status: "published",
      published_at,
    })
    .eq("id", id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Draft not found or already processed" },
      { status: 404 },
    );
  }

  revalidatePath("/admin/agents");
  revalidatePath("/admin/blog");
  revalidatePath("/blog");

  return NextResponse.json({ ok: true, published_at });
}
