/*
  Run in Supabase SQL editor before using this route:

  ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
  ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS telegram_chat_id text;
  ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS telegram_message_id text;
*/

import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin-client";

const SYSTEM_PROMPT =
  `You are a blog writer for Es & Me (esandme.com), a UK organic baby products brand selling muslins, changing mats, changing bags, and the Snuggy Bunny comforter. Write warm, helpful, SEO-optimised blog posts for UK parents. Naturally mention Es & Me products where relevant without being pushy. Use UK spelling. Posts should be 600-900 words. Respond ONLY with a JSON object: {"title": "", "slug": "", "excerpt": "", "body": "", "seo_title": "", "seo_description": ""}`;

type BlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seo_title: string;
  seo_description: string;
};

function splitMessage(text: string, limit = 4096): string[] {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf("\n", limit);
    if (splitAt <= 0) splitAt = limit;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function sendTelegramMessage(chatId: string, text: string): Promise<number | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const chunks = splitMessage(text);
  let lastMessageId: number | null = null;
  for (const chunk of chunks) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: chunk, parse_mode: "Markdown" }),
      });
      if (res.ok) {
        const data = await res.json() as { result?: { message_id?: number } };
        lastMessageId = data.result?.message_id ?? null;
      } else {
        console.error("[telegram/webhook] sendMessage error", res.status, await res.text());
      }
    } catch (e) {
      console.error("[telegram/webhook] sendMessage fetch failed", e);
    }
  }
  return lastMessageId;
}

async function sendDraftMessage(chatId: string, post: BlogPost): Promise<number | null> {
  const approvalLine = "Reply 'Approve' to publish, or tell me what to change.";
  const content =
    `📝 Blog Draft\n\n**${post.title}**\n\n${post.excerpt}\n\n---\n${post.body}\n\n---\nSEO Title: ${post.seo_title}\nSEO Description: ${post.seo_description}`;

  if ((content + "\n\n" + approvalLine).length <= 4096) {
    return sendTelegramMessage(chatId, `${content}\n\n${approvalLine}`);
  }

  // Content exceeds one message — send content chunks then approval separately
  await sendTelegramMessage(chatId, content);
  return sendTelegramMessage(chatId, approvalLine);
}

function extractJsonObject(raw: string): string {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) return fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) return t.slice(start, end + 1);
  return t;
}

async function callClaude(userMessage: string): Promise<BlogPost> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errText}`);
  }

  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  const textBlock = data.content?.find((c) => c.type === "text");
  const rawText = textBlock?.text?.trim() ?? "";
  return JSON.parse(extractJsonObject(rawText)) as BlogPost;
}

export async function POST(req: Request) {
  try {
    let update: unknown;
    try {
      update = await req.json();
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const u = update as {
      message?: { text?: string; chat?: { id?: number }; message_id?: number };
    };

    const text = u.message?.text?.trim();
    const chatIdNum = u.message?.chat?.id;

    if (!text || !chatIdNum) {
      return NextResponse.json({ ok: true });
    }

    const chatId = chatIdNum.toString();

    // Security: only process messages from the configured chat ID
    const allowedChatId = process.env.TELEGRAM_CHAT_ID?.trim();
    if (!allowedChatId || chatId !== allowedChatId) {
      return NextResponse.json({ ok: true });
    }

    // Check for an existing draft belonging to this chat
    const { data: existingDraft } = await adminSupabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, body, seo_title, seo_description")
      .eq("status", "draft")
      .eq("telegram_chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingDraft) {
      // New topic — generate a fresh blog post
      await sendTelegramMessage(chatId, `Writing your post on: ${text}... This takes about 30 seconds.`);

      let post: BlogPost;
      try {
        post = await callClaude(text);
      } catch (e) {
        console.error("[telegram/webhook] callClaude failed", e);
        await sendTelegramMessage(chatId, "Sorry, something went wrong generating the post. Please try again.");
        return NextResponse.json({ ok: true });
      }

      const { data: inserted, error: insertError } = await adminSupabase
        .from("blog_posts")
        .insert({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          seo_title: post.seo_title,
          seo_description: post.seo_description,
          status: "draft",
          telegram_chat_id: chatId,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        console.error("[telegram/webhook] Supabase insert failed", insertError);
        await sendTelegramMessage(chatId, "Post generated but failed to save. Please try again.");
        return NextResponse.json({ ok: true });
      }

      const messageId = await sendDraftMessage(chatId, post);

      if (messageId) {
        await adminSupabase
          .from("blog_posts")
          .update({ telegram_message_id: messageId.toString() })
          .eq("id", inserted.id);
      }

      return NextResponse.json({ ok: true });
    }

    // Existing draft — check for approve or edit request
    if (text.toLowerCase() === "approve") {
      const { error: publishError } = await adminSupabase
        .from("blog_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          telegram_chat_id: null,
          telegram_message_id: null,
        })
        .eq("id", existingDraft.id);

      if (publishError) {
        console.error("[telegram/webhook] Supabase publish failed", publishError);
        await sendTelegramMessage(chatId, "Failed to publish. Please try again.");
        return NextResponse.json({ ok: true });
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
      await sendTelegramMessage(chatId, `Published! View it at: ${siteUrl}/blog/${existingDraft.slug}`);
      return NextResponse.json({ ok: true });
    }

    // Edit request
    await sendTelegramMessage(chatId, "Updating the post... one moment.");

    const editPrompt =
      `Here is a blog post draft:\n\nTitle: ${existingDraft.title}\nExcerpt: ${existingDraft.excerpt}\nBody: ${existingDraft.body}\nSEO Title: ${existingDraft.seo_title}\nSEO Description: ${existingDraft.seo_description}\n\nThe author wants these changes: ${text}. Rewrite the full post with those changes applied. Keep the same format and tone.`;

    let updatedPost: BlogPost;
    try {
      updatedPost = await callClaude(editPrompt);
    } catch (e) {
      console.error("[telegram/webhook] callClaude (edit) failed", e);
      await sendTelegramMessage(chatId, "Sorry, something went wrong updating the post. Please try again.");
      return NextResponse.json({ ok: true });
    }

    const { error: editError } = await adminSupabase
      .from("blog_posts")
      .update({
        title: updatedPost.title,
        slug: updatedPost.slug,
        excerpt: updatedPost.excerpt,
        body: updatedPost.body,
        seo_title: updatedPost.seo_title,
        seo_description: updatedPost.seo_description,
      })
      .eq("id", existingDraft.id);

    if (editError) {
      console.error("[telegram/webhook] Supabase update failed", editError);
      await sendTelegramMessage(chatId, "Failed to save changes. Please try again.");
      return NextResponse.json({ ok: true });
    }

    const messageId = await sendDraftMessage(chatId, updatedPost);

    if (messageId) {
      await adminSupabase
        .from("blog_posts")
        .update({ telegram_message_id: messageId.toString() })
        .eq("id", existingDraft.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[telegram/webhook]", e);
    return NextResponse.json({ ok: true });
  }
}
