import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/presets — returns all preset items
export async function GET() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('preset_items')
    .select('*')
    .order('name', { ascending: true })

  return NextResponse.json({ presets: data ?? [] })
}

// POST /api/presets — adds a new preset item
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('preset_items')
    .insert({ name: body.name, section: body.section })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ preset: data })
}

// DELETE /api/presets — removes a preset item
export async function DELETE(req: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await supabase.from('preset_items').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
