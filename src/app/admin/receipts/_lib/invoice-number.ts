export function invoiceNumberFromSession(
  stripeSessionId: string | null | undefined
): string {
  if (!stripeSessionId || stripeSessionId.length < 8) return "—";
  return `INV-${stripeSessionId.slice(-8)}`;
}
