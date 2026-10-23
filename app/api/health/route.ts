import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.from('shopping_lists').select('id').limit(1)
    if (error) return NextResponse.json({ status: 'error', message: error.message })
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const paused = msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')
    return NextResponse.json({ status: paused ? 'paused' : 'error', message: msg })
  }
}
