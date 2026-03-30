import { getStripe } from "@/lib/stripe";
import { enumerateDaysInPeriod, getPeriodStartEnd, ukDayKeyFromUnix } from "./dates";

export type DailyRevenue = { date: string; revenuePence: number };

export async function fetchDailyRevenueGbp(
  days: number
): Promise<{ byDay: DailyRevenue[]; totalPence: number }> {
  const { startUnix, endUnix } = getPeriodStartEnd(days);
  const stripe = getStripe();
  const byDayMap = new Map<string, number>();
  for (const d of enumerateDaysInPeriod(days)) {
    byDayMap.set(d, 0);
  }

  let startingAfter: string | undefined;
  let totalPence = 0;

  for (;;) {
    const page = await stripe.charges.list({
      created: { gte: startUnix, lte: endUnix },
      limit: 100,
      starting_after: startingAfter,
    });

    for (const ch of page.data) {
      if (!ch.paid || ch.currency !== "gbp") continue;
      const key = ukDayKeyFromUnix(ch.created);
      if (!byDayMap.has(key)) byDayMap.set(key, 0);
      const prev = byDayMap.get(key) ?? 0;
      byDayMap.set(key, prev + ch.amount);
      totalPence += ch.amount;
    }

    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]!.id;
  }

  const byDay = [...byDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenuePence]) => ({ date, revenuePence }));

  return { byDay, totalPence };
}
