/*
  Run in Supabase SQL editor before using this route:

  create table chatbot_enquiries (
    id uuid default gen_random_uuid() primary key,
    name text,
    email text,
    conversation jsonb,
    created_at timestamp with time zone default now()
  );
*/

import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin-client";

type ConvMessage = { role: "user" | "assistant"; content: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseConversation(raw: unknown): ConvMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ConvMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const m = item as { role?: string; content?: string };
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = typeof m.content === "string" ? m.content : "";
    out.push({ role, content });
  }
  return out.length ? out : null;
}

function firstUserMessage(conversation: ConvMessage[]): string {
  const u = conversation.find((m) => m.role === "user" && m.content.trim());
  return u?.content.trim() || "(no user message)";
}

function buildTranscriptHtml(conversation: ConvMessage[]): string {
  return conversation
    .map((m) => {
      const label = m.role === "user" ? "Customer" : "Assistant";
      const body = escapeHtml(m.content).replace(/\n/g, "<br/>");
      return `<p style="margin: 0 0 12px;"><strong>${escapeHtml(label)}:</strong><br/>${body}</p>`;
    })
    .join("");
}

function buildEmailHtml(
  name: string,
  email: string,
  conversation: ConvMessage[],
): string {
  const transcript = buildTranscriptHtml(conversation);
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; color: #1c1c1c; background: #fdfaf7; padding: 24px;">
  <p style="font-size: 18px; color: #8ba888;">New chatbot enquiry</p>
  <p style="line-height: 1.6;"><strong>Name:</strong> ${escapeHtml(name)}</p>
  <p style="line-height: 1.6;"><strong>Email:</strong> ${escapeHtml(email)}</p>
  <hr style="border: none; border-top: 1px solid #c4a882; margin: 24px 0;" />
  <p style="font-weight: 600; color: #1c1c1c;">Conversation</p>
  <div style="line-height: 1.6;">${transcript}</div>
</body>
</html>
`.trim();
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const b = body as {
      name?: unknown;
      email?: unknown;
      conversation?: unknown;
    };

    const name = typeof b.name === "string" ? b.name.trim() : "";
    const email = typeof b.email === "string" ? b.email.trim() : "";
    const conversation = parseConversation(b.conversation);

    if (!name || !email) {
      return NextResponse.json(
        { error: "name and email are required." },
        { status: 400 },
      );
    }
    if (!conversation) {
      return NextResponse.json(
        { error: "conversation must be a non-empty array of messages." },
        { status: 400 },
      );
    }

    const { error: insertError } = await adminSupabase
      .from("chatbot_enquiries")
      .insert({
        name,
        email,
        conversation,
      });

    if (insertError) {
      console.error("[chatbot/collect-details] Supabase insert", insertError);
      return NextResponse.json(
        { error: "Failed to save your enquiry. Please try again." },
        { status: 500 },
      );
    }

    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      const from =
        process.env.RESEND_FROM_EMAIL?.trim() ||
        "Es & Me <assistant@esandme.com>";
      const html = buildEmailHtml(name, email, conversation);
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: "hello@esandme.com",
            subject: `New chatbot enquiry from ${name}`,
            html,
          }),
        });
        if (!resendRes.ok) {
          const t = await resendRes.text();
          console.error(
            "[chatbot/collect-details] Resend error",
            resendRes.status,
            t,
          );
        }
      } catch (e) {
        console.error("[chatbot/collect-details] Resend fetch failed", e);
      }
    } else {
      console.warn(
        "[chatbot/collect-details] RESEND_API_KEY is not set — skipping email.",
      );
    }

    const tgToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const tgChatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!tgToken) {
      console.warn(
        "[chatbot/collect-details] TELEGRAM_BOT_TOKEN is not set — skipping Telegram notification.",
      );
    } else {
      const asked = firstUserMessage(conversation);
      const tgText =
        `🛍 New Es & Me enquiry\n\nName: ${name}\nEmail: ${email}\nAsked: ${asked}\n\nCheck the admin hub for the full conversation.`;
      try {
        const tgRes = await fetch(
          `https://api.telegram.org/bot${tgToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: tgChatId, text: tgText }),
          },
        );
        if (!tgRes.ok) {
          const t = await tgRes.text();
          console.error(
            "[chatbot/collect-details] Telegram error",
            tgRes.status,
            t,
          );
        }
      } catch (e) {
        console.error("[chatbot/collect-details] Telegram fetch failed", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[chatbot/collect-details]", e);
    const message =
      e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
