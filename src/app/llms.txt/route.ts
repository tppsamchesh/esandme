import { adminSupabase } from "@/lib/supabase/admin-client";
import { SITE, getSiteUrl } from "@/lib/seo/site";

export const revalidate = 3600;

/**
 * llms.txt — a concise, machine-readable map of the site for AI answer engines
 * (ChatGPT, Perplexity, Claude, Google AI Overviews). It points crawlers at the
 * canonical brand description and the most important shopping + content URLs so
 * they cite Es & Me accurately. See https://llmstxt.org/.
 */
export async function GET() {
  const base = getSiteUrl();

  const [{ data: collections }, { data: posts }] = await Promise.all([
    adminSupabase.from("collections").select("slug, title, description"),
    adminSupabase
      .from("blog_posts")
      .select("slug, title")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(20),
  ]);

  const lines: string[] = [];
  lines.push(`# ${SITE.name}`);
  lines.push("");
  lines.push(`> ${SITE.description}`);
  lines.push("");
  lines.push(
    `${SITE.name} is a UK baby brand selling premium baby products and gifts — ` +
      `muslins, baby changing mats and bags, and the Snuggy Bunny comforter. ` +
      `Designed for new and expecting parents and for baby shower gifting.`,
  );
  lines.push("");

  lines.push("## Shop");
  lines.push(`- [Home](${base}/): Browse all collections`);
  lines.push(
    `- [Baby Shower Gifting](${base}/baby-shower-gifting): Build a bundle and save 10%`,
  );
  for (const c of collections ?? []) {
    if (!c.slug) continue;
    const desc = c.description ? `: ${c.description}` : "";
    lines.push(`- [${c.title}](${base}/collections/${c.slug})${desc}`);
  }
  lines.push("");

  if ((posts ?? []).length > 0) {
    lines.push("## Journal");
    for (const p of posts ?? []) {
      if (!p.slug) continue;
      lines.push(`- [${p.title}](${base}/blog/${p.slug})`);
    }
    lines.push("");
  }

  lines.push("## About");
  lines.push(`- [Our Story](${base}/our-story): Meet the founder of ${SITE.name}`);
  lines.push(`- [Contact](${base}/contact): ${SITE.email}`);
  lines.push(`- Instagram: ${SITE.social[0]}`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
