import { Ga4Panel } from "@/app/admin/analytics/_components/Ga4Panel";
import { RevenueLineChart } from "@/app/admin/analytics/_components/RevenueLineChart";
import { WebsiteAnalyticsSection } from "@/app/admin/analytics/_components/WebsiteAnalyticsSection";
import { loadAnalyticsData } from "@/app/admin/analytics/_lib/load-analytics";
import { formatGbp } from "@/lib/admin/format";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
};

function parseDays(v: string | undefined): number {
  if (v === "7" || v === "30" || v === "90") return Number(v);
  return 30;
}

function rangeLinkClass(active: boolean) {
  return `rounded-md px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-brand-primary text-white shadow-sm"
      : "border border-brand-text/15 bg-white text-brand-text hover:bg-brand-bg"
  }`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = parseDays(sp?.days);
  const data = await loadAnalyticsData(days);

  const sessionsDisplay =
    data.ga4.status === "ok" ? data.ga4.sessions : null;

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-brand-text">Analytics</h1>
          <p className="mt-1 text-sm text-brand-text/70">
            Revenue from Stripe, orders from Supabase, traffic from GA4 and
            Vercel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/analytics?days=7"
            className={rangeLinkClass(days === 7)}
          >
            Last 7 days
          </Link>
          <Link
            href="/admin/analytics?days=30"
            className={rangeLinkClass(days === 30)}
          >
            Last 30 days
          </Link>
          <Link
            href="/admin/analytics?days=90"
            className={rangeLinkClass(days === 90)}
          >
            Last 90 days
          </Link>
        </div>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Revenue (${days}d)`}
          value={formatGbp(data.stripe.totalPence)}
          hint="Stripe GBP charges"
        />
        <StatCard
          label={`Orders (${days}d)`}
          value={String(data.orders.ordersInPeriod)}
          hint="Supabase"
        />
        <StatCard
          label={`Avg order value (${days}d)`}
          value={
            data.orders.aovPeriodPence != null
              ? formatGbp(data.orders.aovPeriodPence)
              : "—"
          }
          hint="Supabase in period"
        />
        <StatCard
          label={`Sessions (${days}d)`}
          value={
            sessionsDisplay != null ? String(sessionsDisplay) : "—"
          }
          hint="GA4"
          muted={sessionsDisplay == null}
        />
      </section>

      <section className="mt-10 rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
        <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium text-amber-950">
            Connect Google Analytics to see website traffic data. Add{" "}
            <span className="font-mono text-[0.9em]">GA4_PROPERTY_ID</span> and{" "}
            <span className="font-mono text-[0.9em]">
              GA4_SERVICE_ACCOUNT_KEY
            </span>{" "}
            to your environment variables.
          </p>
        </div>

        <h2 className="mt-8 font-heading text-xl text-brand-text">
          Website Analytics
        </h2>
        <p className="mt-1 text-sm text-brand-text/65">
          Traffic and engagement for the selected period ({days} days).
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WebsitePlaceholderStatCard label="Page Views" />
          <WebsitePlaceholderStatCard label="Unique Visitors" />
          <WebsitePlaceholderStatCard label="Bounce Rate" />
          <WebsitePlaceholderStatCard label="Avg Session Duration" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-heading text-lg text-brand-text">Top Pages</h3>
            <p className="mt-1 text-sm text-brand-text/55">
              Most viewed paths (placeholder)
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-brand-text/10">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-brand-text/10 bg-brand-bg">
                  <tr>
                    <th className="px-4 py-3 font-medium text-brand-text">
                      Path
                    </th>
                    <th className="px-4 py-3 font-medium text-brand-text">
                      Views
                    </th>
                  </tr>
                </thead>
                <tbody className="text-brand-text/75">
                  {[
                    ["/", "--"],
                    ["/shop", "--"],
                    ["/about", "--"],
                    ["/contact", "--"],
                  ].map(([path, views]) => (
                    <tr
                      key={path}
                      className="border-b border-brand-text/5 last:border-0"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{path}</td>
                      <td className="px-4 py-2 tabular-nums">{views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-lg text-brand-text">
              Top Referrers
            </h3>
            <p className="mt-1 text-sm text-brand-text/55">
              Traffic sources (placeholder)
            </p>
            <ol className="mt-4 divide-y divide-brand-text/10 rounded-lg border border-brand-text/10 bg-brand-bg/40">
              {[
                "google / organic",
                "Direct / none",
                "social network",
                "Newsletter",
              ].map((label, i) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-brand-text/80"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-text/10 text-xs font-medium text-brand-text/70">
                      {i + 1}
                    </span>
                    {label}
                  </span>
                  <span className="tabular-nums text-brand-text/45">--</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-xl text-brand-text">
          Daily revenue (£)
        </h2>
        <p className="mt-1 text-2xl font-medium text-brand-text">
          {formatGbp(data.stripe.totalPence)}{" "}
          <span className="text-base font-normal text-brand-text/60">
            total in period
          </span>
        </p>
        <div className="mt-6">
          <RevenueLineChart data={data.stripe.byDay} />
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-xl text-brand-text">Order insights</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
              Total orders (all time)
            </p>
            <p className="mt-1 font-heading text-2xl text-brand-text">
              {data.orders.ordersAllTime}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
              Orders this month
            </p>
            <p className="mt-1 font-heading text-2xl text-brand-text">
              {data.orders.ordersThisMonth}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
              Avg order value (all time)
            </p>
            <p className="mt-1 font-heading text-2xl text-brand-text">
              {data.orders.aovAllTimePence != null
                ? formatGbp(data.orders.aovAllTimePence)
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-heading text-lg text-brand-text">
            Top products by quantity sold
          </h3>
          <p className="mt-1 text-sm text-brand-text/65">
            From Stripe Checkout line items linked to your Supabase orders (up
            to 400 recent checkouts).
          </p>
          {data.popular.length === 0 ? (
            <p className="mt-4 text-sm text-brand-text/60">
              No line-item data yet — complete a checkout to see products here.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-brand-text/10">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-brand-text/10 bg-brand-bg">
                  <tr>
                    <th className="px-4 py-3 font-medium text-brand-text">
                      Product
                    </th>
                    <th className="px-4 py-3 font-medium text-brand-text">
                      Qty sold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.popular.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-brand-text/5 last:border-0"
                    >
                      <td className="px-4 py-2 text-brand-text">{row.name}</td>
                      <td className="px-4 py-2 tabular-nums text-brand-text">
                        {row.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <div className="mt-10">
        <Ga4Panel ga4={data.ga4} />
      </div>
    </div>
  );
}

function WebsitePlaceholderStatCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-brand-text/10 bg-brand-bg/50 px-4 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl text-brand-text/50">--</p>
      <p className="mt-1 text-xs text-brand-text/40">
        Connect analytics to see data
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  muted,
}: {
  label: string;
  value: string;
  hint: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-4 shadow-sm ${
        muted
          ? "border-brand-text/10 bg-brand-bg/80"
          : "border-brand-text/10 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl text-brand-text">{value}</p>
      <p className="mt-1 text-xs text-brand-text/50">{hint}</p>
    </div>
  );
}
