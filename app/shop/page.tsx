'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { SECTIONS, getSectionOrder } from '@/lib/store-map'
import type { ItemStatus, ListItem, SectionGroup } from '@/lib/types'

type PageState = 'loading' | 'empty' | 'shopping'

export default function ShopPage() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [allItems, setAllItems] = useState<ListItem[]>([])
  const [listId, setListId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  const loadList = useCallback(async () => {
    const res = await fetch('/api/list')
    const data = await res.json()

    if (!data.list || data.list.status === 'draft') {
      setPageState('empty')
      return
    }

    setListId(data.list.id)
    setAllItems(data.items ?? [])
    setPageState('shopping')
  }, [])

  useEffect(() => { loadList() }, [loadList])

  async function toggleItem(itemId: string, currentStatus: ItemStatus) {
    const newStatus: ItemStatus = currentStatus === 'found' ? 'pending' : 'found'

    setUpdating(prev => new Set(prev).add(itemId))
    setAllItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i))

    await fetch('/api/list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_item', item_id: itemId, status: newStatus }),
    })

    setUpdating(prev => { const n = new Set(prev); n.delete(itemId); return n })
  }

  async function markNotFound(itemId: string) {
    setUpdating(prev => new Set(prev).add(itemId))
    setAllItems(prev => prev.map(i => i.id === itemId ? { ...i, status: 'not_found' } : i))

    await fetch('/api/list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_item', item_id: itemId, status: 'not_found' }),
    })

    setUpdating(prev => { const n = new Set(prev); n.delete(itemId); return n })
  }

  // Build section groups — itens checked ficam no final da seção
  const buildSections = useCallback((items: ListItem[]): SectionGroup[] => {
    const map = new Map<string, ListItem[]>()

    for (const item of items) {
      const sec = item.status === 'not_found' ? 'covabra' : item.section
      if (!map.has(sec)) map.set(sec, [])
      map.get(sec)!.push(item)
    }

    const groups: SectionGroup[] = []
    for (const [sectionId, sectionItems] of map.entries()) {
      const sectionDef = SECTIONS.find(s => s.id === sectionId)
      const sorted = [
        ...sectionItems.filter(i => i.status === 'pending' || i.status === 'not_found'),
        ...sectionItems.filter(i => i.status === 'found'),
      ]
      groups.push({
        id: sectionId,
        name: sectionDef?.name ?? 'Sem seção',
        store: sectionDef?.store ?? 'assai',
        order: getSectionOrder(sectionId),
        items: sorted,
      })
    }

    return groups.sort((a, b) => a.order - b.order)
  }, [])

  const sections = buildSections(allItems)
  const totalItems = allItems.length
  const doneItems = allItems.filter(i => i.status === 'found').length
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0
  const allDone = totalItems > 0 && doneItems === totalItems
  const assaiSections = sections.filter(s => s.store === 'assai')
  const covabraSections = sections.filter(s => s.store === 'covabra')

  // ────── RENDER ──────

  if (pageState === 'loading') {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '60px 16px 24px' }}>
        <div style={{ height: 30, width: '50%', marginBottom: 6 }} className="skeleton" />
        <div style={{ height: 14, width: '30%', marginBottom: 20 }} className="skeleton" />
        <div style={{ height: 6, borderRadius: 3, marginBottom: 28 }} className="skeleton" />
        {[80, 65, 75, 70, 60, 85].map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--separator)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }} className="skeleton" />
            <div style={{ height: 18, width: `${w}%` }} className="skeleton" />
          </div>
        ))}
      </main>
    )
  }

  if (pageState === 'empty') {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🛒</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', textAlign: 'center', color: 'var(--text-primary)' }}>
          Nenhuma lista ativa
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, textAlign: 'center', margin: '0 0 32px', lineHeight: 1.5 }}>
          Peça para criar uma nova lista na tela de edição
        </p>
        <button
          onClick={loadList}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--blue)', color: '#fff',
            border: 'none', borderRadius: 14,
            padding: '14px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RefreshCw size={18} />
          Verificar novamente
        </button>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 40 }}>
      {/* Sticky header */}
      <header style={{
        background: 'rgba(242, 242, 247, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--separator)',
        padding: '16px 20px 14px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>
              {allDone ? 'Tudo certo! 🎉' : 'Mercado'}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {doneItems} de {totalItems} itens
            </p>
          </div>
          <button
            onClick={loadList}
            style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', marginTop: 2 }}
          >
            <RefreshCw size={19} color="var(--blue)" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, background: 'var(--fill-secondary)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: allDone ? 'var(--green)' : 'var(--blue)',
            borderRadius: 3,
            transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }} />
        </div>
      </header>

      <div style={{ padding: '20px 16px 0' }}>
        {/* Assaí */}
        {assaiSections.length > 0 && (
          <>
            <p style={{
              fontSize: 12, fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.6px',
              margin: '0 4px 6px',
            }}>
              Assaí Atacadista
            </p>
            {assaiSections.map(section => (
              <SectionGroup
                key={section.id}
                section={section}
                onToggle={toggleItem}
                onNotFound={markNotFound}
                updating={updating}
              />
            ))}
          </>
        )}

        {/* Covabra */}
        {covabraSections.length > 0 && (
          <>
            <p style={{
              fontSize: 12, fontWeight: 600,
              color: '#FF9500',
              textTransform: 'uppercase', letterSpacing: '0.6px',
              margin: '24px 4px 6px',
            }}>
              Covabra
            </p>
            {covabraSections.map(section => (
              <SectionGroup
                key={section.id}
                section={section}
                onToggle={toggleItem}
                onNotFound={markNotFound}
                updating={updating}
              />
            ))}
          </>
        )}
      </div>
    </main>
  )
}

function SectionGroup({
  section,
  onToggle,
  onNotFound,
  updating,
}: {
  section: SectionGroup
  onToggle: (id: string, status: ItemStatus) => void
  onNotFound: (id: string) => void
  updating: Set<string>
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ margin: '0 4px 5px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
        {section.name}
      </p>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {section.items.map((item, idx) => (
          <ChecklistRow
            key={item.id}
            item={item}
            isLast={idx === section.items.length - 1}
            loading={updating.has(item.id)}
            onToggle={() => onToggle(item.id, item.status)}
            onNotFound={() => onNotFound(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ChecklistRow({
  item,
  isLast,
  loading,
  onToggle,
  onNotFound,
}: {
  item: ListItem
  isLast: boolean
  loading: boolean
  onToggle: () => void
  onNotFound: () => void
}) {
  const checked = item.status === 'found'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '13px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--separator-inset)',
      opacity: loading ? 0.6 : 1,
      transition: 'opacity 0.15s ease',
    }}>
      {/* Circle checkbox */}
      <button
        onClick={onToggle}
        disabled={loading}
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          border: checked ? 'none' : '2px solid var(--gray4)',
          background: checked ? 'var(--green)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          padding: 0,
          transition: 'background 0.2s ease, border 0.2s ease',
        }}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Item name + qty */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 17,
          fontWeight: checked ? 400 : 500,
          color: checked ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: checked ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.2s ease',
        }}>
          {(item.qty ?? 1) > 1 && (
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: checked ? 'var(--text-tertiary)' : 'var(--blue)',
              marginRight: 6,
            }}>
              ×{item.qty}
            </span>
          )}
          {item.name}
        </p>
      </div>

      {/* Covabra button — só quando não encontrado e não checked */}
      {!checked && item.status !== 'not_found' && (
        <button
          onClick={onNotFound}
          disabled={loading}
          style={{
            background: 'var(--fill-tertiary)',
            border: 'none',
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Covabra →
        </button>
      )}
    </div>
  )
}
