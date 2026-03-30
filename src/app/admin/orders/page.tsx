import { OrdersClient } from "./_components/OrdersClient";
import { fetchAllOrdersForAdmin } from "./_lib/orders-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage() {
  const orders = await fetchAllOrdersForAdmin();

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-heading text-3xl text-brand-text">Orders</h1>
      <p className="mt-1 text-sm text-brand-text/70">
        All orders from checkout, newest first.
      </p>
      <OrdersClient orders={orders} />
    </div>
  );
}
