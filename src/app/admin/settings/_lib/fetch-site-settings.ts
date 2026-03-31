import { getSupabase } from "@/lib/supabase/client";

export type NavLink = {
  _key: string;
  label?: string;
  href?: string;
};

export type SiteSettingsDoc = {
  _id: string;
  announcementBar?: string | null;
  freeDeliveryThreshold?: number | null;
  nav?: NavLink[] | null;
};

export async function fetchSiteSettings(): Promise<SiteSettingsDoc | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("site_settings")
    .select("id, announcement_bar, free_delivery_threshold, nav")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    id: string;
    announcement_bar: string | null;
    free_delivery_threshold: number | null;
    nav: unknown;
  };
  const nav = Array.isArray(row.nav)
    ? (row.nav as NavLink[])
    : [];
  return {
    _id: row.id,
    announcementBar: row.announcement_bar,
    freeDeliveryThreshold: row.free_delivery_threshold,
    nav,
  };
}
