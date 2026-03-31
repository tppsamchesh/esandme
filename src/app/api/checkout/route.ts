import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { adminSupabase } from '@/lib/supabase/admin-client'

const FREE_DELIVERY_THRESHOLD = 5000
const DELIVERY_FEE_PENCE = 495

export async function POST(req: Request) {
  try {
    const { items, email } = await req.json()
    const stripe = getStripe()
    const emailTrim =
      typeof email === 'string' ? email.trim().toLowerCase() : ''

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.title,
          images: item.image ? [item.image] : [],
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      ...(emailTrim ? { customer_email: emailTrim } : {}),
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'gbp' },
            display_name: 'Free delivery',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 495, currency: 'gbp' },
            display_name: 'Standard delivery',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
      ],
    })

    if (emailTrim) {
      const cartSubtotal = items.reduce(
        (sum: number, item: { price?: number; quantity?: number }) =>
          sum + (item.price ?? 0) * (item.quantity ?? 0),
        0
      )
      const hasFreeDelivery = cartSubtotal >= FREE_DELIVERY_THRESHOLD
      const deliveryPence = hasFreeDelivery ? 0 : DELIVERY_FEE_PENCE
      const cartTotal = cartSubtotal + deliveryPence

      const { error: abandonedErr } = await adminSupabase.from('abandoned_carts').insert({
        email: emailTrim,
        cart_items: items,
        cart_total: cartTotal,
        stripe_session_id: session.id,
      })
      if (abandonedErr) {
        console.warn('abandoned_carts insert', abandonedErr.message)
      }
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
