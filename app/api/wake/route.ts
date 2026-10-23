import { NextResponse } from 'next/server'

const PROJECT_REF = 'heqfkhjzdwhxdbydfqci'

export async function POST() {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'SUPABASE_MANAGEMENT_TOKEN não configurado no Vercel' }, { status: 500 })
  }

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/restore`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? `Supabase Management API: ${res.status}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao chamar Management API' },
      { status: 500 }
    )
  }
}
