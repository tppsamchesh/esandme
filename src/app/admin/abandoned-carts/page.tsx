import { formatGbp } from "@/lib/admin/format";
import { getSupabase } from "@/lib/supabase/client";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abandoned Carts",
};

type AbandonedRow = {
  id: string;
  email: string;
  cart_items: unknown;
  cart_total: number | null;
  stripe_session_id: string | null;
  recovery_email_sent: boolean;
  recovery_email_sent_at: string | null;
  recovered: boolean;
  recovered_at: string | null;
  created_at: string;
};

function itemsCount(cart_items: unknown): number {
  return Array.isArray(cart_items) ? cart_items.length : 0;
}

function rowStatus(row: AbandonedRow): "Abandoned" | "Email Sent" | "Recovered" {
  if (row.recovered) return "Recovered";
  if (row.recovery_email_sent) return "Email Sent";
  return "Abandoned";
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function filterRows(
  rows: AbandonedRow[],
  tab: string
): AbandonedRow[] {
  switch (tab) {
    case "abandoned":
      return rows.filter((r) => !r.recovered && !r.recovery_email_sent);
    case "email_sent":
      return rows.filter((r) => !r.recovered && r.recovery_email_sent);
    case "recovered":
      return rows.filter((r) => r.recovered);
    default:
      return rows;
  }
}

function tabClass(active: boolean) {
  return `rounded-md px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-brand-primary text-white shadow-sm"
      : "border border-brand-text/15 bg-white text-brand-text hover:bg-brand-bg"
  }`;
}

export default async function AbandonedCartsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp?.status ?? "all";
  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data as AbandonedRow[] | null) ?? [];
  if (error) {
    console.error("abandoned_carts fetch", error.message);
  }

  const totalRows = rows.length;
  const recoveredCount = rows.filter((r) => r.recovered).length;
  const recoveryRatePct =
    totalRows > 0
      ? Math.round((recoveredCount / totalRows) * 1000) / 10
      : 0;
  const totalAbandonedOpen = rows.filter((r) => !r.recovered).length;

  const filtered = filterRows(rows, tab);

  return (
    <div className="p-6 md:p-8">
      <div>
        <h1 className="font-heading text-3xl text-brand-text">
          Abandoned Carts
        </h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Carts captured at checkout; recovery emails send after one hour.
        </p>
      </div>

      {!resendConfigured ? (
        <div
          className="mt-8 rounded-lg border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <strong className="font-medium">Resend not configured.</strong> Add{" "}
          <span className="font-mono text-[0.9em]">RESEND_API_KEY</span> to your
          environment variables to send recovery emails. Hourly cron calls{" "}
          <span className="font-mono text-[0.9em]">
            /api/abandoned-cart/recover
          </span>
          .
        </div>
      ) : null}

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-brand-text/10 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
            Total Abandoned
          </p>
          <p className="mt-1 font-heading text-2xl text-brand-text">
            {totalAbandonedOpen}
          </p>
          <p className="mt-1 text-xs text-brand-text/50">
            Not yet recovered
          </p>
        </div>
        <div className="rounded-lg border border-brand-text/10 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
            Recovered
          </p>
          <p className="mt-1 font-heading text-2xl text-brand-text">
            {recoveredCount}
          </p>
          <p className="mt-1 text-xs text-brand-text/50">Completed checkout</p>
        </div>
        <div className="rounded-lg border border-brand-text/10 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/55">
            Recovery rate
          </p>
          <p className="mt-1 font-heading text-2xl text-brand-text">
            {totalRows > 0 ? `${recoveryRatePct}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-brand-text/50">
            Recovered ÷ all captured
          </p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link
          href="/admin/abandoned-carts"
          className={tabClass(tab === "all" || !tab)}
        >
          All
        </Link>
        <Link
          href="/admin/abandoned-carts?status=abandoned"
          className={tabClass(tab === "abandoned")}
        >
          Abandoned
        </Link>
        <Link
          href="/admin/abandoned-carts?status=email_sent"
          className={tabClass(tab === "email_sent")}
        >
          Email Sent
        </Link>
        <Link
          href="/admin/abandoned-carts?status=recovered"
          className={tabClass(tab === "recovered")}
        >
          Recovered
        </Link>
      </div>

      {totalRows === 0 && !error ? (
        <div className="mt-10 rounded-lg border border-brand-text/10 bg-white px-6 py-12 text-center shadow-sm">
          <p className="font-heading text-lg text-brand-text">
            No abandoned carts yet
          </p>
          <p className="mt-2 text-sm text-brand-text/75">
            When customers enter their email on the bag page and start
            checkout, we&apos;ll record their cart here if they don&apos;t
            complete payment.
          </p>
        </div>
      ) : error ? (
        <p className="mt-10 text-sm text-red-700">
          Could not load abandoned carts. Run the SQL migration and ensure the
          Supabase table exists.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 rounded-lg border border-brand-text/10 bg-white px-4 py-8 text-center text-sm text-brand-text/70">
          No carts match this filter.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-brand-text/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-text/10 bg-brand-bg">
              <tr>
                <th className="px-4 py-3 font-medium text-brand-text">Date</th>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Customer Email
                </th>
                <th className="px-4 py-3 font-medium text-brand-text">Items</th>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Cart value
                </th>
                <th className="px-4 py-3 font-medium text-brand-text">Status</th>
                <th className="px-4 py-3 font-medium text-brand-text">
                  Recovery email sent
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const status = rowStatus(row);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-brand-text/5 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-brand-text/90">
                      {formatWhen(row.created_at)}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-brand-text/90">
                      {row.email}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-brand-text/90">
                      {itemsCount(row.cart_items)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-brand-text/90">
                      {row.cart_total != null
                        ? formatGbp(row.cart_total)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusPill status={status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-brand-text/80">
                      {formatWhen(row.recovery_email_sent_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: "Abandoned" | "Email Sent" | "Recovered";
}) {
  const base =
    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium";
  if (status === "Recovered") {
    return (
      <span className={`${base} border-green-200 bg-green-100 text-green-800`}>
        Recovered
      </span>
    );
  }
  if (status === "Email Sent") {
    return (
      <span className={`${base} border-amber-200 bg-amber-100 text-amber-900`}>
        Email Sent
      </span>
    );
  }
  return (
    <span className={`${base} border-brand-text/15 bg-white text-brand-text/85`}>
      Abandoned
    </span>
  );
}
