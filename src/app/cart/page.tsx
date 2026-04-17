'use client'

import { useCart } from '@/lib/store/cart'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const FREE_DELIVERY_THRESHOLD = 5000
const DELIVERY_FEE_PENCE = 495

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const cartTotal = total()
  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - cartTotal
  const hasFreeDelivery = cartTotal >= FREE_DELIVERY_THRESHOLD
  const deliveryPence = hasFreeDelivery ? 0 : DELIVERY_FEE_PENCE
  const orderTotal = cartTotal + deliveryPence
  const progressPercent = Math.min(
    100,
    (cartTotal / FREE_DELIVERY_THRESHOLD) * 100
  )

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          email: email.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center md:py-28">
        <h1 className="font-heading text-3xl font-medium text-brand-text">
          Your bag is empty
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-text/65">
          When you&apos;re ready, your favourites will be waiting here — soft
          layers, gentle tones, and pieces made for tiny moments.
        </p>
        <Link
          href="/collections/muslins"
          className="mt-10 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-primary px-8 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
        >
          Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
      <h1 className="font-heading text-3xl font-medium tracking-tight text-brand-text">
        Your bag
      </h1>

      <div className="mt-8 rounded-lg border border-black/10 bg-white p-4 md:p-5">
        <div
          className="h-2 overflow-hidden rounded-full bg-brand-primary/15"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress toward free delivery"
        >
          <div
            className="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {hasFreeDelivery ? (
          <p className="mt-3 text-sm font-medium text-brand-primary">
            You&apos;ve unlocked free delivery 🎉
          </p>
        ) : (
          <p className="mt-3 text-sm text-brand-text/70">
            Spend{' '}
            <span className="font-medium text-brand-text">
              £{(remainingForFreeDelivery / 100).toFixed(2)}
            </span>{' '}
            more for free delivery
          </p>
        )}
      </div>

      <div className="mt-10 divide-y divide-black/10">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 py-8 md:gap-6"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[#E8E0D5]">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="font-medium text-brand-text">{item.title}</h3>
              {item.variant ? (
                <p className="mt-0.5 text-sm text-gray-500">
                  {item.variant.title}
                </p>
              ) : null}
              <p className="mt-1 text-sm font-medium text-brand-primary">
                £{(item.price / 100).toFixed(2)}
              </p>
              <div className="mt-4 inline-flex w-fit items-stretch overflow-hidden rounded-full border border-brand-primary">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.id, Math.max(1, item.quantity - 1))
                  }
                  className="flex min-h-11 min-w-11 items-center justify-center text-brand-text transition-colors hover:bg-brand-primary/10"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="flex min-w-[2.25rem] items-center justify-center border-x border-brand-primary px-2 text-sm font-medium text-brand-text">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="flex min-h-11 min-w-11 items-center justify-center text-brand-text transition-colors hover:bg-brand-primary/10"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end text-right">
              <p className="font-medium text-brand-primary">
                £{((item.price * item.quantity) / 100).toFixed(2)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="mt-2 text-sm text-brand-text/45 transition-colors hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-black/10 pt-8">
        <div className="space-y-3 text-sm text-brand-text">
          <div className="flex justify-between">
            <span className="text-brand-text/75">Subtotal</span>
            <span>£{(cartTotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-text/75">Delivery</span>
            <span
              className={
                hasFreeDelivery ? 'font-medium text-brand-primary' : ''
              }
            >
              {hasFreeDelivery ? 'Free' : '£4.95'}
            </span>
          </div>
          <div className="flex justify-between border-t border-black/10 pt-4 text-base font-bold text-brand-text">
            <span>Total</span>
            <span>£{(orderTotal / 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <label
            htmlFor="checkout-email"
            className="block text-sm font-medium text-brand-text"
          >
            Email for order updates &amp; reminders
          </label>
          <input
            id="checkout-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm text-brand-text outline-none ring-brand-primary focus:ring-2"
          />
          <p className="text-xs text-brand-text/55">
            We&apos;ll save your bag if you don&apos;t finish checkout — use the
            same email you&apos;ll enter on Stripe.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-brand-primary py-4 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {loading ? 'Redirecting…' : 'Checkout'}
        </button>
      </div>
    </div>
  )
}
