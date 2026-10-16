'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Camera, ShoppingCart, Clock, ChevronRight, Plus, RefreshCw, ListChecks } from 'lucide-react'
import type { ListItem } from '@/lib/types'

interface CompletedList {
  id: string
  status: string
  created_at: string
  item_count: number
}

interface CurrentList {
  id: string
  status: 'draft' | 'active'
  created_at: string
}

const S = {
  bg: 'var(--bg)', card: 'var(--bg-card)',
  blue: 'var(--blue)', green: 'var(--green)', orange: 'var(--orange)',
  p1: 'var(--label-primary)', p2: 'var(--label-secondary)', p3: 'var(--label-tertiary)',
  sep: 'var(--separator-inset)', fill2: 'var(--fill-secondary)', fill3: 'var(--fill-tertiary)',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = now.getTime() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `${mins}min atrás`
  if (hours < 24)  return `${hours}h atrás`
  if (days  === 1) return 'Ontem'
  if (days  < 7)   return `${days} dias atrás`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export default function HomePage() {
  const [loading, setLoading]           = useState(true)
  const [currentList, setCurrentList]   = useState<CurrentList | null>(null)
  const [currentItems, setCurrentItems] = useState<ListItem[]>([])
  const [history, setHistory]           = useState<CompletedList[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [listRes, histRes] = await Promise.all([
      fetch('/api/list'),
      fetch('/api/list?history=true'),
    ])
    const listData = await listRes.json()
    const histData = await histRes.json()
    setCurrentList(listData.list  ?? null)
    setCurrentItems(listData.items ?? [])
    setHistory(histData.lists ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const doneItems  = currentItems.filter(i => i.status === 'found').length
  const totalItems = currentItems.length
  const isActive   = currentList?.status === 'active'
  const isDraft    = currentList?.status === 'draft'
  const isFirstTime = !currentList && history.length === 0

  /* ── Loading ── */
  if (loading) return (
    <main style={{ minHeight: '100dvh', background: S.bg }}>
      <header className="apple-header" style={{ padding: '16px 20px 14px' }}>
        <div className="skeleton" style={{ height: 28, width: 120, borderRadius: 8 }} />
      </header>
      <div style={{ padding: '20px 16px 0' }}>
        <div className="skeleton" style={{ height: 116, borderRadius: 16, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 70,  borderRadius: 14, marginBottom: 28 }} />
        <div className="skeleton" style={{ height: 13,  width: '32%', marginBottom: 8 }} />
        <div style={{ background: S.card, borderRadius: 12, overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < 2 ? `0.5px solid ${S.sep}` : 'none' }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 5 }} />
                <div className="skeleton" style={{ height: 13, width: '28%' }} />
              </div>
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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Lista Fácil</h1>
        <button onClick={load} aria-label="Atualizar" style={{ background: 'none', border: 'none', padding: 12, cursor: 'pointer', display: 'flex', margin: -8 }}>
          <RefreshCw size={19} color={S.blue} aria-hidden={true} />
        </button>
      </header>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── First-time empty state ── */}
        {isFirstTime && (
          <div style={{ textAlign: 'center', padding: '52px 24px 40px' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: S.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <ListChecks size={34} color="#fff" strokeWidth={1.8} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 10px', letterSpacing: -0.4 }}>Bem-vindos!</h2>
            <p style={{ color: S.p2, fontSize: 16, lineHeight: 1.55, margin: '0 0 36px', maxWidth: 270, marginLeft: 'auto', marginRight: 'auto' }}>
              Fotografe a lista manuscrita ou adicione os itens à mão
            </p>
            <Link href="/edit" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: S.blue, color: '#fff',
              padding: '16px 32px', borderRadius: 14,
              fontSize: 17, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,122,255,0.3)',
            }}>
              <Camera size={21} />
              Criar lista de compras
            </Link>
          </div>
        )}

        {/* ── Active list card ── */}
        {isActive && (
          <div style={{
            background: S.card, borderRadius: 16, marginBottom: 12,
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            border: '0.5px solid rgba(52,199,89,0.3)',
          }}>
            <div style={{ padding: '16px 16px 14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: S.green, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Lista ativa
              </p>
              <p style={{ margin: '0 0 10px', fontSize: 15, color: S.p2 }}>
                {totalItems === 0
                  ? 'Lista vazia'
                  : doneItems === totalItems
                    ? `${totalItems} itens — tudo encontrado`
                    : `${doneItems} de ${totalItems} itens encontrados`}
              </p>
              {totalItems > 0 && (
                <div style={{ height: 3, background: 'var(--fill-tertiary)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${(doneItems / totalItems) * 100}%`,
                    background: S.green, transition: 'width 0.4s ease',
                  }} />
                </div>
              )}
              <Link href="/shop" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: S.green, color: '#fff',
                padding: '13px', borderRadius: 12,
                fontSize: 16, fontWeight: 600, textDecoration: 'none',
              }}>
                <ShoppingCart size={18} />
                Ir ao mercado
              </Link>
            </div>
            <div style={{ borderTop: `0.5px solid ${S.sep}` }}>
              <Link href="/edit" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px', fontSize: 15, fontWeight: 500,
                color: S.blue, textDecoration: 'none',
              }}>
                Editar lista
              </Link>
            </div>
          </div>
        )}

        {/* ── Draft card ── */}
        {isDraft && (
          <div style={{
            background: S.card, borderRadius: 16, marginBottom: 12,
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            border: '0.5px solid rgba(255,149,0,0.3)',
          }}>
            <div style={{ padding: '16px 16px 14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: S.orange, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Rascunho em andamento
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 15, color: S.p2 }}>
                {totalItems === 0 ? 'Sem itens ainda' : `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}
                {' · '}{formatDate(currentList!.created_at)}
              </p>
              <Link href="/edit" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: S.orange, color: '#fff',
                padding: '13px', borderRadius: 12,
                fontSize: 16, fontWeight: 600, textDecoration: 'none',
              }}>
                Continuar editando
              </Link>
            </div>
          </div>
        )}

        {/* ── New list CTA (when not first time) ── */}
        {!isFirstTime && (
          <Link href="/edit" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: S.card, borderRadius: 14,
            padding: '14px 16px', marginBottom: 28,
            textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: S.blue, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: S.p1 }}>Nova lista</p>
              <p style={{ margin: '2px 0 0', fontSize: 14, color: S.p2 }}>Foto ou adicionar à mão</p>
            </div>
            <ChevronRight size={18} color={S.p3} style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </Link>
        )}

        {/* ── History ── */}
        {history.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: S.p3, textTransform: 'uppercase', letterSpacing: 0.6, margin: '0 4px 6px' }}>
              Listas anteriores
            </p>
            <div style={{ background: S.card, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {history.map((list, idx) => (
                <div key={list.id}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'var(--fill-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Clock size={17} color={S.p2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: S.p1 }}>
                        {list.item_count} {list.item_count === 1 ? 'item' : 'itens'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: S.p2 }}>
                        {formatDate(list.created_at)}
                      </p>
                    </div>
                    <span style={{ fontSize: 12, color: S.p3, background: 'var(--fill-tertiary)', padding: '4px 10px', borderRadius: 20, fontWeight: 500, flexShrink: 0 }}>
                      Concluída
                    </span>
                  </div>
                  {idx < history.length - 1 && <div className="list-separator" />}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </main>
  )
}
