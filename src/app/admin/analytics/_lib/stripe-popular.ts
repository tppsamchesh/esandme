import { getStripe } from "@/lib/stripe";

const MAX_SESSIONS = 400;

export async function fetchPopularLineItems(
  stripeSessionIds: string[],
  maxSessions = MAX_SESSIONS
): Promise<{ name: string; quantity: number }[]> {
  const ids = stripeSessionIds.slice(0, maxSessions);
  const stripe = getStripe();
  const counts = new Map<string, number>();

  const chunk = 8;
  for (let i = 0; i < ids.length; i += chunk) {
    const batch = ids.slice(i, i + chunk);
    await Promise.all(
      batch.map(async (sessionId) => {
        try {
          let startingAfter: string | undefined;
          for (;;) {
            const page = await stripe.checkout.sessions.listLineItems(
              sessionId,
              { limit: 100, starting_after: startingAfter }
            );
            for (const li of page.data) {
              const name = li.description?.trim() || "Item";
              const qty = li.quantity ?? 0;
              counts.set(name, (counts.get(name) ?? 0) + qty);
            }
            if (!page.has_more || page.data.length === 0) break;
            startingAfter = page.data[page.data.length - 1]!.id;
          }
        } catch {
          /* skip session */
        }
      })
    );
  }

  return [...counts.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}
