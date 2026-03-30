"use client";

import type { VercelWebsiteAnalyticsOk } from "@/app/admin/analytics/_lib/vercel-website-analytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = Omit<VercelWebsiteAnalyticsOk, "kind"> & { days: number };

const COLORS = {
  sage: "#8BA888",
  taupe: "#C4A882",
  dark: "#1C1C1C",
};

function formatDayLabel(isoDay: string) {
  const [y, m, d] = isoDay.split("-");
  if (!d || !m) return isoDay;
  return `${d}/${m}`;
}

export function WebsiteAnalyticsCharts(props: Props) {
  const {
    days,
    projectName,
    webAnalyticsEnabled,
    webAnalyticsHasData,
    totals,
    dailyVisitors,
    topPages,
    referrers,
    devicesPct,
    metricsFromApi,
  } = props;

  const lineData = dailyVisitors;

  const barData = topPages.map((row) => ({
    ...row,
    label: row.path.length > 28 ? `${row.path.slice(0, 26)}…` : row.path,
  }));

  const deviceSum =
    devicesPct.desktop + devicesPct.mobile + devicesPct.tablet;
  const pieData = [
    { name: "Desktop", value: devicesPct.desktop, key: "desktop" as const },
    { name: "Mobile", value: devicesPct.mobile, key: "mobile" as const },
    { name: "Tablet", value: devicesPct.tablet, key: "tablet" as const },
  ].filter((d) => d.value > 0);

  const pieColors = [COLORS.sage, COLORS.taupe, COLORS.dark];

  return (
    <div className="space-y-8">
      {!metricsFromApi && (
        <p className="rounded-lg border border-brand-secondary/40 bg-brand-bg px-4 py-3 text-sm text-brand-text/80">
          Connected to Vercel project{" "}
          <span className="font-medium text-brand-text">{projectName}</span>.
          The Vercel REST API did not return Web Analytics aggregates for this
          range (response empty or endpoint unavailable). Charts may show zero
          until the API exposes metrics.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-brand-text/60">
        <span
          className={`rounded-full px-2 py-0.5 ${
            webAnalyticsEnabled
              ? "bg-brand-primary/15 text-brand-text"
              : "bg-brand-text/10 text-brand-text/70"
          }`}
        >
          Web Analytics {webAnalyticsEnabled ? "on project" : "not detected"}
        </span>
        {webAnalyticsHasData === true && (
          <span className="rounded-full bg-brand-bg px-2 py-0.5 text-brand-text/70">
            Dashboard reports data
          </span>
        )}
        {webAnalyticsHasData === false && (
          <span className="rounded-full bg-brand-bg px-2 py-0.5 text-brand-text/70">
            No Web Analytics data yet
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-brand-text/10 bg-brand-bg/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
            Page views ({days}d)
          </p>
          <p className="mt-1 font-heading text-2xl text-brand-text">
            {totals.pageViews.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-brand-text/10 bg-brand-bg/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
            Unique visitors ({days}d)
          </p>
          <p className="mt-1 font-heading text-2xl text-brand-text">
            {totals.uniqueVisitors.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div>
          <h3 className="font-heading text-lg text-brand-text">
            Traffic over time
          </h3>
          <p className="mt-1 text-sm text-brand-text/65">
            Daily visitors (Europe/London calendar days).
          </p>
          <div className="mt-4 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-brand-text/10"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#1C1C1C99" }}
                  tickFormatter={formatDayLabel}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#1C1C1C99" }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === "number" ? value : Number(value ?? 0),
                    "Visitors",
                  ]}
                  labelFormatter={(label) => `Date ${label}`}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid rgba(28,28,28,0.12)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke={COLORS.sage}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.sage }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="font-heading text-lg text-brand-text">Top pages</h3>
          <p className="mt-1 text-sm text-brand-text/65">By page views.</p>
          {barData.length === 0 ? (
            <p className="mt-6 text-sm text-brand-text/60">No page data.</p>
          ) : (
            <div className="mt-4 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-brand-text/10"
                  />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={132}
                    tick={{ fontSize: 10, fill: "#1C1C1C99" }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      typeof value === "number" ? value : Number(value ?? 0),
                      "Views",
                    ]}
                    labelFormatter={(_, payload) =>
                      (payload?.[0]?.payload as { path?: string })?.path ?? ""
                    }
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid rgba(28,28,28,0.12)",
                    }}
                  />
                  <Bar
                    dataKey="views"
                    fill={COLORS.sage}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-heading text-lg text-brand-text">
            Top referrers
          </h3>
          <p className="mt-1 text-sm text-brand-text/65">
            Share of traffic by source (when provided by the API).
          </p>
          {referrers.length === 0 ? (
            <p className="mt-4 text-sm text-brand-text/60">
              No referrer breakdown available.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {referrers.map((r, i) => (
                <li
                  key={`${r.label}-${i}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-brand-text/10 bg-brand-bg/60 px-3 py-2 text-sm"
                >
                  <span className="text-brand-text">{r.label}</span>
                  <span className="tabular-nums text-brand-text/80">
                    {r.percent.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-heading text-lg text-brand-text">Devices</h3>
          <p className="mt-1 text-sm text-brand-text/65">
            Desktop, mobile, and tablet (percent of sessions when available).
          </p>
          {deviceSum <= 0 ? (
            <p className="mt-4 text-sm text-brand-text/60">
              No device breakdown available.
            </p>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.key}
                          fill={pieColors[i % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => {
                        const v = value as number | string | undefined;
                        if (v === undefined) return "—";
                        return `${
                          typeof v === "number" ? v.toFixed(1) : String(v)
                        }%`;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-full flex-col gap-2 text-sm sm:max-w-xs">
                <div className="flex justify-between gap-4 rounded-lg border border-brand-text/10 bg-brand-bg/60 px-3 py-2">
                  <span className="text-brand-text">Desktop</span>
                  <span className="tabular-nums text-brand-text/80">
                    {devicesPct.desktop.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4 rounded-lg border border-brand-text/10 bg-brand-bg/60 px-3 py-2">
                  <span className="text-brand-text">Mobile</span>
                  <span className="tabular-nums text-brand-text/80">
                    {devicesPct.mobile.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4 rounded-lg border border-brand-text/10 bg-brand-bg/60 px-3 py-2">
                  <span className="text-brand-text">Tablet</span>
                  <span className="tabular-nums text-brand-text/80">
                    {devicesPct.tablet.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
