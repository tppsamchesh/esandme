import { BetaAnalyticsDataClient } from "@google-analytics/data";

export type Ga4Result =
  | { status: "missing_env" }
  | { status: "invalid_key" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      sessions: number;
      sources: { source: string; sessions: number }[];
      pages: { path: string; views: number }[];
    };

export async function fetchGa4Analytics(days: number): Promise<Ga4Result> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const raw = process.env.GA4_SERVICE_ACCOUNT_KEY?.trim();
  if (!propertyId || !raw) {
    return { status: "missing_env" };
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { status: "invalid_key" };
  }

  try {
    const client = new BetaAnalyticsDataClient({ credentials });
    const property = `properties/${propertyId}`;

    const dateRanges = [
      {
        startDate: `${days}daysAgo`,
        endDate: "today",
      },
    ];

    const [sessionsResp] = await client.runReport({
      property,
      dateRanges,
      metrics: [{ name: "sessions" }],
    });
    const sessions = Number(
      sessionsResp.rows?.[0]?.metricValues?.[0]?.value ?? 0
    );

    const [sourcesResp] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });
    const sources =
      sourcesResp.rows?.map((row) => ({
        source: row.dimensionValues?.[0]?.value ?? "(not set)",
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
      })) ?? [];

    const [pagesResp] = await client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    });
    const pages =
      pagesResp.rows?.map((row) => ({
        path: row.dimensionValues?.[0]?.value ?? "/",
        views: Number(row.metricValues?.[0]?.value ?? 0),
      })) ?? [];

    return { status: "ok", sessions, sources, pages };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { status: "error", message };
  }
}
