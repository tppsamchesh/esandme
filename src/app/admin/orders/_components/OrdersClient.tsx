"use client";

import { formatGbp } from "@/lib/admin/format";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { OrderRecord } from "../_lib/orders-data";
import { matchesStatusFilter, OrderStatusBadge } from "./StatusBadge";

export type OrderRow = OrderRecord & {
  line_item_count: number | null;
};

function orderIdLast8(sessionId: string | null): string {
  if (!sessionId) return "—";
  return sessionId.length <= 8 ? sessionId : sessionId.slice(-8);
}

function formatOrderDate(iso: string): string {
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

export function OrdersClient({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "fulfilled" | "refunded"
  >("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!matchesStatusFilter(o.status, statusFilter)) return false;
      if (!q) return true;
      const name = (o.customer_name ?? "").toLowerCase();
      const email = (o.customer_email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [orders, search, statusFilter]);

  if (orders.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-brand-text/10 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-brand-text/80">
          No orders yet — they&apos;ll appear here automatically when customers
          check out.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md flex-1">
          <label htmlFor="orders-search" className="sr-only">
            Search by customer name or email
          </label>
          <input
            id="orders-search"
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="orders-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="orders-status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "paid" | "fulfilled" | "refunded"
              )
            }
            className="w-full rounded-md border border-brand-text/20 bg-white px-3 py-2 text-sm outline-none ring-brand-primary focus:ring-2"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-brand-text/10 bg-white px-4 py-8 text-center text-sm text-brand-text/70">
          No orders match your search or filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-brand-text/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-text/10 bg-brand-bg">
              <tr>
                <th className="px-4 py-3 font-medium text-brand-text">Date</th>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Order ID
                </th>
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
                  onClick={() => router.push(`/admin/orders/${row.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/admin/orders/${row.id}`);
                    }
                  }}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-brand-text/90">
                    {formatOrderDate(row.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-brand-text/90">
                    {orderIdLast8(row.stripe_session_id)}
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

      {(search.trim() || statusFilter !== "all") && (
        <p className="text-xs text-brand-text/50">
          Showing {filtered.length} of {orders.length} order
          {orders.length === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
