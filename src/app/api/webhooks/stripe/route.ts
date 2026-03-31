import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { adminSupabase } from '@/lib/supabase/admin-client'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const stripe = getStripe()

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    await adminSupabase.from('orders').insert({
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      amount_total: session.amount_total,
      currency: session.currency,
      status: 'paid',
      shipping_address: session.shipping_details?.address,
      created_at: new Date().toISOString(),
    })

    const now = new Date().toISOString()
    await adminSupabase
      .from('abandoned_carts')
      .update({
        recovered: true,
        recovered_at: now,
      })
      .eq('stripe_session_id', session.id)
  }

  return NextResponse.json({ received: true })
}
