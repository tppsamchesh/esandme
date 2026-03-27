import Link from "next/link";

const navLinks = [
  { href: "/collections/muslins", label: "Muslins" },
  { href: "/collections/baby-changing", label: "Baby Changing" },
  { href: "/collections/snuggy-bunny", label: "Snuggy Bunny" },
  { href: "/our-story", label: "Our Story" },
  { href: "/blog", label: "Blog" },
] as const;

const trustBadges = [
  { title: "Free delivery", subtitle: "On orders over £50" },
  { title: "30-day returns", subtitle: "Hassle-free" },
  { title: "Sustainable packaging", subtitle: "Kind to the planet" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="font-heading text-3xl font-medium text-brand-text">
              Es & Me
            </p>
            <p className="mt-2 max-w-sm text-sm text-brand-text/75">
              Made with love for little ones
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-text/85">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="transition-colors hover:text-brand-primary"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-text transition-colors hover:text-brand-primary"
                aria-label="Es & Me on Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                  aria-hidden
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-brand-text">
              Join our world
            </p>
            <p className="mt-1 text-sm text-brand-text/70">
              Gentle updates, new arrivals, and little moments of calm.
            </p>
            <form className="mt-4 flex flex-col gap-3 sm:flex-row" noValidate>
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="min-h-11 flex-1 rounded-md border border-black/15 bg-brand-bg px-4 text-sm text-brand-text placeholder:text-brand-text/40 outline-none transition-[box-shadow,border-color] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/25"
              />
              <button
                type="submit"
                className="min-h-11 shrink-0 rounded-md bg-brand-primary px-6 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <ul className="mt-14 grid gap-6 border-t border-black/10 pt-10 sm:grid-cols-3">
          {trustBadges.map(({ title, subtitle }) => (
            <li
              key={title}
              className="text-center sm:text-left"
            >
              <p className="text-sm font-medium text-brand-text">{title}</p>
              <p className="mt-1 text-xs text-brand-text/65">{subtitle}</p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-xs text-brand-text/50 sm:text-left">
          © {new Date().getFullYear()} Es & Me. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
