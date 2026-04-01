import { getSupabase } from "@/lib/supabase/client";

export type DraftBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  topic_brief: string | null;
  created_at: string | null;
};

export async function fetchDraftBlogPosts(): Promise<DraftBlogPost[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, topic_brief, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as DraftBlogPost[];
}
