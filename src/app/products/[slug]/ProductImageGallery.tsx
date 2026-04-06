"use client";

import { useMemo, useState } from "react";

export type GalleryImage = {
  id: string;
  url: string;
  position: number | null;
};

export function ProductImageGallery({
  images,
  productTitle,
}: {
  images: GalleryImage[];
  productTitle: string;
}) {
  const startIndex = useMemo(() => {
    const i = images.findIndex((img) => img.position === 0);
    return i >= 0 ? i : 0;
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState(startIndex);

  const safeIndex =
    images.length > 0
      ? Math.min(selectedIndex, Math.max(0, images.length - 1))
      : 0;
  const main = images[safeIndex];

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#E8E0D5]" />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#E8E0D5]">
        {main?.url ? (
          <img
            src={main.url}
            alt={productTitle}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((img, index) => {
            const isSelected = index === safeIndex;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative h-12 w-12 sm:h-16 sm:w-16 shrink-0 cursor-pointer overflow-hidden rounded-md ring-2 ring-offset-1 transition-shadow ${
                  isSelected
                    ? "ring-brand-primary"
                    : "ring-transparent hover:ring-brand-text/20"
                } `}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={isSelected}
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-brand-secondary/25" />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
