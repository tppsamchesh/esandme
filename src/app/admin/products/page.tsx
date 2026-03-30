import { ProductsAdminClient } from "./_components/ProductsAdminClient";
import { fetchProductsForAdmin } from "./_lib/fetch-products";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
};

export default async function AdminProductsPage() {
  const products = await fetchProductsForAdmin();

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-heading text-3xl text-brand-text">Products & stock</h1>
      <p className="mt-1 text-sm text-brand-text/70">
        View stock levels and edit product details. Changes save to Sanity.
      </p>
      <div className="mt-8">
        <ProductsAdminClient products={products} />
      </div>
    </div>
  );
}
