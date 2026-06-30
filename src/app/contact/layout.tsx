import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Es & Me. Questions about our baby products, orders or gifting? Email hello@esandme.com — we'd love to help.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    title: "Contact Us | Es & Me",
    description: "Questions about our baby products, orders or gifting?",
    url: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
