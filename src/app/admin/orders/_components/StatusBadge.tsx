function normalizeStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toLowerCase();
}

export function OrderStatusBadge({ status }: { status: string | null | undefined }) {
  const s = normalizeStatus(status);
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize";

  if (s === "paid") {
    return (
      <span
        className={`${base} border-green-200 bg-green-100 text-green-800`}
      >
        Paid
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span
        className={`${base} border-amber-200 bg-amber-100 text-amber-800`}
      >
        Pending
      </span>
    );
  }
  if (s === "fulfilled") {
    return (
      <span
        className={`${base} border-brand-primary/40 bg-brand-primary/20 text-brand-primary`}
      >
        Fulfilled
      </span>
    );
  }
  if (s === "refunded") {
    return (
      <span className={`${base} border-red-200 bg-red-100 text-red-800`}>
        Refunded
      </span>
    );
  }

  return (
    <span className={`${base} border-brand-text/15 bg-white text-brand-text/80`}>
      {status?.trim() || "—"}
    </span>
  );
}

export function matchesStatusFilter(
  status: string | null | undefined,
  filter: "all" | "paid" | "fulfilled" | "refunded"
): boolean {
  if (filter === "all") return true;
  const s = normalizeStatus(status);
  return s === filter;
}
