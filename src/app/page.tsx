import Link from "next/link";
import Image from "next/image";

const collections: {
  href: string;
  label: string;
  imageUrl: string | null;
}[] = [
  {
    href: "/collections/muslins",
    label: "Muslins",
    imageUrl:
      "https://zgskeielwbqasawbtjsg.supabase.co/storage/v1/object/public/product-images/Blossom%20Muslin%20in%20a%20nursery.png",
  },
  {
    href: "/collections/changing-mats",
    label: "Changing Mats",
    imageUrl: null,
  },
  {
    href: "/collections/changing-bags",
    label: "Changing Bags",
    imageUrl:
      "https://zgskeielwbqasawbtjsg.supabase.co/storage/v1/object/public/product-images/Changing%20Bag%20Polkadot%20Coffee%20Shop.png",
  },
  {
    href: "/collections/snuggy-bunny",
    label: "Snuggy Bunny",
    imageUrl: null,
  },
];

const reviews = [
  {
    quote:
      "The quality is so lovely and the fabric is incredibly soft",
    author: "Sarah M.",
  },
  {
    quote:
      "I recommend this brand to any soon-to-be parent or anyone building a baby gift basket",
    author: "Emma T.",
  },
  {
    quote:
      "Cherry on top: packaging is very cute and the handwritten note was very sweet",
    author: "Laura K.",
  },
] as const;

function StarRow() {
  return (
    <div className="flex gap-0.5 text-brand-secondary" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
        </svg>
      ))}
    </div>
  );
}

function TrustIconsRow() {
  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-12 sm:gap-y-6">
      <div className="flex items-center justify-center gap-3 text-sm text-brand-text/85">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M3 12h18" />
          </svg>
        </span>
        <span>Free delivery over £50</span>
      </div>
      <div className="flex items-center justify-center gap-3 text-sm text-brand-text/85">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </span>
        <span>30-day returns</span>
      </div>
      <div className="flex items-center justify-center gap-3 text-sm text-brand-text/85">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 2 8.8a7 7 0 0 1-10 9.2z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </span>
        <span>Sustainable packaging</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="flex min-h-[90vh] w-full flex-col items-center justify-center bg-gradient-to-b from-brand-bg to-[#E8EFE7] px-4 py-20 text-center"
        aria-label="Welcome"
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-4xl font-medium leading-tight tracking-tight text-brand-text sm:text-5xl md:text-6xl">
            For your little one, from the heart
          </h1>
          <p className="mt-6 text-base leading-relaxed text-brand-text/75 sm:text-lg">
            Premium baby products, made with care. Perfect for gifting.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/collections/muslins"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-brand-primary px-8 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
            >
              Shop now
            </Link>
            <Link
              href="/our-story"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-brand-text/25 bg-transparent px-8 text-sm font-medium text-brand-text transition-colors hover:border-brand-primary hover:text-brand-primary"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section
        className="border-t border-black/5 bg-brand-bg px-4 py-16 md:py-24"
        aria-labelledby="collections-heading"
      >
        <div className="mx-auto max-w-7xl">
          <h2
            id="collections-heading"
            className="font-heading text-center text-3xl font-medium text-brand-text md:text-4xl"
          >
            Shop our collections
          </h2>
          <ul className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {collections.map(({ href, label, imageUrl }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group block cursor-pointer"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="h-full w-full bg-[#E8E0D5]"
                        aria-hidden
                      />
                    )}
                    <div
                      className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/35"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-4 text-center font-heading text-base font-medium text-brand-text transition-colors group-hover:text-brand-primary">
                    {label}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reviews */}
      <section
        className="border-t border-black/5 bg-white px-4 py-16 md:py-24"
        aria-labelledby="reviews-heading"
      >
        <div className="mx-auto max-w-7xl">
          <h2
            id="reviews-heading"
            className="font-heading text-center text-3xl font-medium text-brand-text md:text-4xl"
          >
            What our customers say
          </h2>
          <ul className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-10">
            {reviews.map(({ quote, author }) => (
              <li key={author}>
                <blockquote className="flex h-full flex-col rounded-lg bg-brand-primary/12 p-8">
                  <p className="sr-only">Rated 5 out of 5 stars.</p>
                  <StarRow />
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-brand-text/90">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <footer className="mt-6 text-sm font-medium text-brand-text">
                    — {author}
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Trust bar */}
      <section
        className="border-t border-black/5 bg-brand-bg px-4 py-12 md:py-14"
        aria-label="Trust and delivery"
      >
        <div className="mx-auto max-w-7xl">
          <TrustIconsRow />
        </div>
      </section>
    </div>
  );
}
