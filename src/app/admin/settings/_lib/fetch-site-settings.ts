import { client } from "@/lib/sanity/client";
import { groq } from "next-sanity";

const query = groq`
  *[_type == "siteSettings"][0] {
    _id,
    announcementBar,
    freeDeliveryThreshold,
    nav[]{ _key, label, href }
  }
`;

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
  return client.fetch<SiteSettingsDoc | null>(query);
}
