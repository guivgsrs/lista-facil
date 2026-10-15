'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, X, RefreshCw } from 'lucide-react'
import { SECTIONS, getSectionOrder } from '@/lib/store-map'
import type { ListItem, SectionGroup } from '@/lib/types'

type PageState = 'loading' | 'empty' | 'shopping'

export default function ShopPage() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [sections, setSections] = useState<SectionGroup[]>([])
  const [listId, setListId] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [doneItems, setDoneItems] = useState(0)
  const [updating, setUpdating] = useState<Set<string>>(new Set())

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
      groups.push({
        id: sectionId,
        name: sectionDef?.name ?? 'Sem seção',
        store: sectionDef?.store ?? 'assai',
        order: getSectionOrder(sectionId),
        items: sectionItems.filter(i => i.status !== 'found'), // hide found items
      })
    }

    return groups
      .filter(g => g.items.length > 0)
      .sort((a, b) => a.order - b.order)
  }, [])

  const loadList = useCallback(async () => {
    const res = await fetch('/api/list')
    const data = await res.json()

    if (!data.list || data.list.status === 'draft') {
      setPageState('empty')
      return
    }

    const items: ListItem[] = data.items ?? []
    setListId(data.list.id)
    setTotalItems(items.length)
    setDoneItems(items.filter((i: ListItem) => i.status === 'found').length)
    setSections(buildSections(items))
    setPageState('shopping')
  }, [buildSections])

  useEffect(() => { loadList() }, [loadList])

  async function updateItemStatus(itemId: string, status: 'found' | 'not_found') {
    // Optimistic update
    setUpdating(prev => new Set(prev).add(itemId))

    setSections(prev => {
      const allItems = prev.flatMap(s => s.items)
      const updated = allItems.map(i => i.id === itemId ? { ...i, status } : i)
      if (status === 'found') {
        setDoneItems(d => d + 1)
      }
      return buildSections(updated)
    })

    // Persist to DB
    await fetch('/api/list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_item', item_id: itemId, status }),
    })

    setUpdating(prev => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }

  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0
  const assaiSections = sections.filter(s => s.store === 'assai')
  const covabraSections = sections.filter(s => s.store === 'covabra')
  const allDone = pageState === 'shopping' && sections.length === 0

  // ────── RENDER ──────

  if (pageState === 'loading') {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '24px 16px' }}>
        <div style={{ height: 28, width: '60%', marginBottom: 8 }} className="skeleton" />
        <div style={{ height: 16, width: '40%', marginBottom: 24 }} className="skeleton" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', marginBottom: 8 }}>
            <div style={{ height: 14, width: '35%', marginBottom: 10 }} className="skeleton" />
            <div style={{ height: 20, width: '70%' }} className="skeleton" />
          </div>
        ))}
      </main>
    )
  }

  if (pageState === 'empty') {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, margin: '0 0 8px', textAlign: 'center' }}>Nenhuma lista ativa</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, textAlign: 'center', marginBottom: 32 }}>
          Peça para adicionar uma nova lista
        </p>
        <button
          onClick={loadList}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 24px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={18} />
          Verificar novamente
        </button>
      </main>
    )
  }

  if (allDone) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>Lista concluída!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, textAlign: 'center', margin: '0 0 32px' }}>
          Todos os {totalItems} itens foram marcados
        </p>
        <button
          onClick={loadList}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray5)', color: 'var(--text-primary)', border: 'none', borderRadius: 12, padding: '13px 24px', fontSize: 16, cursor: 'pointer' }}
        >
          <RefreshCw size={18} />
          Atualizar
        </button>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 32 }}>
      {/* Sticky header */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--separator)',
        padding: '16px 20px 12px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Mercado</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {doneItems} de {totalItems} itens
            </p>
          </div>
          <button
            onClick={loadList}
            style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}
          >
            <RefreshCw size={20} color="var(--blue)" />
          </button>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--separator)', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--green)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </header>

      <div style={{ padding: '12px 16px 0' }}>
        {/* Assaí sections */}
        {assaiSections.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '8px 4px 8px' }}>
              Assaí
            </p>
            {assaiSections.map(section => (
              <SectionCard key={section.id} section={section} onUpdate={updateItemStatus} updating={updating} />
            ))}
          </>
        )}

        {/* Covabra sections */}
        {covabraSections.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#FF9500', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '20px 4px 8px' }}>
              Covabra
            </p>
            {covabraSections.map(section => (
              <SectionCard key={section.id} section={section} onUpdate={updateItemStatus} updating={updating} />
            ))}
          </>
        )}
      </div>
    </main>
  )
}

function SectionCard({
  section,
  onUpdate,
  updating,
}: {
  section: SectionGroup
  onUpdate: (id: string, status: 'found' | 'not_found') => void
  updating: Set<string>
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      {/* Section header */}
      <p style={{
        margin: '0 0 4px 4px',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: section.store === 'covabra' ? 'none' : 'none',
      }}>
        {section.name}
      </p>

      {/* Items */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden' }}>
        {section.items.map((item, idx) => (
          <ItemRow
            key={item.id}
            item={item}
            isLast={idx === section.items.length - 1}
            loading={updating.has(item.id)}
            onFound={() => onUpdate(item.id, 'found')}
            onNotFound={() => onUpdate(item.id, 'not_found')}
          />
        ))}
      </div>
    </div>
  )
}

function ItemRow({
  item,
  isLast,
  loading,
  onFound,
  onNotFound,
}: {
  item: ListItem
  isLast: boolean
  loading: boolean
  onFound: () => void
  onNotFound: () => void
}) {
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--separator)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Item name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </p>
        {item.status === 'not_found' && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--orange)' }}>Não encontrado no Assaí</p>
        )}
      </div>

      {/* "Não achei" — small, bottom-left feel, intentionally less prominent */}
      <button
        onClick={onNotFound}
        disabled={loading}
        style={{
          background: 'none',
          border: '1px solid var(--separator)',
          borderRadius: 8,
          padding: '7px 10px',
          fontSize: 12,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          flexShrink: 0,
          minWidth: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <X size={13} />
        Não achei
      </button>

      {/* "Peguei" — large, primary, green, right side */}
      <button
        onClick={onFound}
        disabled={loading}
        style={{
          background: 'var(--green)',
          border: 'none',
          borderRadius: 12,
          width: 52,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Check size={24} color="#fff" strokeWidth={3} />
      </button>
    </div>
  )
}
