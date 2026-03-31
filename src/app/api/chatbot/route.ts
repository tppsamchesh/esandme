import { NextResponse } from "next/server";
import {
  fetchAllProductsPublic,
  fetchSiteSettings,
} from "@/lib/supabase/queries";

type IncomingMessage = { role: "user" | "assistant"; content: string };

type AnthropicContentBlock = { type: string; text?: string };

type AnthropicResponse = {
  content?: AnthropicContentBlock[];
};

function normalizeMessages(raw: unknown[]): IncomingMessage[] {
  const parsed: IncomingMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const m = item as { role?: string; content?: string };
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if (!content) continue;
    parsed.push({ role, content });
  }

  while (parsed.length > 0 && parsed[0].role !== "user") {
    parsed.shift();
  }

  const merged: IncomingMessage[] = [];
  for (const m of parsed) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`;
    } else {
      merged.push({ ...m });
    }
  }

  return merged;
}

function formatProductsForPrompt(
  products: Awaited<ReturnType<typeof fetchAllProductsPublic>>,
): string {
  if (!products.length) {
    return "No product rows are available from the catalogue right now. Be honest if asked about specific items.";
  }
  return products
    .map((p) => {
      const slug = p.slug.current;
      const desc =
        p.seoDescription?.trim() ||
        "See esandme.com for the full product description.";
      const collection = p.collection?.title ?? "General";
      const price = `£${p.price.toFixed(2)}`;
      const variantHint =
        p.variants.length > 0
          ? ` Options include: ${p.variants
              .map((v) =>
                [v.colour, v.size, v.title].filter(Boolean).join(" / "),
              )
              .filter(Boolean)
              .join("; ")}.`
          : "";
      return `${p.title} — ${price}. Collection: ${collection}. ${desc}${variantHint} Product page: /products/${slug}`;
    })
    .join("\n\n");
}

function buildSystemPrompt(
  productSection: string,
  freeDeliveryThresholdLabel: string,
): string {
  return `You are the Es & Me customer assistant on esandme.com. You help shoppers by chat.

About Es & Me:
- Es & Me sells thoughtful organic baby products in the United Kingdom, including muslin swaddles, changing mats, and the Snuggy Bunny comforter.
- You represent the brand in a friendly, warm, helpful way — like a knowledgeable friend, never robotic or stiff.

Current catalogue (use only this for prices and product facts; if something is not listed, say you are not sure rather than inventing):
${productSection}

Delivery:
- Standard delivery is £3.95.
- Orders over ${freeDeliveryThresholdLabel} qualify for free standard delivery (threshold comes from live shop settings).

Returns:
- Customers may return items within 30 days.
- Items must be unopened and in resalable condition.
- For returns help they should email hello@esandme.com.

Order tracking:
- Ask for their order number and the email used at checkout if they want tracking help.
- Explain that confirmation and updates are sent by email, and they can also contact hello@esandme.com with those details if they are stuck.

Tone and language:
- Always use UK spelling (for example colour, organise, favourite).
- The text inside the JSON "message" field must be plain conversational prose only: no markdown, no bullet points, no numbered lists, no headings.

When you cannot answer safely or the question is outside what you know from this brief and the catalogue:
- Still reply ONLY with valid JSON (see below).
- Set "collect_details" to true and use "message" to briefly explain you will connect them with the team who can help.

CRITICAL — output format:
- Respond with ONLY a single JSON object and nothing else. No markdown fences, no commentary before or after.
- The JSON must have exactly this shape:
{"message":"your reply here","collect_details":false}
- Use true for collect_details only when you need the team to follow up; otherwise false.
- Escape any double quotes inside "message" as required for valid JSON.`;
}

function extractJsonObject(raw: string): string {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) return fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return t.slice(start, end + 1);
  }
  return t;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chat is not configured (missing ANTHROPIC_API_KEY)." },
        { status: 500 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const messagesRaw = (body as { messages?: unknown }).messages;
    if (!Array.isArray(messagesRaw)) {
      return NextResponse.json(
        { error: "messages array is required." },
        { status: 400 },
      );
    }

    const messages = normalizeMessages(messagesRaw);
    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one non-empty user message is required." },
        { status: 400 },
      );
    }

    const [products, settings] = await Promise.all([
      fetchAllProductsPublic(),
      fetchSiteSettings(),
    ]);

    const threshold = settings?.freeDeliveryThreshold;
    const freeDeliveryThresholdLabel =
      typeof threshold === "number" && Number.isFinite(threshold)
        ? `£${threshold.toFixed(2)}`
        : "the free delivery threshold shown at checkout";

    const productSection = formatProductsForPrompt(products);
    const system = buildSystemPrompt(productSection, freeDeliveryThresholdLabel);

    const anthropicRes = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 500,
          system,
          messages,
        }),
      },
    );

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error("Anthropic API error", anthropicRes.status, errBody);
      return NextResponse.json(
        {
          error:
            "Sorry, the assistant could not reply just now. Please try again in a moment.",
        },
        { status: 500 },
      );
    }

    const data = (await anthropicRes.json()) as AnthropicResponse;
    const textBlock = data.content?.find((c) => c.type === "text");
    const rawText = textBlock?.text?.trim() ?? "";

    let parsed: { message?: unknown; collect_details?: unknown };
    try {
      parsed = JSON.parse(extractJsonObject(rawText)) as {
        message?: unknown;
        collect_details?: unknown;
      };
    } catch (e) {
      console.error("Chatbot JSON parse error", e, rawText);
      return NextResponse.json(
        {
          error:
            "Sorry, something went wrong processing the reply. Please try again.",
        },
        { status: 500 },
      );
    }

    const message =
      typeof parsed.message === "string" ? parsed.message : "";
    const collect_details = Boolean(parsed.collect_details);

    return NextResponse.json({
      message,
      collect_details,
    });
  } catch (e: unknown) {
    console.error("chatbot route", e);
    const message =
      e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
