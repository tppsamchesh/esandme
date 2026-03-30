import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase/client";

export type OrderRecord = {
  id: string;
  created_at: string;
  stripe_session_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  amount_total: number | null;
  currency: string | null;
  status: string | null;
  shipping_address: unknown;
  /** If present in Supabase, used for item count without calling Stripe */
  line_items?: unknown;
};

async function listLineItemsCount(sessionId: string): Promise<number | null> {
  try {
    const stripe = getStripe();
    let count = 0;
    let startingAfter: string | undefined;
    for (;;) {
      const page = await stripe.checkout.sessions.listLineItems(sessionId, {
        limit: 100,
        starting_after: startingAfter,
      });
      count += page.data.length;
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]!.id;
    }
    return count;
  } catch {
    return null;
  }
}

export async function fetchAllOrdersForAdmin(): Promise<
  Array<
    OrderRecord & {
      line_item_count: number | null;
    }
  >
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("fetchAllOrdersForAdmin", error?.message);
    return [];
  }

  const rows = data as OrderRecord[];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      if (Array.isArray(row.line_items)) {
        return { ...row, line_item_count: row.line_items.length };
      }
      if (!row.stripe_session_id) {
        return { ...row, line_item_count: null as number | null };
      }
      const line_item_count = await listLineItemsCount(row.stripe_session_id);
      return { ...row, line_item_count };
    })
  );

  return enriched;
}

export async function fetchOrderById(
  id: string
): Promise<OrderRecord | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("fetchOrderById", error.message);
    return null;
  }
  return (data as OrderRecord) ?? null;
}

export type StripeLineItemRow = {
  description: string;
  quantity: number;
  amount_total: number;
  currency: string;
};

export async function fetchCheckoutLineItemsDetail(
  sessionId: string
): Promise<StripeLineItemRow[]> {
  try {
    const stripe = getStripe();
    const out: StripeLineItemRow[] = [];
    let startingAfter: string | undefined;
    for (;;) {
      const page = await stripe.checkout.sessions.listLineItems(sessionId, {
        limit: 100,
        starting_after: startingAfter,
      });
      for (const li of page.data) {
        const quantity = li.quantity ?? 0;
        out.push({
          description: li.description?.trim() || "Item",
          quantity,
          amount_total: li.amount_total ?? 0,
          currency: li.currency ?? "gbp",
        });
      }
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]!.id;
    }
    return out;
  } catch (e) {
    console.error("fetchCheckoutLineItemsDetail", e);
    return [];
  }
}
