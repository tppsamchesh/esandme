import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign in",
};

function LoginFallback() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-brand-secondary/40 bg-white p-8 shadow-sm">
      <p className="text-sm text-brand-text/70">Loading…</p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<LoginFallback />}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
