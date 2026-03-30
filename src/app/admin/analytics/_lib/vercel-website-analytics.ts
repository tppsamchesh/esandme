import {
  enumerateDaysInPeriod,
  getPeriodStartEnd,
  ukDayKeyFromUnix,
} from "./dates";

/** Same pattern as `src/app/api/admin/change-password/route.ts` for team-scoped projects. */
function teamQuery(): string {
  const tid = process.env.VERCEL_TEAM_ID?.trim();
  return tid ? `?teamId=${encodeURIComponent(tid)}` : "";
}

function teamIdAmpersand(): string {
  const tid = process.env.VERCEL_TEAM_ID?.trim();
  return tid ? `&teamId=${encodeURIComponent(tid)}` : "";
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export type VercelWebsiteAnalyticsResult =
  | { kind: "not_configured" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      projectName: string;
      webAnalyticsEnabled: boolean;
      webAnalyticsHasData: boolean | null;
      totals: { pageViews: number; uniqueVisitors: number };
      dailyVisitors: { date: string; visitors: number }[];
      topPages: { path: string; views: number }[];
      referrers: { label: string; percent: number }[];
      devicesPct: { desktop: number; mobile: number; tablet: number };
      metricsFromApi: boolean;
    };

export type VercelWebsiteAnalyticsOk = Extract<
  VercelWebsiteAnalyticsResult,
  { kind: "ok" }
>;

type ParsedMetrics = {
  pageViews: number;
  uniqueVisitors: number;
  dailyVisitors: Map<string, number>;
  topPages: { path: string; views: number }[];
  referrers: { label: string; percent: number }[];
  devicesPct: { desktop: number; mobile: number; tablet: number };
};

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
    return Number(v);
  return 0;
}

function pickTotals(obj: Record<string, unknown>): {
  pageViews: number;
  uniqueVisitors: number;
} {
  const pv =
    num(obj.pageViews) ||
    num(obj.pageviews) ||
    num(obj.totalPageViews) ||
    num(obj.views) ||
    num((obj.totals as Record<string, unknown> | undefined)?.pageViews) ||
    num((obj.summary as Record<string, unknown> | undefined)?.pageViews);
  const uv =
    num(obj.uniqueVisitors) ||
    num(obj.visitors) ||
    num(obj.unique_visitors) ||
    num((obj.totals as Record<string, unknown> | undefined)?.uniqueVisitors) ||
    num((obj.summary as Record<string, unknown> | undefined)?.visitors);
  return { pageViews: pv, uniqueVisitors: uv };
}

function normalizeReferrers(
  rows: unknown
): { label: string; percent: number }[] {
  if (!Array.isArray(rows)) return [];
  const out: { label: string; percent: number }[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const labelRaw =
      (typeof o.name === "string" && o.name) ||
      (typeof o.source === "string" && o.source) ||
      (typeof o.referrer === "string" && o.referrer) ||
      (typeof o.domain === "string" && o.domain) ||
      "Direct";
    const pct =
      num(o.percent) ||
      num(o.percentage) ||
      (num(o.count) > 0 && num(o.total) > 0
        ? (num(o.count) / num(o.total)) * 100
        : 0);
    out.push({ label: labelRaw, percent: pct });
  }
  const sumPct = out.reduce((a, b) => a + b.percent, 0);
  if (sumPct > 0 && out.some((x) => x.percent <= 1 && x.percent > 0)) {
    return out.map((x) => ({
      ...x,
      percent: sumPct <= 1.01 ? x.percent * 100 : x.percent,
    }));
  }
  return out;
}

function normalizeTopPages(rows: unknown): { path: string; views: number }[] {
  if (!Array.isArray(rows)) return [];
  const out: { path: string; views: number }[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const path =
      (typeof o.path === "string" && o.path) ||
      (typeof o.pathname === "string" && o.pathname) ||
      (typeof o.page === "string" && o.page) ||
      "/";
    const views =
      num(o.views) || num(o.pageViews) || num(o.count) || num(o.hits);
    out.push({ path, views });
  }
  return out.sort((a, b) => b.views - a.views).slice(0, 12);
}

function normalizeDevices(
  raw: unknown
): { desktop: number; mobile: number; tablet: number } {
  const z = { desktop: 0, mobile: 0, tablet: 0 };
  if (!raw || typeof raw !== "object") return z;
  const o = raw as Record<string, unknown>;
  z.desktop =
    num(o.desktop) ||
    num(o.Desktop) ||
    num((o as { d?: unknown }).d);
  z.mobile =
    num(o.mobile) ||
    num(o.Mobile) ||
    num((o as { m?: unknown }).m);
  z.tablet =
    num(o.tablet) ||
    num(o.Tablet) ||
    num((o as { t?: unknown }).t);
  const sum = z.desktop + z.mobile + z.tablet;
  if (sum <= 0) return z;
  return {
    desktop: (z.desktop / sum) * 100,
    mobile: (z.mobile / sum) * 100,
    tablet: (z.tablet / sum) * 100,
  };
}

function parseSeries(
  rows: unknown,
  dayKeys: Set<string>
): Map<string, number> {
  const map = new Map<string, number>();
  if (!Array.isArray(rows)) return map;
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const ts =
      (typeof o.date === "string" && o.date) ||
      (typeof o.day === "string" && o.day) ||
      (typeof o.t === "string" && o.t);
    let key: string | null = null;
    if (ts && /^\d{4}-\d{2}-\d{2}/.test(ts)) {
      key = ts.slice(0, 10);
    } else if (typeof o.timestamp === "number") {
      const ms = o.timestamp > 1e12 ? o.timestamp : o.timestamp * 1000;
      key = ukDayKeyFromUnix(Math.floor(ms / 1000));
    }
    if (!key || !dayKeys.has(key)) continue;
    const visitors =
      num(o.visitors) ||
      num(o.uniqueVisitors) ||
      num(o.users) ||
      num(o.sessions);
    map.set(key, (map.get(key) ?? 0) + visitors);
  }
  return map;
}

function parseFlexibleMetrics(json: unknown, dayKeys: Set<string>): ParsedMetrics | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;

  const candidates: Record<string, unknown>[] = [root];
  const data = root.data;
  const result = root.result;
  const metrics = root.metrics;
  if (data && typeof data === "object") candidates.push(data as Record<string, unknown>);
  if (result && typeof result === "object") candidates.push(result as Record<string, unknown>);
  if (metrics && typeof metrics === "object") candidates.push(metrics as Record<string, unknown>);

  let best: ParsedMetrics | null = null;
  let bestScore = -1;
  for (const obj of candidates) {
    const totals = pickTotals(obj);
    const seriesRaw =
      obj.series ??
      obj.timeseries ??
      obj.daily ??
      obj.byDay ??
      obj.dataPoints ??
      (obj.chart as Record<string, unknown> | undefined)?.series;
    const dailyVisitors = parseSeries(seriesRaw, dayKeys);

    const topPages = normalizeTopPages(
      obj.topPages ?? obj.pages ?? obj.top_paths ?? obj.paths
    );
    const referrers = normalizeReferrers(
      obj.referrers ?? obj.sources ?? obj.topReferrers ?? obj.trafficSources
    );
    const devicesPct = normalizeDevices(
      obj.devices ?? obj.device ?? obj.deviceBreakdown ?? obj.byDevice
    );

    const score =
      totals.pageViews +
      totals.uniqueVisitors +
      dailyVisitors.size +
      topPages.length +
      referrers.length +
      (devicesPct.desktop + devicesPct.mobile + devicesPct.tablet > 0 ? 10 : 0);

    if (score === 0) continue;

    const parsed: ParsedMetrics = {
      pageViews: totals.pageViews,
      uniqueVisitors: totals.uniqueVisitors,
      dailyVisitors,
      topPages,
      referrers,
      devicesPct,
    };
    if (score > bestScore) {
      best = parsed;
      bestScore = score;
    }
  }

  return best;
}

async function tryFetchMetricsJson(
  token: string,
  projectId: string,
  fromMs: number,
  toMs: number,
  webAnalyticsId: string | null
): Promise<unknown | null> {
  const base = `https://api.vercel.com`;
  const q = `?from=${fromMs}&to=${toMs}${teamIdAmpersand()}`;
  const paths = [
    `/v1/web-analytics/projects/${encodeURIComponent(projectId)}/metrics${q}`,
    `/v2/web-analytics/projects/${encodeURIComponent(projectId)}/metrics${q}`,
    `/v1/web-analytics/projects/${encodeURIComponent(projectId)}/stats${q}`,
    `/v10/projects/${encodeURIComponent(projectId)}/web-analytics${q}`,
  ];

  if (webAnalyticsId) {
    paths.push(
      `/v1/web-analytics/${encodeURIComponent(webAnalyticsId)}/metrics${q}`,
      `/v1/web-analytics/${encodeURIComponent(webAnalyticsId)}/stats${q}`
    );
  }

  const headers = authHeaders(token);

  for (const p of paths) {
    const url = `${base}${p}`;
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) continue;
      const j: unknown = await res.json().catch(() => null);
      if (j) return j;
    } catch {
      /* try next */
    }
  }
  return null;
}

function emptyDevices(): { desktop: number; mobile: number; tablet: number } {
  return { desktop: 0, mobile: 0, tablet: 0 };
}

function finalizeReferrerPercents(
  rows: { label: string; percent: number }[]
): { label: string; percent: number }[] {
  if (rows.length === 0) return rows;
  const sum = rows.reduce((a, b) => a + b.percent, 0);
  if (sum <= 0) return rows;
  if (Math.abs(sum - 100) < 2) return rows;
  return rows.map((r) => ({ ...r, percent: (r.percent / sum) * 100 }));
}

export async function fetchVercelWebsiteAnalytics(
  days: number
): Promise<VercelWebsiteAnalyticsResult> {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !projectId) {
    return { kind: "not_configured" };
  }

  const d = days === 7 || days === 30 || days === 90 ? days : 30;
  const { start, end } = getPeriodStartEnd(d);
  const fromMs = start.getTime();
  const toMs = end.getTime();
  const dayList = enumerateDaysInPeriod(d);
  const daySet = new Set(dayList);

  const projectUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}${teamQuery()}`;

  let projectJson: Record<string, unknown>;
  try {
    const res = await fetch(projectUrl, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg =
        (j.error as { message?: string } | undefined)?.message ??
        `Vercel project request failed (${res.status})`;
      return { kind: "error", message: msg };
    }
    projectJson = j;
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "Vercel request failed",
    };
  }

  const projectName =
    typeof projectJson.name === "string" ? projectJson.name : projectId;
  const wa = projectJson.webAnalytics as Record<string, unknown> | undefined;
  const webAnalyticsEnabled = !!(wa && typeof wa === "object");
  const webAnalyticsHasData =
    wa && typeof (wa as { hasData?: boolean }).hasData === "boolean"
      ? (wa as { hasData: boolean }).hasData
      : null;
  const webAnalyticsId =
    wa && typeof (wa as { id?: unknown }).id === "string"
      ? (wa as { id: string }).id
      : null;

  const metricsJson = await tryFetchMetricsJson(
    token,
    projectId,
    fromMs,
    toMs,
    webAnalyticsId
  );
  const parsed = metricsJson
    ? parseFlexibleMetrics(metricsJson, daySet)
    : null;

  const metricsFromApi = !!parsed && (
    (parsed.pageViews + parsed.uniqueVisitors > 0) ||
    parsed.dailyVisitors.size > 0 ||
    parsed.topPages.length > 0 ||
    parsed.referrers.length > 0 ||
    (parsed.devicesPct.desktop + parsed.devicesPct.mobile + parsed.devicesPct.tablet > 0)
  );

  const dailyVisitors: { date: string; visitors: number }[] = dayList.map(
    (date) => ({
      date,
      visitors: parsed?.dailyVisitors.get(date) ?? 0,
    })
  );

  const totals = parsed
    ? {
        pageViews: parsed.pageViews,
        uniqueVisitors: parsed.uniqueVisitors,
      }
    : { pageViews: 0, uniqueVisitors: 0 };

  const topPages = parsed?.topPages ?? [];
  const referrers = finalizeReferrerPercents(parsed?.referrers ?? []);
  const devicesPct = parsed?.devicesPct ?? emptyDevices();

  return {
    kind: "ok",
    projectName,
    webAnalyticsEnabled,
    webAnalyticsHasData,
    totals,
    dailyVisitors,
    topPages,
    referrers,
    devicesPct,
    metricsFromApi,
  };
}
