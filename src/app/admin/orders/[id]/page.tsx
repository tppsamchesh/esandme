import { OrderStatusBadge } from "../_components/StatusBadge";
import { formatShippingAddress } from "../_lib/format-shipping";
import {
  fetchCheckoutLineItemsDetail,
  fetchOrderById,
} from "../_lib/orders-data";
import { formatGbp } from "@/lib/admin/format";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id.slice(0, 8)}…`,
  };
}

function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await fetchOrderById(id);
  if (!order) notFound();

  const lineItems = order.stripe_session_id
    ? await fetchCheckoutLineItemsDetail(order.stripe_session_id)
    : [];

  const shipStationUrl = order.stripe_session_id
    ? `https://ship11.shipstation.com/orders/all-orders-search-result?quickSearch=${encodeURIComponent(order.stripe_session_id)}`
    : null;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link
          href="/admin/orders"
          className="text-sm text-brand-primary underline-offset-2 hover:underline"
        >
          ← Back to orders
        </Link>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-brand-text">Order</h1>
          <p className="mt-1 text-sm text-brand-text/60">
            {formatOrderDate(order.created_at)}
          </p>
          {order.stripe_session_id && (
            <p className="mt-2 font-mono text-xs text-brand-text/70">
              Session: {order.stripe_session_id}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {shipStationUrl ? (
            <a
              href={shipStationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              View in ShipStation
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-brand-text/10 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg text-brand-text">Customer</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-brand-text/60">Name</dt>
              <dd className="text-brand-text">
                {order.customer_name?.trim() || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-brand-text/60">Email</dt>
              <dd className="break-all text-brand-text">
                {order.customer_email ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-brand-text/10 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg text-brand-text">
            Shipping address
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-text">
            {formatShippingAddress(order.shipping_address)}
          </p>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-brand-text/10 bg-white shadow-sm">
        <div className="border-b border-brand-text/10 px-6 py-4">
          <h2 className="font-heading text-lg text-brand-text">Line items</h2>
        </div>
        {lineItems.length === 0 ? (
          <p className="px-6 py-8 text-sm text-brand-text/70">
            {order.stripe_session_id
              ? "Could not load line items from Stripe for this session."
              : "No Stripe session linked to this order."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-brand-text/10 bg-brand-bg">
                <tr>
                  <th className="px-6 py-3 font-medium text-brand-text">
                    Item
                  </th>
                  <th className="px-6 py-3 font-medium text-brand-text">Qty</th>
                  <th className="px-6 py-3 text-right font-medium text-brand-text">
                    Line total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => (
                  <tr
                    key={`${li.description}-${i}`}
                    className="border-b border-brand-text/5 last:border-0"
                  >
                    <td className="px-6 py-3 text-brand-text">
                      {li.description}
                    </td>
                    <td className="px-6 py-3 text-brand-text/90">{li.quantity}</td>
                    <td className="px-6 py-3 text-right text-brand-text">
                      {formatGbp(li.amount_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end border-t border-brand-text/10 px-6 py-4">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-brand-text/60">
              Order total
            </p>
            <p className="font-heading text-2xl text-brand-text">
              {order.amount_total != null
                ? formatGbp(order.amount_total)
                : "—"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
