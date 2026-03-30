"use client";

import Link from "next/link";

export function InvoiceToolbar() {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-4 print:hidden">
      <Link
        href="/admin/receipts"
        className="text-sm text-brand-primary underline-offset-2 hover:underline"
      >
        ← Back to Receipts
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Download PDF
      </button>
    </div>
  );
}
