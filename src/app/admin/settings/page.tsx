import { ChangePasswordSection } from "@/app/admin/settings/_components/ChangePasswordSection";
import { DangerZone } from "@/app/admin/settings/_components/DangerZone";
import {
  IntegrationsSection,
  type IntegrationKey,
} from "@/app/admin/settings/_components/IntegrationsSection";
import { NavLinksEditor } from "@/app/admin/settings/_components/NavLinksEditor";
import { SiteSettingsSection } from "@/app/admin/settings/_components/SiteSettingsSection";
import { fetchSiteSettings } from "@/app/admin/settings/_lib/fetch-site-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

function integrationStatus(): Record<IntegrationKey, boolean> {
  return {
    sanity: Boolean(process.env.SANITY_API_TOKEN?.trim()),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    shipstation: Boolean(process.env.SHIPSTATION_API_KEY?.trim()),
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    ga4: Boolean(process.env.GA4_PROPERTY_ID?.trim()),
  };
}

export default async function AdminSettingsPage() {
  const settings = await fetchSiteSettings();
  const integrations = integrationStatus();

  const announcement = settings?.announcementBar ?? "";
  const thresholdPence = settings?.freeDeliveryThreshold ?? 0;
  const nav = settings?.nav ?? [];
  const documentId = settings?._id ?? null;

  return (
    <div className="space-y-10 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-3xl text-brand-text">Settings</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Site content in Sanity, integrations, and admin security.
        </p>
      </div>

      <SiteSettingsSection
        documentId={documentId}
        initialAnnouncement={announcement}
        initialThresholdPence={thresholdPence}
      />

      <NavLinksEditor documentId={documentId} initialNav={nav} />

      <ChangePasswordSection />

      <IntegrationsSection status={integrations} />

      <DangerZone />
    </div>
  );
}
