"use server";

import type { NavLink } from "@/app/admin/settings/_lib/fetch-site-settings";
import { client } from "@/lib/sanity/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

async function resolveSiteSettingsId(
  provided: string | null
): Promise<string | null> {
  if (provided) return provided;
  return client.fetch<string | null>(`*[_type == "siteSettings"][0]._id`);
}

export async function saveSiteFields(input: {
  documentId: string | null;
  announcementBar: string;
  freeDeliveryThresholdPence: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.SANITY_API_TOKEN) {
    return { ok: false, error: "SANITY_API_TOKEN is not configured." };
  }

  const threshold = Math.max(0, Math.round(input.freeDeliveryThresholdPence));
  const announcementBar = input.announcementBar.trim();

  try {
    const id = await resolveSiteSettingsId(input.documentId);
    if (id) {
      await client
        .patch(id)
        .set({
          announcementBar: announcementBar || undefined,
          freeDeliveryThreshold: threshold,
        })
        .commit();
    } else {
      await client.create({
        _type: "siteSettings",
        announcementBar: announcementBar || undefined,
        freeDeliveryThreshold: threshold,
        nav: [],
      });
    }
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
  if (!process.env.SANITY_API_TOKEN) {
    return { ok: false, error: "SANITY_API_TOKEN is not configured." };
  }

  const navPayload = input.nav.map((item) => ({
    _key: item._key,
    label: item.label?.trim() ?? "",
    href: item.href?.trim() ?? "/",
  }));

  try {
    const id = await resolveSiteSettingsId(input.documentId);
    if (id) {
      await client.patch(id).set({ nav: navPayload }).commit();
    } else {
      await client.create({
        _type: "siteSettings",
        freeDeliveryThreshold: 0,
        nav: navPayload,
      });
    }
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
