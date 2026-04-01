"use client";

import { useCart } from "@/lib/store/cart";
import Link from "next/link";
import type { MouseEvent } from "react";

type Props = {
  productId: string;
  title: string;
  slug: string;
  pricePence: number;
  imageUrl: string | null;
};

export function CollectionProductCard({
  productId,
  title,
  slug,
  pricePence,
  imageUrl,
}: Props) {
  const { addItem } = useCart();
  const href = `/products/${slug}`;
  const priceLabel = `£${(pricePence / 100).toFixed(2)}`;

  function handleAddToBag(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: productId,
      title,
      price: pricePence,
      image: imageUrl ?? "",
      quantity: 1,
    });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-brand-text/10 bg-brand-bg shadow-sm transition-shadow duration-300 hover:border-brand-primary/35 hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden bg-brand-secondary/25">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-sans text-sm text-brand-text/35">
            No image
          </div>
        )}
        <Link
          href={href}
          className="absolute inset-0 z-[1] cursor-pointer"
          aria-label={`View ${title}`}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] translate-y-full transition-transform duration-200 ease-out group-hover:translate-y-0">
          <button
            type="button"
            onClick={handleAddToBag}
            className="pointer-events-auto w-full cursor-pointer bg-[#8BA888] py-2 text-xs font-medium text-white transition-opacity hover:opacity-95"
          >
            Add to bag
          </button>
        </div>
      </div>
      <Link
        href={href}
        className="block flex-1 cursor-pointer p-3"
      >
        <h2 className="font-heading text-sm font-medium leading-snug text-brand-text group-hover:text-brand-primary">
          {title}
        </h2>
        <p className="mt-1 font-sans text-sm tabular-nums text-brand-text/60">
          {priceLabel}
        </p>
      </Link>
    </article>
  );
}
