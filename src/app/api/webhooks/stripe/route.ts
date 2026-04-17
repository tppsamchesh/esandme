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
    const now = new Date().toISOString()

    // 1. Retrieve line items
    const lineItemsResult = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
    })
    const lineItems = lineItemsResult.data.map((item) => ({
      name: item.description,
      quantity: item.quantity ?? 1,
      price_pence: item.price?.unit_amount ?? 0,
    }))

    // 2. Save order to Supabase — critical, throw on failure
    const { error: orderErr } = await adminSupabase.from('orders').insert({
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      amount_total: session.amount_total,
      currency: session.currency,
      status: 'paid',
      shipping_address: session.shipping_details?.address,
      line_items: lineItems,
      created_at: now,
    })
    if (orderErr) throw new Error(`Supabase order insert failed: ${orderErr.message}`)

    // 3. Mark abandoned cart as recovered
    await adminSupabase
      .from('abandoned_carts')
      .update({ recovered: true, recovered_at: now })
      .eq('stripe_session_id', session.id)

    // 4. Decrement stock for each line item
    for (const item of lineItems) {
      if (!item.name) continue
      const { data: variants, error: variantErr } = await adminSupabase
        .from('product_variants')
        .select('id, stock')
        .ilike('title', `%${item.name}%`)
        .limit(1)

      if (variantErr || !variants?.length) {
        console.warn(`Stock lookup failed for "${item.name}":`, variantErr?.message ?? 'no match')
        continue
      }

      const variant = variants[0]
      const newStock = Math.max(0, (variant.stock ?? 0) - item.quantity)
      const { error: stockErr } = await adminSupabase
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', variant.id)

      if (stockErr) {
        console.warn(`Stock update failed for "${item.name}":`, stockErr.message)
      }
    }

    // 5. Create ShipStation order
    if (!process.env.SHIPSTATION_API_KEY) {
      console.warn('SHIPSTATION_API_KEY not set — skipping ShipStation order creation')
    } else {
      try {
        const addr = session.shipping_details?.address ?? {}
        const recipientName = session.shipping_details?.name ?? session.customer_details?.name ?? ''
        const credentials = Buffer.from(
          `${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`
        ).toString('base64')

        const shipStationBody = {
          orderNumber: session.id.slice(-12),
          orderDate: now,
          orderStatus: 'awaiting_shipment',
          billTo: {
            name: recipientName,
            street1: addr.line1 ?? '',
            city: addr.city ?? '',
            state: addr.state ?? '',
            postalCode: addr.postal_code ?? '',
            country: 'GB',
          },
          shipTo: {
            name: recipientName,
            street1: addr.line1 ?? '',
            city: addr.city ?? '',
            state: addr.state ?? '',
            postalCode: addr.postal_code ?? '',
            country: 'GB',
          },
          items: lineItems.map((item) => ({
            name: item.name ?? '',
            quantity: item.quantity,
            unitPrice: (item.price_pence / 100).toFixed(2),
          })),
          amountPaid: ((session.amount_total ?? 0) / 100).toFixed(2),
          paymentDate: now,
        }

        const ssRes = await fetch('https://ssapi.shipstation.com/orders/createorder', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shipStationBody),
        })

        if (!ssRes.ok) {
          const ssErr = await ssRes.text()
          console.error(`ShipStation order creation failed (${ssRes.status}):`, ssErr)
        }
      } catch (err) {
        console.error('ShipStation request threw:', err)
      }
    }

    // 6. Send Telegram notification
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn('TELEGRAM_BOT_TOKEN not set — skipping Telegram notification')
    } else {
      try {
        const customerName = session.customer_details?.name ?? 'Unknown'
        const customerEmail = session.customer_details?.email ?? '—'
        const totalGbp = ((session.amount_total ?? 0) / 100).toFixed(2)
        const itemLines = lineItems
          .map((i) => `• ${i.name} × ${i.quantity}`)
          .join('\n')

        const text = [
          '🛍 New order!',
          '',
          `Customer: ${customerName}`,
          `Email: ${customerEmail}`,
          `Total: £${totalGbp}`,
          '',
          'Items:',
          itemLines,
          '',
          'Check the admin hub for details.',
        ].join('\n')

        const tgRes = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text,
            }),
          }
        )

        if (!tgRes.ok) {
          const tgErr = await tgRes.text()
          console.error('Telegram notification failed:', tgErr)
        }
      } catch (err) {
        console.error('Telegram notification threw:', err)
      }
    }
  }

  return NextResponse.json({ received: true })
}
