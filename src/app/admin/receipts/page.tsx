import { ReceiptsClient } from "@/app/admin/receipts/_components/ReceiptsClient";
import { fetchAllOrdersForAdmin } from "@/app/admin/orders/_lib/orders-data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Receipts & Invoices",
};

export default async function AdminReceiptsPage() {
  const orders = await fetchAllOrdersForAdmin();

  return (
    <div className="p-6 md:p-8">
      <div>
        <h1 className="font-heading text-3xl text-brand-text">
          Receipts &amp; Invoices
        </h1>
        <p className="mt-1 text-sm text-brand-text/70">
          View and print invoices for every order, newest first.
        </p>
      </div>

      <ReceiptsClient orders={orders} />
    </div>
  );
}
