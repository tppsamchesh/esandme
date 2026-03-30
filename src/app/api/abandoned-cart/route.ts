import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/client";

type Body = {
  email?: string;
  cartItems?: unknown;
  cartTotal?: number;
  stripeSessionId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const cart_items = body.cartItems ?? null;
    const cart_total =
      typeof body.cartTotal === "number" && Number.isFinite(body.cartTotal)
        ? Math.round(body.cartTotal)
        : null;
    const stripe_session_id =
      typeof body.stripeSessionId === "string"
        ? body.stripeSessionId.trim()
        : null;

    const supabase = getSupabase();
    const { error } = await supabase.from("abandoned_carts").insert({
      email,
      cart_items,
      cart_total,
      stripe_session_id,
    });

    if (error) {
      console.error("abandoned-cart insert", error.message);
      return NextResponse.json(
        { error: "Failed to save abandoned cart" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
