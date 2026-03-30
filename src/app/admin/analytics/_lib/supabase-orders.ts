import { getSupabase } from "@/lib/supabase/client";
import { getPeriodStartEnd } from "./dates";

export type OrderRowLite = {
  amount_total: number | null;
  created_at: string;
  stripe_session_id: string | null;
};

export async function fetchOrdersAnalytics(days: number): Promise<{
  ordersInPeriod: number;
  revenueInPeriodPence: number;
  ordersAllTime: number;
  ordersThisMonth: number;
  aovAllTimePence: number | null;
  aovPeriodPence: number | null;
  sessionIds: string[];
}> {
  const supabase = getSupabase();
  const { start, end } = getPeriodStartEnd(days);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartIso = monthStart.toISOString();

  const { data: allRows, error: allErr } = await supabase
    .from("orders")
    .select("amount_total, created_at, stripe_session_id");

  if (allErr || !allRows) {
    console.error("fetchOrdersAnalytics", allErr?.message);
    return {
      ordersInPeriod: 0,
      revenueInPeriodPence: 0,
      ordersAllTime: 0,
      ordersThisMonth: 0,
      aovAllTimePence: null,
      aovPeriodPence: null,
      sessionIds: [],
    };
  }

  const rows = allRows as OrderRowLite[];

  let ordersAllTime = 0;
  let sumAll = 0;
  let ordersThisMonth = 0;
  let ordersInPeriod = 0;
  let revenueInPeriodPence = 0;

  for (const r of rows) {
    ordersAllTime += 1;
    if (r.amount_total != null) sumAll += r.amount_total;

    const created = new Date(r.created_at);
    if (!Number.isNaN(created.getTime()) && created >= monthStart) {
      ordersThisMonth += 1;
    }

    if (
      !Number.isNaN(created.getTime()) &&
      created >= start &&
      created <= end
    ) {
      ordersInPeriod += 1;
      if (r.amount_total != null) revenueInPeriodPence += r.amount_total;
    }
  }

  const aovAllTimePence =
    ordersAllTime > 0 ? Math.round(sumAll / ordersAllTime) : null;
  const aovPeriodPence =
    ordersInPeriod > 0
      ? Math.round(revenueInPeriodPence / ordersInPeriod)
      : null;

  const sessionIds = [
    ...new Set(
      rows
        .map((r) => r.stripe_session_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  return {
    ordersInPeriod,
    revenueInPeriodPence,
    ordersAllTime,
    ordersThisMonth,
    aovAllTimePence,
    aovPeriodPence,
    sessionIds,
  };
}
