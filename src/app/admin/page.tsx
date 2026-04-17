import { getTodaysRevenuePence } from "@/lib/admin/stripe-revenue";
import {
  getOrdersTodayCount,
  getRecentOrders,
} from "@/lib/admin/supabase-orders";
import { formatGbp, formatOrderDate } from "@/lib/admin/format";
import { getLowStockData, getProductCount } from "@/lib/admin/supabase-stock";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const [revenuePence, ordersToday, productCount, lowStock] = await Promise.all(
    [
      getTodaysRevenuePence(),
      getOrdersTodayCount(),
      getProductCount(),
      getLowStockData(),
    ]
  );

  const recentOrders = await getRecentOrders(10);

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-heading text-3xl text-brand-text">Dashboard</h1>
      <p className="mt-1 text-sm text-brand-text/70">
        Overview of revenue, orders, and inventory.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={"Today's Revenue"}
          value={formatGbp(revenuePence)}
          hint="Stripe (GBP, today)"
        />
        <StatCard
          label="Orders Today"
          value={String(ordersToday)}
          hint="Supabase"
        />
        <StatCard
          label="Total Products"
          value={String(productCount)}
          hint="Supabase"
        />
        <StatCard
          label="Low Stock Items"
          value={String(lowStock.lowStockVariantCount)}
          hint="Variants with stock below 5"
        />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-xl text-brand-text">Recent Orders</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-brand-text/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-text/10 bg-brand-bg">
              <tr>
                <th className="px-4 py-3 font-medium text-brand-text">Date</th>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Customer
                </th>
                <th className="px-4 py-3 font-medium text-brand-text">Total</th>
                <th className="px-4 py-3 font-medium text-brand-text">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-brand-text/60"
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((row) => (
                  <tr
                    key={row.id ?? row.created_at}
                    className="border-b border-brand-text/5 last:border-0 transition-colors hover:bg-brand-bg/60"
                  >
                    <td className="px-4 py-3 text-brand-text/90">
                      {formatOrderDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-brand-text/90">
                      {row.customer_name?.trim() ||
                        row.customer_email ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-brand-text/90">
                      {row.amount_total != null
                        ? formatGbp(row.amount_total)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-brand-text/90">
                      {row.status ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl text-brand-text">
          Low Stock Alerts
        </h2>
        {lowStock.items.length === 0 ? (
          <p className="mt-4 text-sm text-brand-text/70">
            No variants below 5 units in stock.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-text/10 rounded-lg border border-brand-text/10 bg-white shadow-sm">
            {lowStock.items.map((item, i) => (
              <li
                key={`${item.productTitle}-${item.sku ?? i}-${item.stock}`}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 transition-colors hover:bg-brand-bg/60"
              >
                <div>
                  <p className="font-medium text-brand-text">
                    {item.productTitle}
                  </p>
                  <p className="text-sm text-brand-text/70">
                    {[item.variantTitle, item.size, item.colour, item.sku]
                      .filter(Boolean)
                      .join(" · ") || "Variant"}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand-secondary">
                  {item.stock} in stock
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-brand-text/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl text-brand-text">{value}</p>
      <p className="mt-1 text-xs text-brand-text/50">{hint}</p>
    </div>
  );
}
