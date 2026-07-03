/**
 * Central SEO configuration and JSON-LD structured-data builders.
 *
 * Keeping these in one place keeps titles, descriptions, the brand entity and
 * structured data consistent across every page, and makes it easy for search
 * engines and AI answer engines (Google AI Overviews, ChatGPT, Perplexity,
 * Claude) to understand the Es & Me brand.
 */

export const SITE = {
  name: "Es & Me",
  legalName: "Es & Me",
  tagline: "Premium Baby Products UK",
  description:
    "Premium baby products and gifts, made with care. Shop muslins, baby changing essentials and the Snuggy Bunny comforter.",
  email: "hello@esandme.com",
  locale: "en_GB",
  twitterHandle: "", // none yet
  social: ["https://www.instagram.com/esandmeuk"],
} as const;

/** Canonical site origin, no trailing slash. */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.esandme.com";
  return raw.replace(/\/$/, "");
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path) return base;
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Organization schema — establishes the brand as an entity for the Google
 * Knowledge Graph and gives AI engines a canonical description to cite.
 */
export function organizationJsonLd() {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: base,
    logo: `${base}/opengraph-image`,
    image: `${base}/opengraph-image`,
    description: SITE.description,
    email: SITE.email,
    sameAs: SITE.social,
    areaServed: "GB",
  };
}

/**
 * WebSite schema — declares the site entity and a SearchAction so Google can
 * render a sitelinks search box and AI engines understand the site shape.
 */
export function websiteJsonLd() {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": `${base}/#organization` },
    inLanguage: "en-GB",
  };
}

export type BreadcrumbItem = { name: string; path: string };

/** BreadcrumbList schema from an ordered list of {name, path} crumbs. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

type ReviewLike = {
  rating?: number | string | null;
  author?: string | null;
  body?: string | null;
};

type ProductSchemaInput = {
  title: string;
  slug: string;
  description?: string | null;
  /** Price in pence. */
  pricePence: number;
  images?: string[];
  sku?: string | null;
  inStock?: boolean;
  reviews?: ReviewLike[];
};

/**
 * Rich Product schema with offer, brand, images and — when reviews exist —
 * aggregateRating + individual reviews, which unlock star ratings in search
 * results and product mentions in AI shopping answers.
 */
export function productJsonLd(input: ProductSchemaInput) {
  const base = getSiteUrl();
  const url = `${base}/products/${input.slug}`;

  const reviews = (input.reviews ?? [])
    .map((r) => {
      const value = Math.min(
        5,
        Math.max(0, Math.round(Number(r.rating)) || 0),
      );
      return { ...r, ratingValue: value };
    })
    .filter((r) => r.ratingValue > 0);

  // priceValidUntil one year out keeps Merchant listings from going stale.
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    description: input.description || SITE.description,
    url,
    brand: { "@type": "Brand", name: SITE.name },
    ...(input.images && input.images.length > 0
      ? { image: input.images }
      : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    offers: {
      "@type": "Offer",
      url,
      price: (input.pricePence / 100).toFixed(2),
      priceCurrency: "GBP",
      priceValidUntil: validUntil.toISOString().slice(0, 10),
      itemCondition: "https://schema.org/NewCondition",
      availability:
        input.inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE.name },
      // Shipping + returns unlock richer Google Shopping free-listing
      // annotations. Values mirror the live checkout + homepage policy.
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "4.95",
          currency: "GBP",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "GB",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 4,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "GB",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
  };

  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.ratingValue, 0);
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (sum / reviews.length).toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
    schema.review = reviews.map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.ratingValue,
        bestRating: 5,
        worstRating: 1,
      },
      ...(r.author ? { author: { "@type": "Person", name: r.author } } : {}),
      ...(r.body ? { reviewBody: r.body } : {}),
    }));
  }

  return schema;
}

type ArticleSchemaInput = {
  title: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
};

/** BlogPosting schema for journal articles. */
export function articleJsonLd(input: ArticleSchemaInput) {
  const base = getSiteUrl();
  const url = `${base}/blog/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description || undefined,
    url,
    mainEntityOfPage: url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    dateModified: input.modifiedAt || input.publishedAt || undefined,
    author: { "@type": "Organization", name: SITE.name, url: base },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${base}/opengraph-image` },
    },
  };
}

type CollectionSchemaInput = {
  title: string;
  slug: string;
  description?: string | null;
  products: Array<{ title: string; slug: string }>;
};

/** CollectionPage + ItemList schema for category pages. */
export function collectionJsonLd(input: CollectionSchemaInput) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.title,
    description: input.description || undefined,
    url: `${base}/collections/${input.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.products.length,
      itemListElement: input.products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${base}/products/${p.slug}`,
        name: p.title,
      })),
    },
  };
}

/** Render one or more JSON-LD objects as a script tag payload. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data);
}
