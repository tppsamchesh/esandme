'use client'

import { useState } from 'react'
import { useCart } from '@/lib/store/cart'
import { urlFor } from '@/lib/sanity/client'

export default function AddToCart({ product }: { product: any }) {
  const { addItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    addItem({
      id: selectedVariant ? `${product._id}-${selectedVariant.sku}` : product._id,
      title: selectedVariant ? `${product.title} - ${selectedVariant.title}` : product.title,
      price: selectedVariant?.price || product.price,
      image: product.images?.[0] ? urlFor(product.images[0]).width(400).url() : '',
      quantity: 1,
      variant: selectedVariant ? { title: selectedVariant.title, sku: selectedVariant.sku } : undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div>
      {product.variants?.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-brand-text/80">
            Options
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant: any) => (
              <button
                key={variant.sku}
                type="button"
                onClick={() => setSelectedVariant(variant)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedVariant?.sku === variant.sku
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-brand-text/20 text-brand-text hover:border-brand-primary hover:text-brand-primary"
                }`}
              >
                {variant.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={handleAddToCart}
        className="w-full rounded-md bg-brand-primary py-4 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
      >
        {added ? "Added to bag" : "Add to bag"}
      </button>
    </div>
  )
}
