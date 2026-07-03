import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { ChatBot } from "@/components/chatbot/ChatBot";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  organizationJsonLd,
  websiteJsonLd,
  jsonLdScript,
} from "@/lib/seo/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.esandme.com";
const metadataBase = new URL(
  siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl
);

// Origin that serves product/collection/blog images (Supabase storage).
// Preconnecting shaves the TLS/DNS handshake off image loads, helping LCP.
const imageOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin;
  } catch {
    return "";
  }
})();

const defaultTitle = "Es & Me | Premium Baby Products UK";
const defaultDescription =
  "Premium baby products and gifts, made with care. Shop muslins, baby changing and the Snuggy Bunny comforter.";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: defaultTitle,
    template: "%s | Es & Me",
  },
  description: defaultDescription,
  applicationName: "Es & Me",
  keywords: [
    "baby products",
    "baby gifts",
    "muslins",
    "baby changing mat",
    "changing bag",
    "baby comforter",
    "baby shower gifts",
    "newborn essentials",
    "UK baby brand",
  ],
  authors: [{ name: "Es & Me" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: "Es & Me",
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-brand-bg font-sans text-brand-text">
        {imageOrigin ? (
          <>
            <link rel="preconnect" href={imageOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={imageOrigin} />
          </>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([organizationJsonLd(), websiteJsonLd()]),
          }}
        />
        <SiteChrome>{children}</SiteChrome>
        <ChatBot />
      </body>
    </html>
  );
}
