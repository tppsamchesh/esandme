"use server";

import type { NavLink } from "@/app/admin/settings/_lib/fetch-site-settings";
import { getSupabase } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

async function getSiteSettingsRowId(
  provided: string | null,
): Promise<string | null> {
  if (provided) return provided;
  const supabase = getSupabase();
  const { data } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function saveSiteFields(input: {
  documentId: string | null;
  announcementBar: string;
  freeDeliveryThresholdPence: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  const threshold = Math.max(0, Math.round(input.freeDeliveryThresholdPence));
  const announcementBar = input.announcementBar.trim();

  try {
    const id = await getSiteSettingsRowId(input.documentId);
    if (!id) {
      return {
        ok: false,
        error:
          "No site_settings row found. Create one row in Supabase (site_settings) first.",
      };
    }
    const { error } = await supabase
      .from("site_settings")
      .update({
        announcement_bar: announcementBar || null,
        free_delivery_threshold: threshold,
      })
      .eq("id", id);
    if (error) throw error;
    revalidatePublic();
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export async function saveNavLinks(input: {
  documentId: string | null;
  nav: NavLink[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  const navPayload = input.nav.map((item) => ({
    _key: item._key,
    label: item.label?.trim() ?? "",
    href: item.href?.trim() ?? "/",
  }));

  try {
    const id = await getSiteSettingsRowId(input.documentId);
    if (!id) {
      return {
        ok: false,
        error:
          "No site_settings row found. Create one row in Supabase (site_settings) first.",
      };
    }
    const { error } = await supabase
      .from("site_settings")
      .update({ nav: navPayload })
      .eq("id", id);
    if (error) throw error;
    revalidatePublic();
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.set("esandme_admin", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/admin/login");
}
