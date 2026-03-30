import { getStripe } from "@/lib/stripe";

/** Sum of successful GBP charges created today (local calendar day). */
export async function getTodaysRevenuePence(): Promise<number> {
  try {
    const stripe = getStripe();
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const gte = Math.floor(startOfDay.getTime() / 1000);
    const lt = Math.floor(endOfDay.getTime() / 1000);

    let totalPence = 0;
    let startingAfter: string | undefined;

    for (;;) {
      const page = await stripe.charges.list({
        created: { gte, lt },
        limit: 100,
        starting_after: startingAfter,
      });

      for (const charge of page.data) {
        if (charge.paid && charge.currency === "gbp") {
          totalPence += charge.amount;
        }
      }

      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]!.id;
    }

    return totalPence;
  } catch (e) {
    console.error("getTodaysRevenuePence", e);
    return 0;
  }
}
