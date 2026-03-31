import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin-client";
import { getSupabase } from "@/lib/supabase/client";
import { Resend } from "resend";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

type CartItem = {
  title?: string;
  quantity?: number;
  price?: number;
};

function formatItemsList(cart_items: unknown): string {
  if (!Array.isArray(cart_items)) return "";
  const lines = cart_items.map((raw) => {
    const item = raw as CartItem;
    const title = item.title?.trim() || "Item";
    const qty = typeof item.quantity === "number" ? item.quantity : 1;
    const line =
      typeof item.price === "number"
        ? `£${(item.price / 100).toFixed(2)}`
        : "";
    return line ? `• ${title} × ${qty} (${line} each)` : `• ${title} × ${qty}`;
  });
  return lines.join("<br/>");
}

function buildEmailHtml(email: string, cart_items: unknown): string {
  const itemsBlock = formatItemsList(cart_items);
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; color: #1c1c1c; background: #fdfaf7; padding: 24px;">
  <p style="font-size: 18px; color: #8ba888;">Hello — we noticed something lovely still waiting for you.</p>
  <p style="line-height: 1.6;">At Es &amp; Me, we pour care into every muslin, comforter, and little gift we send out. Your bag still holds:</p>
  <p style="line-height: 1.7; margin: 16px 0;">${itemsBlock || "Your selected pieces"}</p>
  <p style="line-height: 1.6;">Whenever you&apos;re ready, you can return to our shop and pick up where you left off. We&apos;d love to help you finish your order.</p>
  <p style="margin: 24px 0;">
    <a href="${SITE_URL}/cart" style="display: inline-block; background: #8ba888; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Return to your bag</a>
  </p>
  <p style="line-height: 1.6;">As a small thank-you for coming back, enjoy <strong>10% off</strong> with code <strong style="color: #c4a882;">COMEBACK10</strong> at checkout.</p>
  <p style="margin-top: 28px; font-size: 14px; color: #666;">With warmth,<br/>Es &amp; Me</p>
</body>
</html>
`.trim();
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    console.warn(
      "[abandoned-cart/recover] RESEND_API_KEY is not configured — skipping recovery emails."
    );
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "RESEND_API_KEY not configured",
      processed: 0,
    });
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from("abandoned_carts")
    .select("id, email, cart_items")
    .eq("recovery_email_sent", false)
    .eq("recovered", false)
    .lt("created_at", cutoff);

  if (error) {
    console.error("abandoned-cart recover query", error.message);
    return NextResponse.json(
      { error: "Failed to load abandoned carts" },
      { status: 500 }
    );
  }

  const resend = new Resend(resendKey);
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "Es & Me <onboarding@resend.dev>";

  let sent = 0;
  for (const row of rows ?? []) {
    const html = buildEmailHtml(row.email, row.cart_items);
    try {
      const { error: sendErr } = await resend.emails.send({
        from,
        to: row.email,
        subject: "You left something behind 🛍️",
        html,
      });
      if (sendErr) {
        console.warn(
          "[abandoned-cart/recover] Resend error for",
          row.email,
          sendErr
        );
        continue;
      }

      const now = new Date().toISOString();
      const { error: upErr } = await adminSupabase
        .from("abandoned_carts")
        .update({
          recovery_email_sent: true,
          recovery_email_sent_at: now,
        })
        .eq("id", row.id);

      if (upErr) {
        console.error("abandoned-cart recover update", upErr.message);
        continue;
      }
      sent += 1;
    } catch (e) {
      console.warn("[abandoned-cart/recover] send failed", row.id, e);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: sent,
    candidates: rows?.length ?? 0,
  });
}
