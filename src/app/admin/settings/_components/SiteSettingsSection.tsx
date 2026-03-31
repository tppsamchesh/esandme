"use client";

import { saveSiteFields } from "@/app/admin/settings/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

function parsePounds(s: string): number {
  const n = parseFloat(s.replace(/£/g, "").trim());
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function SiteSettingsSection({
  documentId,
  initialAnnouncement,
  initialThresholdPence,
}: {
  documentId: string | null;
  initialAnnouncement: string;
  initialThresholdPence: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [thresholdPounds, setThresholdPounds] = useState(
    penceToPounds(initialThresholdPence)
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setAnnouncement(initialAnnouncement);
    setThresholdPounds(penceToPounds(initialThresholdPence));
  }, [initialAnnouncement, initialThresholdPence]);

  function handleSave() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await saveSiteFields({
        documentId,
        announcementBar: announcement,
        freeDeliveryThresholdPence: parsePounds(thresholdPounds),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOk(true);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl text-brand-text">Site settings</h2>
      <p className="mt-1 text-sm text-brand-text/65">
        Stored in Supabase in the <code className="text-xs">site_settings</code>{" "}
        table.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Announcement bar text
          </span>
          <input
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-text/20 px-3 py-2 text-sm"
            placeholder="Visible at the top of the site"
          />
        </label>

        <label className="block max-w-xs">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Free delivery threshold (£)
          </span>
          <input
            value={thresholdPounds}
            onChange={(e) => setThresholdPounds(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-md border border-brand-text/20 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-brand-text/50">
            Saved in pence in Supabase.
          </span>
        </label>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 text-sm text-green-800">Saved.</p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="mt-6 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save site settings"}
      </button>
    </section>
  );
}
