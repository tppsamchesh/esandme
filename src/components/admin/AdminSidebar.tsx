"use client";

import { Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links: ReadonlyArray<{
  href: string;
  label: string;
  exact?: boolean;
  icon?: LucideIcon;
}> = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/receipts", label: "Receipts" },
  { href: "/admin/abandoned-carts", label: "Abandoned Carts" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/agents", label: "AI Agents", icon: Sparkles },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/20 bg-brand-primary text-white print:hidden">
      <div className="border-b border-white/20 px-5 py-6">
        <Link
          href="/admin"
          className="font-heading text-2xl font-semibold tracking-tight text-white"
        >
          Es & Me
        </Link>
        <p className="mt-1 text-xs font-normal text-white/80">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {links.map(({ href, label, exact, icon: Icon }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/20 text-white"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              {Icon ? (
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              ) : null}
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
