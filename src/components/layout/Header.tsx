"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";

const navLinks = [
  { href: "/baby-shower-gifting", label: "Baby Shower" },
  { href: "/collections/muslins", label: "Muslins" },
  { href: "/collections/changing-mats", label: "Changing Mats" },
  { href: "/collections/changing-bags", label: "Changing Bags" },
  { href: "/collections/snuggy-bunny", label: "Snuggy Bunny" },
  { href: "/our-story", label: "Our Story" },
] as const;

function CartButton() {
  const count = useCart((s) => s.itemCount());

  return (
    <Link
      href="/cart"
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-brand-text transition-colors hover:bg-brand-bg"
      aria-label={`Shopping cart${count > 0 ? `, ${count} items` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6 5 3H2" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-medium text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 md:py-4">
        <div className="relative flex items-center justify-center py-0.5">
          {/* Hamburger button — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full text-brand-text transition-colors hover:bg-brand-bg md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <Link
            href="/"
            className="font-heading text-2xl font-medium tracking-tight text-brand-text"
          >
            Es & Me
          </Link>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <CartButton />
          </div>
        </div>

        {/* Desktop nav — hidden on mobile */}
        <nav
          className="mt-3 hidden flex-wrap justify-center gap-x-4 gap-y-2 text-center text-sm text-brand-text/90 md:mt-4 md:flex md:gap-x-6"
          aria-label="Main"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 whitespace-nowrap transition-colors hover:text-brand-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="border-t border-black/10 bg-white md:hidden"
        >
          <nav
            className="mx-auto flex max-w-7xl flex-col px-4 py-2"
            aria-label="Main"
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-black/5 py-3 font-sans text-sm text-brand-text/90 transition-colors hover:text-brand-primary last:border-0"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
