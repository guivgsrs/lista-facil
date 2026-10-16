'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ChevronLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { SECTIONS, getSectionOrder } from '@/lib/store-map'
import type { ItemStatus, ListItem, SectionGroup } from '@/lib/types'

type PageState = 'loading' | 'empty' | 'shopping'

export default function ShopPage() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [allItems, setAllItems]   = useState<ListItem[]>([])
  const [updating, setUpdating]   = useState<Set<string>>(new Set())

  const loadList = useCallback(async () => {
    setPageState('loading')
    const res  = await fetch('/api/list')
    const data = await res.json()
    if (!data.list || data.list.status === 'draft') { setPageState('empty'); return }
    setAllItems(data.items ?? [])
    setPageState('shopping')
  }, [])

  useEffect(() => { loadList() }, [loadList])

  async function toggleItem(itemId: string, current: ItemStatus) {
    const next: ItemStatus = current === 'found' ? 'pending' : 'found'
    setUpdating(p => new Set(p).add(itemId))
    setAllItems(p => p.map(i => i.id === itemId ? { ...i, status: next } : i))
    await fetch('/api/list', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_item', item_id: itemId, status: next }) })
    setUpdating(p => { const n = new Set(p); n.delete(itemId); return n })
  }

  async function markCovabra(itemId: string) {
    setUpdating(p => new Set(p).add(itemId))
    setAllItems(p => p.map(i => i.id === itemId ? { ...i, status: 'not_found' } : i))
    await fetch('/api/list', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_item', item_id: itemId, status: 'not_found' }) })
    setUpdating(p => { const n = new Set(p); n.delete(itemId); return n })
  }

  const buildSections = useCallback((items: ListItem[]): SectionGroup[] => {
    const map = new Map<string, ListItem[]>()
    for (const item of items) {
      const sec = item.status === 'not_found' ? 'covabra' : item.section
      if (!map.has(sec)) map.set(sec, [])
      map.get(sec)!.push(item)
    }
    const groups: SectionGroup[] = []
    for (const [id, sec] of map.entries()) {
      const def = SECTIONS.find(s => s.id === id)
      groups.push({
        id, name: def?.name ?? 'Sem seção', store: def?.store ?? 'assai',
        order: getSectionOrder(id),
        items: [
          ...sec.filter(i => i.status !== 'found'),
          ...sec.filter(i => i.status === 'found'),
        ],
      })
    }
    return groups.sort((a, b) => a.order - b.order)
  }, [])

  const sections      = buildSections(allItems)
  const total         = allItems.length
  const done          = allItems.filter(i => i.status === 'found').length
  const progress      = total > 0 ? done / total : 0
  const allDone       = total > 0 && done === total
  const assai         = sections.filter(s => s.store === 'assai')
  const covabra       = sections.filter(s => s.store === 'covabra')

  // ── LOADING ────────────────────────────────────────────────
  if (pageState === 'loading') return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '60px 16px 24px' }}>
      <div className="skeleton" style={{ height: 30, width: '45%', marginBottom: 6, borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 14, width: '28%', marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 5, marginBottom: 28, borderRadius: 3 }} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden' }}>
        {[78, 55, 70, 62, 80, 50].map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < 5 ? '0.5px solid var(--separator-inset)' : 'none' }}>
            <div className="skeleton" style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }} />
            <div className="skeleton" style={{ height: 17, width: `${w}%` }} />
          </div>
        ))}
      </div>
    </main>
  )

  // ── EMPTY ──────────────────────────────────────────────────
  if (pageState === 'empty') return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--fill-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <ShoppingCart size={30} color="var(--label-tertiary)" />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', letterSpacing: -0.4, textAlign: 'center' }}>Nenhuma lista ativa</h2>
      <p style={{ color: 'var(--label-secondary)', fontSize: 16, textAlign: 'center', margin: '0 0 36px', lineHeight: 1.5, maxWidth: 260 }}>
        Peça para criar uma nova lista na tela de edição
      </p>
      <button
        onClick={loadList}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 14, padding: '15px 28px', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}
      >
        <RefreshCw size={18} />
        Verificar
      </button>
    </main>
  )

  // ── SHOPPING ───────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 'calc(48px + env(safe-area-inset-bottom))' }}>

      {/* Header */}
      <header className="apple-header" style={{ padding: '12px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--blue)', textDecoration: 'none', fontSize: 16 }}>
            <ChevronLeft size={20} strokeWidth={2} style={{ marginLeft: -4 }} />
            Início
          </Link>
          <button onClick={loadList} aria-label="Atualizar lista" style={{ background: 'none', border: 'none', padding: '12px', cursor: 'pointer', display: 'flex', margin: -8 }}>
            <RefreshCw size={19} color="var(--blue)" aria-hidden={true} />
          </button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>
            {allDone ? 'Tudo certo!' : 'Mercado'}
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--label-secondary)' }}>
            {done} de {total} itens
          </p>
        </div>

        {/* Progress */}
        <div style={{ height: 4, background: 'var(--fill-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${progress * 100}%`,
            background: allDone ? 'var(--green)' : 'var(--blue)',
            transition: 'width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.3s ease',
          }} />
        </div>
      </header>

      <div style={{ padding: '20px 16px 0' }}>

        {/* Assaí */}
        {assai.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: 0.6, margin: '0 4px 6px' }}>
              Assaí Atacadista
            </p>
            {assai.map(s => (
              <SectionBlock key={s.id} section={s} onToggle={toggleItem} onCovabra={markCovabra} updating={updating} />
            ))}
          </>
        )}

        {/* Covabra */}
        {covabra.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 0.6, margin: '24px 4px 6px' }}>
              Covabra
            </p>
            {covabra.map(s => (
              <SectionBlock key={s.id} section={s} onToggle={toggleItem} onCovabra={markCovabra} updating={updating} />
            ))}
          </>
        )}

      </div>
    </main>
  )
}

/* ── SectionBlock ─────────────────────────────────────────── */
function SectionBlock({ section, onToggle, onCovabra, updating }: {
  section: SectionGroup
  onToggle:  (id: string, s: ItemStatus) => void
  onCovabra: (id: string) => void
  updating:  Set<string>
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ margin: '0 4px 5px', fontSize: 14, fontWeight: 600, color: 'var(--label-secondary)' }}>
        {section.name}
      </p>
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {section.items.map((item, idx) => (
          <CheckRow
            key={item.id}
            item={item}
            isLast={idx === section.items.length - 1}
            loading={updating.has(item.id)}
            onToggle={() => onToggle(item.id, item.status)}
            onCovabra={() => onCovabra(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

/* ── CheckRow ─────────────────────────────────────────────── */
function CheckRow({ item, isLast, loading, onToggle, onCovabra }: {
  item:      ListItem
  isLast:    boolean
  loading:   boolean
  onToggle:  () => void
  onCovabra: () => void
}) {
  const checked = item.status === 'found'

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '13px 16px', minHeight: 50,
        opacity: loading ? 0.55 : 1,
        transition: 'opacity 0.15s ease',
      }}>
        {/* Circle — 44pt tap area, 26pt visual */}
        <button
          onClick={onToggle}
          disabled={loading}
          aria-label={checked ? 'Desmarcar' : 'Marcar como encontrado'}
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0, padding: 0,
            border: 'none', background: 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            border: checked ? 'none' : '2px solid var(--gray3)',
            background: checked ? 'var(--green)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s ease, border-color 0.2s ease',
            pointerEvents: 'none',
          }}>
            {checked && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden={true}>
                <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 17, fontWeight: checked ? 400 : 500,
            color: checked ? 'var(--label-tertiary)' : 'var(--label-primary)',
            textDecoration: checked ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'color 0.2s ease',
          }}>
            {(item.qty ?? 1) > 1 && (
              <span style={{ fontSize: 14, fontWeight: 700, color: checked ? 'var(--label-tertiary)' : 'var(--blue)', marginRight: 5 }}>
                ×{item.qty}
              </span>
            )}
            {item.name}
          </p>
        </div>

        {/* Covabra — só quando pendente */}
        {!checked && item.status !== 'not_found' && (
          <button
            onClick={onCovabra}
            disabled={loading}
            style={{
              background: 'var(--fill-tertiary)',
              border: 'none', borderRadius: 8,
              padding: '10px 12px', fontSize: 12, fontWeight: 500,
              color: 'var(--label-secondary)',
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
              minHeight: 44,
            }}
          >
            Covabra →
          </button>
        )}
      </div>
      {!isLast && <div className="list-separator" />}
    </div>
  )
}
