import { adminSupabase } from "@/lib/supabase/admin-client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeHeroImageUrl(
  value: unknown,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

export async function GET() {
  const { data, error } = await adminSupabase
    .from("collections")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ data, error: null });
}

type PostBody = {
  title?: string;
  slug?: string;
  description?: string | null;
  hero_image_url?: string | null;
};

export async function POST(req: Request) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!title || !slug) {
    return NextResponse.json(
      { data: null, error: "title and slug are required" },
      { status: 400 },
    );
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const hero_image_url = normalizeHeroImageUrl(body.hero_image_url);

  const { data, error } = await adminSupabase
    .from("collections")
    .insert({
      title,
      slug,
      description: description || null,
      hero_image_url,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ data, error: null });
}

type PatchBody = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  hero_image_url?: string | null;
};

export async function PATCH(req: Request) {
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json(
      { data: null, error: "id is required" },
      { status: 400 },
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!title || !slug) {
    return NextResponse.json(
      { data: null, error: "title and slug are required" },
      { status: 400 },
    );
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const hero_image_url = normalizeHeroImageUrl(body.hero_image_url);

  const { data, error } = await adminSupabase
    .from("collections")
    .update({
      title,
      slug,
      description: description || null,
      hero_image_url,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ data, error: null });
}

type DeleteBody = { id?: string };

export async function DELETE(req: Request) {
  let body: DeleteBody;
  try {
    body = (await req.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await adminSupabase.from("collections").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
