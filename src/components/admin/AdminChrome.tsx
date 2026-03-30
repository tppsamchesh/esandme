"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isLogin = pathname === "/admin/login" || pathname === "/admin/login/";

  if (isLogin) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text">{children}</div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-bg text-brand-text">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-auto">
        {children}
      </div>
    </div>
  );
}
