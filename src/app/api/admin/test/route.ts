import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url) return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL' })
  if (!key) return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' })
  
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  const { data, error } = await supabase
    .from('collections')
    .insert({ title: 'Test', slug: 'test-' + Date.now(), description: 'Test' })
    .select()
  
  return NextResponse.json({ data, error, urlExists: !!url, keyExists: !!key })
}
