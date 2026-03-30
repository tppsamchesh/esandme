import { SourcesBarChart } from "@/app/admin/analytics/_components/SourcesBarChart";
import type { Ga4Result } from "@/app/admin/analytics/_lib/ga4";

export function Ga4Panel({ ga4 }: { ga4: Ga4Result }) {
  if (ga4.status === "missing_env") {
    return (
      <section className="rounded-xl border border-brand-secondary/40 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-xl text-brand-text">
          Google Analytics (GA4)
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-text/85">
          <p>
            Connect GA4 by adding two environment variables (e.g. in{" "}
            <code className="rounded bg-brand-bg px-1 text-xs">.env.local</code>{" "}
            or Vercel):
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <code className="rounded bg-brand-bg px-1 text-xs">
                GA4_PROPERTY_ID
              </code>{" "}
              — numeric property ID from{" "}
              <strong>GA4 → Admin → Property settings</strong>.
            </li>
            <li>
              <code className="rounded bg-brand-bg px-1 text-xs">
                GA4_SERVICE_ACCOUNT_KEY
              </code>{" "}
              — JSON key for a Google Cloud service account that has{" "}
              <strong>Viewer</strong> access to this GA4 property. Enable the{" "}
              <strong>Google Analytics Data API</strong> for the GCP project and
              add the service account email under{" "}
              <strong>GA4 → Admin → Property access management</strong>.
            </li>
          </ul>
          <p className="text-brand-text/70">
            Store the JSON key as a <strong>single-line string</strong> in the
            env var (escape newlines or use your host’s JSON secret type).
          </p>
        </div>
      </section>
    );
  }

  if (ga4.status === "invalid_key") {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-6">
        <h2 className="font-heading text-xl text-brand-text">GA4</h2>
        <p className="mt-2 text-sm text-amber-950">
          <code>GA4_SERVICE_ACCOUNT_KEY</code> is not valid JSON. Paste the full
          service account key object.
        </p>
      </section>
    );
  }

  if (ga4.status === "error") {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50/80 p-6">
        <h2 className="font-heading text-xl text-brand-text">GA4</h2>
        <p className="mt-2 text-sm text-red-900">{ga4.message}</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="font-heading text-xl text-brand-text">
          Traffic sources
        </h2>
        <p className="mt-1 text-sm text-brand-text/65">
          Sessions by source for the selected date range.
        </p>
        {ga4.sources.length === 0 ? (
          <p className="mt-4 text-sm text-brand-text/60">No source data.</p>
        ) : (
          <div className="mt-4 rounded-lg border border-brand-text/10 bg-white p-4">
            <SourcesBarChart data={ga4.sources} />
          </div>
        )}
      </div>

      <div>
        <h2 className="font-heading text-xl text-brand-text">
          Top pages by views
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-brand-text/10 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-text/10 bg-brand-bg">
              <tr>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Page path
                </th>
                <th className="px-4 py-3 font-medium text-brand-text">Views</th>
              </tr>
            </thead>
            <tbody>
              {ga4.pages.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-brand-text/60"
                  >
                    No page data.
                  </td>
                </tr>
              ) : (
                ga4.pages.map((row) => (
                  <tr
                    key={row.path}
                    className="border-b border-brand-text/5 last:border-0"
                  >
                    <td className="max-w-md truncate px-4 py-2 font-mono text-xs text-brand-text">
                      {row.path}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-brand-text">
                      {row.views}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
