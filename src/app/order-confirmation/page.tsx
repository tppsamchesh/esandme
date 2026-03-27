'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/store/cart'
import Link from 'next/link'

export default function OrderConfirmationPage() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">🎉</div>
      <h1 className="text-3xl font-semibold mb-4">Thank you for your order</h1>
      <p className="text-gray-600 mb-4">
        We've received your order and will send you a confirmation email shortly.
      </p>
      <p className="text-gray-600 mb-10">
        Orders are dispatched within 1–2 business days.
      </p>
      <Link
        href="/"
        className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
      >
        Continue shopping
      </Link>
    </main>
  )
}
