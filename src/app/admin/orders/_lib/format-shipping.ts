export function formatShippingAddress(address: unknown): string {
  if (address == null) return "—";
  if (typeof address === "string") {
    const t = address.trim();
    return t.length ? t : "—";
  }
  if (typeof address !== "object") return "—";
  const a = address as Record<string, unknown>;
  const line1 = a.line1 ?? a.line_1;
  const line2 = a.line2 ?? a.line_2;
  const parts = [
    line1,
    line2,
    a.city,
    a.state,
    a.postal_code,
    a.country,
  ]
    .filter((p) => p != null && String(p).trim() !== "")
    .map((p) => String(p).trim());
  return parts.length ? parts.join(", ") : "—";
}
