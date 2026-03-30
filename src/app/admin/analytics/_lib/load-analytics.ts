import { fetchGa4Analytics } from "./ga4";
import { fetchPopularLineItems } from "./stripe-popular";
import { fetchDailyRevenueGbp } from "./stripe-revenue";
import { fetchOrdersAnalytics } from "./supabase-orders";

export async function loadAnalyticsData(days: number) {
  const d = days === 7 || days === 30 || days === 90 ? days : 30;
  const [stripe, orderBlock, ga4] = await Promise.all([
    fetchDailyRevenueGbp(d),
    fetchOrdersAnalytics(d),
    fetchGa4Analytics(d),
  ]);

  const popular = await fetchPopularLineItems(orderBlock.sessionIds);

  return {
    days: d,
    stripe,
    orders: orderBlock,
    popular,
    ga4,
  };
}

export type AnalyticsBundle = Awaited<ReturnType<typeof loadAnalyticsData>>;
