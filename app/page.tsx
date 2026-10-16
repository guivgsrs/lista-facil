'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Camera, ShoppingCart, Clock, Pencil } from 'lucide-react'

interface ListEntry {
  id: string
  status: 'draft' | 'active' | 'completed'
  created_at: string
  item_count: number
}

const S = {
  bg: 'var(--bg)', card: 'var(--bg-card)',
  blue: 'var(--blue)', green: 'var(--green)', orange: 'var(--orange)',
  p1: 'var(--label-primary)', p2: 'var(--label-secondary)', p3: 'var(--label-tertiary)',
  sep: 'var(--separator-inset)', fill2: 'var(--fill-secondary)', fill3: 'var(--fill-tertiary)',
}

function formatListName(dateStr: string): string {
  const date = new Date(dateStr)
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  return `Lista ${d}/${m}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}min atrás`
  if (hours < 24) return `${hours}h atrás`
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days} dias atrás`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function SegmentedControl({ active }: { active: 'edit' | 'shop' }) {
  return (
    <div style={{ display: 'flex', background: 'var(--fill-secondary)', borderRadius: 9, padding: 2, gap: 2 }}>
      <Link href="/" style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
        borderRadius: 7, textDecoration: 'none', fontSize: 13,
        background: active === 'edit' ? 'var(--bg-card)' : 'transparent',
        color: active === 'edit' ? 'var(--label-primary)' : 'var(--label-secondary)',
        fontWeight: active === 'edit' ? 600 : 400,
        boxShadow: active === 'edit' ? '0 1px 3px rgba(0,0,0,0.14)' : 'none',
      }}>
        <Pencil size={13} aria-hidden={true} />
        Criar
      </Link>
      <Link href="/shop" style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
        borderRadius: 7, textDecoration: 'none', fontSize: 13,
        background: active === 'shop' ? 'var(--bg-card)' : 'transparent',
        color: active === 'shop' ? 'var(--label-primary)' : 'var(--label-secondary)',
        fontWeight: active === 'shop' ? 600 : 400,
        boxShadow: active === 'shop' ? '0 1px 3px rgba(0,0,0,0.14)' : 'none',
      }}>
        <ShoppingCart size={13} aria-hidden={true} />
        Mercado
      </Link>
    </div>
  )
}

/* Corner marks that simulate a camera viewfinder */
function ViewfinderCorners() {
  const base: React.CSSProperties = {
    position: 'absolute', width: 16, height: 16,
    borderColor: 'rgba(255,255,255,0.22)',
  }
  return (
    <>
      <div style={{ ...base, top: 14, left: 136, borderTop: '2px solid', borderLeft: '2px solid', borderTopLeftRadius: 3 }} />
      <div style={{ ...base, top: 14, right: 14, borderTop: '2px solid', borderRight: '2px solid', borderTopRightRadius: 3 }} />
      <div style={{ ...base, bottom: 14, left: 136, borderBottom: '2px solid', borderLeft: '2px solid', borderBottomLeftRadius: 3 }} />
      <div style={{ ...base, bottom: 14, right: 14, borderBottom: '2px solid', borderRight: '2px solid', borderBottomRightRadius: 3 }} />
    </>
  )
}

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState<ListEntry[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [listRes, histRes] = await Promise.all([
      fetch('/api/list'),
      fetch('/api/list?history=true'),
    ])
    const listData = await listRes.json()
    const histData = await histRes.json()

    const all: ListEntry[] = []
    if (listData.list) {
      all.push({
        id: listData.list.id,
        status: listData.list.status,
        created_at: listData.list.created_at,
        item_count: (listData.items ?? []).length,
      })
    }
    for (const h of (histData.lists ?? [])) {
      all.push({ id: h.id, status: h.status as ListEntry['status'], created_at: h.created_at, item_count: h.item_count ?? 0 })
    }
    setLists(all)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Loading ── */
  if (loading) return (
    <main style={{ minHeight: '100dvh', background: S.bg }}>
      <header className="apple-header" style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 28, width: 160, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 34, width: 132, borderRadius: 9 }} />
      </header>
      <div style={{ padding: '20px 16px 0' }}>
        <div className="skeleton" style={{ height: 168, borderRadius: 20, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 52, borderRadius: 14, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 13, width: '30%', marginBottom: 8 }} />
        <div style={{ background: S.card, borderRadius: 12, overflow: 'hidden' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i === 0 ? `0.5px solid ${S.sep}` : 'none' }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 16, width: '45%', marginBottom: 5 }} />
                <div className="skeleton" style={{ height: 13, width: '30%' }} />
              </div>
              <div className="skeleton" style={{ height: 24, width: 64, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )

  /* ── Ready ── */
  return (
    <main style={{ minHeight: '100dvh', background: S.bg, paddingBottom: 'calc(48px + env(safe-area-inset-bottom))' }}>

      <header className="apple-header" style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Lista de mercado</h1>
        <SegmentedControl active="edit" />
      </header>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── Scanner CTA — dark card like camera viewfinder ── */}
        <div style={{ position: 'relative', marginBottom: 10 }}>

          {/* Dark camera area (primary) */}
          <Link href="/edit" style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            background: 'linear-gradient(155deg, #1a1a1c 0%, #0e0e10 100%)',
            borderRadius: 20, minHeight: 168,
            padding: '20px 20px 20px 148px',
            textDecoration: 'none', overflow: 'hidden', position: 'relative',
            boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
          }}>
            <Camera
              size={80}
              color="rgba(255,255,255,0.06)"
              style={{ position: 'absolute', top: '50%', left: '62%', transform: 'translate(-50%, -50%)' }}
              aria-hidden={true}
            />
            <ViewfinderCorners />
            <p style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>
              Tirar foto da lista
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              Escaneie a lista manuscrita
            </p>
          </Link>

          {/* Floating manual button — left side (secondary) */}
          <Link href="/edit" style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            background: '#fff', borderRadius: 14,
            padding: '14px 10px', width: 114, textAlign: 'center',
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.38)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
          }}>
            <Pencil size={20} color={S.blue} aria-hidden={true} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: S.blue, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.45 }}>
              {'ADICIONAR\nMANUALMENTE'}
            </p>
          </Link>
        </div>

        {/* ── History ── */}
        {lists.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: S.p3, textTransform: 'uppercase', letterSpacing: 0.6, margin: '20px 4px 6px' }}>
              Listas
            </p>
            <div style={{ background: S.card, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {lists.map((list, idx) => {
                const isActive  = list.status === 'active'
                const isDraft   = list.status === 'draft'

                return (
                  <div key={list.id}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: isActive ? 'rgba(52,199,89,0.12)' : isDraft ? 'rgba(255,149,0,0.12)' : S.fill3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Clock size={17} color={isActive ? S.green : isDraft ? S.orange : S.p2} aria-hidden={true} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: S.p1 }}>
                          {formatListName(list.created_at)}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 13, color: S.p2 }}>
                          {list.item_count} {list.item_count === 1 ? 'item' : 'itens'} · {formatDate(list.created_at)}
                        </p>
                      </div>
                      {isActive && (
                        <span style={{ fontSize: 12, color: S.green, background: 'rgba(52,199,89,0.12)', padding: '4px 10px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>
                          Em uso
                        </span>
                      )}
                      {isDraft && (
                        <span style={{ fontSize: 12, color: S.orange, background: 'rgba(255,149,0,0.12)', padding: '4px 10px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>
                          Rascunho
                        </span>
                      )}
                      {!isActive && !isDraft && (
                        <span style={{ fontSize: 12, color: S.p3, background: S.fill3, padding: '4px 10px', borderRadius: 20, fontWeight: 500, flexShrink: 0 }}>
                          Concluída
                        </span>
                      )}
                    </div>
                    {idx < lists.length - 1 && <div className="list-separator" />}
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>
    </main>
  )
}
