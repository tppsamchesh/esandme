import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Basket",
  robots: { index: false, follow: true },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
