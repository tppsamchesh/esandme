import { getStripe } from "@/lib/stripe";

export type SessionBreakdown = {
  amountSubtotalPence: number;
  amountShippingPence: number;
  amountTaxPence: number;
  amountTotalPence: number;
};

export async function fetchCheckoutSessionBreakdown(
  sessionId: string
): Promise<SessionBreakdown | null> {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const total = session.amount_total ?? 0;
    const sub = session.amount_subtotal ?? 0;
    const td = session.total_details;
    const shipping = td?.amount_shipping ?? 0;
    const tax = td?.amount_tax ?? 0;
    return {
      amountSubtotalPence: sub,
      amountShippingPence: shipping,
      amountTaxPence: tax,
      amountTotalPence: total,
    };
  } catch (e) {
    console.error("fetchCheckoutSessionBreakdown", e);
    return null;
  }
}
