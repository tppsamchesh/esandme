import { InvoiceToolbar } from "@/app/admin/receipts/[id]/_components/InvoiceToolbar";
import { invoiceNumberFromSession } from "@/app/admin/receipts/_lib/invoice-number";
import { fetchCheckoutSessionBreakdown } from "@/app/admin/receipts/_lib/stripe-session-breakdown";
import {
  fetchCheckoutLineItemsDetail,
  fetchOrderById,
} from "@/app/admin/orders/_lib/orders-data";
import { formatShippingAddress } from "@/app/admin/orders/_lib/format-shipping";
import { formatGbp } from "@/lib/admin/format";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function formatInvoiceDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Invoice ${id.slice(0, 8)}…`,
  };
}

export default async function AdminReceiptInvoicePage({ params }: Props) {
  const { id } = await params;
  const order = await fetchOrderById(id);
  if (!order) notFound();

  const lineItems = order.stripe_session_id
    ? await fetchCheckoutLineItemsDetail(order.stripe_session_id)
    : [];

  const breakdown = order.stripe_session_id
    ? await fetchCheckoutSessionBreakdown(order.stripe_session_id)
    : null;

  const linesSum = lineItems.reduce((acc, li) => acc + li.amount_total, 0);
  const subtotalPence =
    breakdown && breakdown.amountSubtotalPence > 0
      ? breakdown.amountSubtotalPence
      : linesSum;

  const taxPence = breakdown?.amountTaxPence ?? 0;
  let shippingPence = breakdown?.amountShippingPence ?? 0;
  if (
    shippingPence === 0 &&
    order.amount_total != null &&
    subtotalPence + taxPence <= order.amount_total
  ) {
    shippingPence = Math.max(
      0,
      order.amount_total - subtotalPence - taxPence
    );
  }

  const invoiceNo = invoiceNumberFromSession(order.stripe_session_id);
  const grandTotal =
    order.amount_total ?? subtotalPence + shippingPence + taxPence;

  return (
    <div className="p-6 md:p-8 print:bg-white print:p-8">
      <InvoiceToolbar />

      <article className="mx-auto max-w-3xl rounded-xl border border-brand-text/15 bg-white p-8 shadow-sm print:max-w-none print:border-0 print:shadow-none">
        <header className="relative flex flex-col gap-6 border-b border-brand-text/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-heading text-3xl font-semibold tracking-tight text-brand-text">
              Es &amp; Me
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-brand-text/50">
              Invoice
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-mono text-sm text-brand-text">
              <span className="text-brand-text/60">Invoice no.</span>{" "}
              {invoiceNo}
            </p>
            <p className="mt-1 text-sm text-brand-text">
              <span className="text-brand-text/60">Date:</span>{" "}
              {formatInvoiceDate(order.created_at)}
            </p>
            <div className="mt-4 flex justify-start sm:justify-end">
              <span className="inline-block rotate-[-8deg] rounded border-2 border-green-600 px-4 py-2 font-heading text-xl font-semibold uppercase tracking-widest text-green-700">
                Paid
              </span>
            </div>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
            Bill to
          </h2>
          <p className="mt-2 font-medium text-brand-text">
            {order.customer_name?.trim() || "—"}
          </p>
          <p className="mt-1 text-sm text-brand-text/85 break-all">
            {order.customer_email ?? "—"}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-text/90">
            {formatShippingAddress(order.shipping_address)}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-lg text-brand-text">Items</h2>
          {lineItems.length === 0 ? (
            <p className="mt-4 text-sm text-brand-text/70">
              {order.stripe_session_id
                ? "Line items could not be loaded from Stripe for this order."
                : "No Stripe session linked to this order."}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-text/15">
                    <th className="py-3 pr-4 font-medium text-brand-text">
                      Product
                    </th>
                    <th className="py-3 pr-4 font-medium text-brand-text">
                      Qty
                    </th>
                    <th className="py-3 pr-4 text-right font-medium text-brand-text">
                      Unit price
                    </th>
                    <th className="py-3 text-right font-medium text-brand-text">
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => {
                    const qty = li.quantity || 0;
                    const unit =
                      qty > 0 ? Math.round(li.amount_total / qty) : li.amount_total;
                    return (
                      <tr
                        key={`${li.description}-${i}`}
                        className="border-b border-brand-text/5"
                      >
                        <td className="py-3 pr-4 text-brand-text">
                          {li.description}
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-brand-text/90">
                          {qty}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-brand-text/90">
                          {formatGbp(unit)}
                        </td>
                        <td className="py-3 text-right tabular-nums text-brand-text">
                          {formatGbp(li.amount_total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 flex justify-end border-t border-brand-text/10 pt-6">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between gap-8">
              <dt className="text-brand-text/65">Subtotal</dt>
              <dd className="tabular-nums text-brand-text">
                {formatGbp(subtotalPence)}
              </dd>
            </div>
            <div className="flex justify-between gap-8">
              <dt className="text-brand-text/65">Shipping</dt>
              <dd className="tabular-nums text-brand-text">
                {formatGbp(shippingPence)}
              </dd>
            </div>
            {taxPence > 0 ? (
              <div className="flex justify-between gap-8">
                <dt className="text-brand-text/65">Tax</dt>
                <dd className="tabular-nums text-brand-text">
                  {formatGbp(taxPence)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-8 border-t border-brand-text/15 pt-3 font-heading text-lg font-semibold text-brand-text">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatGbp(grandTotal)}</dd>
            </div>
          </dl>
        </section>

        <footer className="mt-12 border-t border-brand-text/10 pt-6 text-center text-xs text-brand-text/50">
          Thank you for shopping with Es &amp; Me.
        </footer>
      </article>
    </div>
  );
}
