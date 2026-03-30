import { getSupabase } from "@/lib/supabase/client";

export type OrderRow = {
  id?: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  amount_total: number | null;
  currency: string | null;
  status: string | null;
};

function startEndOfTodayISO() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export async function getOrdersTodayCount(): Promise<number> {
  const { startIso, endIso } = startEndOfTodayISO();
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (error) {
    console.error("getOrdersTodayCount", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getRecentOrders(limit = 10): Promise<OrderRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, customer_name, customer_email, amount_total, currency, status"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentOrders", error.message);
    return [];
  }
  return (data ?? []) as OrderRow[];
}
