import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/list — returns the current active list, or ?history=true for last 6 completed
export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(req.url)

  if (searchParams.get('history') === 'true') {
    const { data: lists } = await supabase
      .from('shopping_lists')
      .select('id, status, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(6)

    const listsWithCounts = await Promise.all(
      (lists ?? []).map(async list => {
        const { count } = await supabase
          .from('list_items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id)
        return { ...list, item_count: count ?? 0 }
      })
    )

    return NextResponse.json({ lists: listsWithCounts })
  }

  const { data: list } = await supabase
    .from('shopping_lists')
    .select('id, status, created_at')
    .in('status', ['draft', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!list) {
    return NextResponse.json({ list: null, items: [] })
  }

  const { data: items } = await supabase
    .from('list_items')
    .select('*')
    .eq('list_id', list.id)
    .order('order_index', { ascending: true })

  return NextResponse.json({ list, items: items ?? [] })
}

// POST /api/list — creates or replaces the draft list
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()
  const { items } = body as { items: Array<{ name: string; section: string; order_index: number; qty: number }> }

  // Archive any existing draft lists
  await supabase
    .from('shopping_lists')
    .update({ status: 'completed' })
    .in('status', ['draft', 'active'])

  // Create new list
  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .insert({ status: 'draft' })
    .select()
    .single()

  if (listError || !list) {
    return NextResponse.json({ error: 'Erro ao criar lista' }, { status: 500 })
  }

  // Insert items
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('list_items')
      .insert(items.map(item => ({ ...item, list_id: list.id, status: 'pending' })))

    if (itemsError) {
      return NextResponse.json({ error: 'Erro ao salvar itens' }, { status: 500 })
    }
  }

  return NextResponse.json({ list })
}

// PATCH /api/list — updates list status or item status
export async function PATCH(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()

  // Finalize list
  if (body.action === 'finalize' && body.list_id) {
    await supabase
      .from('shopping_lists')
      .update({ status: 'active' })
      .eq('id', body.list_id)
    return NextResponse.json({ ok: true })
  }

  // Update item status
  if (body.action === 'update_item' && body.item_id) {
    const { error } = await supabase
      .from('list_items')
      .update({ status: body.status })
      .eq('id', body.item_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Update item name
  if (body.action === 'rename_item' && body.item_id) {
    const { error } = await supabase
      .from('list_items')
      .update({ name: body.name, section: body.section })
      .eq('id', body.item_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Delete item
  if (body.action === 'delete_item' && body.item_id) {
    await supabase.from('list_items').delete().eq('id', body.item_id)
    return NextResponse.json({ ok: true })
  }

  // Add single item to existing list
  if (body.action === 'add_item' && body.list_id) {
    const { data, error } = await supabase
      .from('list_items')
      .insert({
        list_id: body.list_id,
        name: body.name,
        section: body.section,
        order_index: body.order_index ?? 999,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}
