'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, ShoppingCart, Clock, Pencil, Loader2, Trash2, X } from 'lucide-react'

interface ListEntry {
  id: string
  status: 'draft' | 'active' | 'completed'
  created_at: string
  item_count: number
}

const S = {
  bg: 'var(--bg)', card: 'var(--bg-card)',
  blue: 'var(--blue)', green: 'var(--green)', orange: 'var(--orange)', red: 'var(--red)',
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
  const [pending, setPending] = useState<'edit' | 'shop' | null>(null)
  const router = useRouter()

  const effectiveActive = pending ?? active

  function handleNav(target: 'edit' | 'shop') {
    if (target === active) return
    setPending(target)
    setTimeout(() => router.push(target === 'edit' ? '/' : '/shop'), 200)
  }

  const segStyle = (tab: 'edit' | 'shop'): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
    borderRadius: 7, fontSize: 13,
    background: effectiveActive === tab ? 'var(--bg-elevated)' : 'transparent',
    color: effectiveActive === tab ? 'var(--label-primary)' : 'var(--label-secondary)',
    fontWeight: effectiveActive === tab ? 600 : 400,
    boxShadow: effectiveActive === tab ? '0 1px 3px rgba(0,0,0,0.18)' : 'none',
    transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  })

  return (
    <div style={{ display: 'flex', background: 'var(--fill-tertiary)', borderRadius: 9, padding: 2, gap: 2 }}>
      <button onClick={() => handleNav('edit')} style={segStyle('edit')}>
        <Pencil size={13} aria-hidden={true} />Criar
      </button>
      <button onClick={() => handleNav('shop')} style={segStyle('shop')}>
        <ShoppingCart size={13} aria-hidden={true} />Mercado
      </button>
    </div>
  )
}

function ViewfinderCorners() {
  const base: React.CSSProperties = {
    position: 'absolute', width: 20, height: 20,
    borderColor: 'rgba(255,255,255,0.32)',
  }
  return (
    <>
      <div style={{ ...base, top: 16, left: 16, borderTop: '2px solid', borderLeft: '2px solid', borderTopLeftRadius: 3 }} />
      <div style={{ ...base, top: 16, right: 16, borderTop: '2px solid', borderRight: '2px solid', borderTopRightRadius: 3 }} />
      <div style={{ ...base, bottom: 16, left: 16, borderBottom: '2px solid', borderLeft: '2px solid', borderBottomLeftRadius: 3 }} />
      <div style={{ ...base, bottom: 16, right: 16, borderBottom: '2px solid', borderRight: '2px solid', borderBottomRightRadius: 3 }} />
    </>
  )
}

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState<ListEntry[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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

  function openCamera() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setScanError(null)
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res  = await fetch('/api/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      sessionStorage.setItem('camera_items', JSON.stringify(data.items))
      router.push('/edit')
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Erro ao processar imagem')
      setScanning(false)
    }
  }

  async function deleteList(listId: string) {
    setDeleting(p => new Set(p).add(listId))
    await fetch('/api/list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_list', list_id: listId }),
    })
    setLists(p => p.filter(l => l.id !== listId))
    setDeleting(p => { const n = new Set(p); n.delete(listId); return n })
  }

  /* ── Loading ── */
  if (loading) return (
    <main style={{ minHeight: '100dvh', background: S.bg }}>
      <header className="apple-header" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center' }}>
        <div className="skeleton" style={{ height: 32, width: 160, borderRadius: 9 }} />
      </header>
      <div style={{ padding: '16px 16px 0' }}>
        <div className="skeleton" style={{ height: 32, width: 200, borderRadius: 8, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 172, borderRadius: 20, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 44, borderRadius: 14, marginBottom: 20 }} />
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Nav bar */}
      <header className="apple-header" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center' }}>
        <SegmentedControl active="edit" />
      </header>

      <div style={{ padding: '16px 16px 0' }}>

        <h1 style={{ margin: '0 0 16px', fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: S.p1 }}>
          Lista de mercado
        </h1>

        {/* Camera card — triggers camera directly */}
        <button
          onClick={openCamera}
          disabled={scanning}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(155deg, #1a1a1c 0%, #0e0e10 100%)',
            borderRadius: 20, minHeight: 172,
            padding: '24px', width: '100%',
            border: 'none', cursor: scanning ? 'default' : 'pointer',
            overflow: 'hidden', position: 'relative',
            boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
            marginBottom: 8,
          }}
        >
          <ViewfinderCorners />
          {scanning ? (
            <>
              <Loader2
                size={44}
                color="rgba(255,255,255,0.55)"
                style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }}
                aria-hidden={true}
              />
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                Lendo a lista…
              </p>
            </>
          ) : (
            <>
              <Camera size={48} color="rgba(255,255,255,0.18)" style={{ marginBottom: 14 }} aria-hidden={true} />
              <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: -0.4, textAlign: 'center' }}>
                Tirar foto da lista
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                Toque para abrir a câmera
              </p>
            </>
          )}
        </button>

        {/* Scan error */}
        {scanError && (
          <div style={{ background: 'rgba(255,59,48,0.1)', border: '0.5px solid rgba(255,59,48,0.3)', borderRadius: 12, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ flex: 1, margin: 0, fontSize: 14, color: 'var(--red)', fontWeight: 500 }}>{scanError}</p>
            <button onClick={() => setScanError(null)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
              <X size={16} color={S.p3} />
            </button>
          </div>
        )}

        {/* Manual entry */}
        <Link
          href="/edit"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: S.fill3, borderRadius: 14, padding: '13px',
            color: S.p1, textDecoration: 'none', fontSize: 15, fontWeight: 500,
            marginBottom: 20,
          }}
        >
          <Pencil size={15} aria-hidden={true} />
          Inserir manualmente
        </Link>

        {/* Lists */}
        {lists.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: S.p3, textTransform: 'uppercase', letterSpacing: 0.6, margin: '0 4px 6px' }}>
              Listas
            </p>
            <div style={{ background: S.card, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {lists.map((list, idx) => {
                const isActive  = list.status === 'active'
                const isDraft   = list.status === 'draft'
                const href = isDraft ? '/edit' : isActive ? '/shop' : '/shop'

                return (
                  <div key={list.id} style={{ opacity: deleting.has(list.id) ? 0.4 : 1, transition: 'opacity 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Link href={href} style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 12, textDecoration: 'none', color: 'inherit' }}>
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
                      </Link>
                      <button
                        onClick={() => deleteList(list.id)}
                        disabled={deleting.has(list.id)}
                        aria-label="Excluir lista"
                        style={{
                          background: 'none', border: 'none', padding: '14px 16px 14px 8px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          minHeight: 44, flexShrink: 0,
                        }}
                      >
                        <Trash2 size={16} color={S.p3} aria-hidden={true} />
                      </button>
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
