"use client";

import { formatGbp } from "@/lib/admin/format";
import { invoiceNumberFromSession } from "@/app/admin/receipts/_lib/invoice-number";
import { OrderStatusBadge } from "@/app/admin/orders/_components/StatusBadge";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { OrderRecord } from "@/app/admin/orders/_lib/orders-data";

export type ReceiptOrderRow = OrderRecord & {
  line_item_count: number | null;
};

function formatReceiptDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReceiptsClient({ orders }: { orders: ReceiptOrderRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const name = (o.customer_name ?? "").toLowerCase();
      const email = (o.customer_email ?? "").toLowerCase();
      const inv = invoiceNumberFromSession(o.stripe_session_id).toLowerCase();
      return (
        name.includes(q) || email.includes(q) || inv.includes(q)
      );
    });
  }, [orders, search]);

  if (orders.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-brand-text/10 bg-white px-6 py-12 text-center shadow-sm">
        <p className="font-heading text-lg text-brand-text">
          No receipts yet
        </p>
        <p className="mt-2 max-w-md mx-auto text-sm text-brand-text/75">
          When customers complete checkout, their orders will appear here as
          invoices you can view and print.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="max-w-md">
        <label htmlFor="receipts-search" className="sr-only">
          Search by customer name, email, or invoice number
        </label>
        <input
          id="receipts-search"
          type="search"
          placeholder="Search name, email, or invoice number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-brand-text/10 bg-white px-4 py-8 text-center text-sm text-brand-text/70">
          No receipts match your search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-brand-text/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-text/10 bg-brand-bg">
              <tr>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Invoice Number
                </th>
                <th className="px-4 py-3 font-medium text-brand-text">Date</th>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Customer Name
                </th>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Customer Email
                </th>
                <th className="px-4 py-3 font-medium text-brand-text">Items</th>
                <th className="px-4 py-3 font-medium text-brand-text">Total</th>
                <th className="px-4 py-3 font-medium text-brand-text">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={0}
                  role="link"
                  className="cursor-pointer border-b border-brand-text/5 transition-colors last:border-0 hover:bg-brand-bg focus:bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                  onClick={() => router.push(`/admin/receipts/${row.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/admin/receipts/${row.id}`);
                    }
                  }}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-brand-text/90">
                    {invoiceNumberFromSession(row.stripe_session_id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-text/90">
                    {formatReceiptDate(row.created_at)}
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-brand-text/90">
                    {row.customer_name?.trim() || "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-brand-text/90">
                    {row.customer_email ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-text/90">
                    {row.line_item_count != null ? row.line_item_count : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-text/90">
                    {row.amount_total != null
                      ? formatGbp(row.amount_total)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <OrderStatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {search.trim() !== "" && (
        <p className="text-xs text-brand-text/50">
          Showing {filtered.length} of {orders.length} receipt
          {orders.length === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
