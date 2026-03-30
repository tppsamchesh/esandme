import { WebsiteAnalyticsCharts } from "@/app/admin/analytics/_components/WebsiteAnalyticsCharts";
import type { VercelWebsiteAnalyticsResult } from "@/app/admin/analytics/_lib/vercel-website-analytics";

export function WebsiteAnalyticsSection({
  data,
  days,
}: {
  data: VercelWebsiteAnalyticsResult;
  days: number;
}) {
  if (data.kind === "not_configured") {
    return (
      <section className="mt-10 rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-xl text-brand-text">
          Website analytics
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-text/75">
          Add VERCEL_TOKEN and VERCEL_PROJECT_ID to your environment variables
          to see website analytics.
        </p>
      </section>
    );
  }

  if (data.kind === "error") {
    return (
      <section className="mt-10 rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-xl text-brand-text">
          Website analytics
        </h2>
        <p className="mt-3 text-sm text-red-700/90">{data.message}</p>
      </section>
    );
  }

  const { kind, ...rest } = data;
  void kind;

  return (
    <section className="mt-10 rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
      <div className="border-b border-brand-text/10 pb-4">
        <h2 className="font-heading text-xl text-brand-text">
          Website analytics
        </h2>
        <p className="mt-1 text-sm text-brand-text/65">
          Vercel Web Analytics via REST API (project{" "}
          <span className="font-medium text-brand-text">{rest.projectName}</span>
          , last {days} days).
        </p>
      </div>
      <div className="mt-6">
        <WebsiteAnalyticsCharts {...rest} days={days} />
      </div>
    </section>
  );
}
