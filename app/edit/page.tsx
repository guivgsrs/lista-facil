'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Plus, Trash2, ChevronDown, ChevronUp, ChevronLeft, CheckCircle2, Loader2, AlertCircle, X, Pencil, Check } from 'lucide-react'
import { assignSection } from '@/lib/store-map'
import type { ListItem, PresetItem } from '@/lib/types'
import Link from 'next/link'

const PRESET_CATS = [
  { id: 'hortifruti',   label: '🥦 Hortifruti' },
  { id: 'acougue',      label: '🥩 Açougue' },
  { id: 'ilha_queijos', label: '🥚 Frios & Ovos' },
  { id: 'geladeiras',   label: '🧈 Laticínios' },
  { id: 'c10',          label: '☕ Bebidas' },
  { id: 'c11',          label: '🍫 Doces' },
  { id: 'c09',          label: '🍝 Massas' },
  { id: 'c08',          label: '🧂 Temperos' },
  { id: 'c07',          label: '🧽 Limpeza' },
  { id: 'c06',          label: '🧺 Roupa' },
  { id: 'c04',          label: '🧻 Higiene' },
  { id: 'sem_secao',    label: '📦 Outros' },
]

type DraftItem = { id: string; name: string; section: string; order_index: number; qty: number }
type PageState = 'idle' | 'processing' | 'editing' | 'saving' | 'done'

/* ── Tokens ── */
const S = {
  bg:        'var(--bg)',
  card:      'var(--bg-card)',
  blue:      'var(--blue)',
  green:     'var(--green)',
  red:       'var(--red)',
  orange:    'var(--orange)',
  p1:        'var(--label-primary)',
  p2:        'var(--label-secondary)',
  p3:        'var(--label-tertiary)',
  sep:       'var(--separator-inset)',
  fill2:     'var(--fill-secondary)',
  fill3:     'var(--fill-tertiary)',
  gray4:     'var(--gray4)',
  gray5:     'var(--gray5)',
}

export default function EditPage() {
  const [state, setState]             = useState<PageState>('idle')
  const [listId, setListId]           = useState<string | null>(null)
  const [items, setItems]             = useState<DraftItem[]>([])
  const [presets, setPresets]         = useState<PresetItem[]>([])
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [activePresets, setActivePresets] = useState<Set<string>>(new Set())
  const [error, setError]             = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [addingItem, setAddingItem]   = useState(false)
  const [imagePreview, setImagePreview]       = useState<string | null>(null)
  const [imageFullscreen, setImageFullscreen] = useState(false)
  const [existingDraft, setExistingDraft]     = useState<{ id: string; created_at: string } | null>(null)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const [pr, lr] = await Promise.all([fetch('/api/presets'), fetch('/api/list')])
      const pd = await pr.json()
      const ld = await lr.json()
      setPresets(pd.presets ?? [])
      if (ld.list?.status === 'draft') setExistingDraft(ld.list)
    }
    init().catch(console.error)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) processImage(f)
  }

  async function processImage(file: File) {
    setState('processing')
    setError(null)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    const fd = new FormData()
    fd.append('image', file)
    try {
      const res  = await fetch('/api/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      const detected: DraftItem[] = (data.items as Array<{ name: string; section: string; order_index: number; qty: number }>)
        .map((item, i) => ({ id: `new-${i}`, name: item.name, section: item.section, order_index: i, qty: item.qty ?? 1 }))
      setItems(detected)
      setState('editing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem')
      setState('idle')
    }
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function updateItemName(id: string, name: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, name, section: assignSection(name) } : i))
  }

  function updateItemQty(id: string, qty: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
  }

  function togglePreset(preset: PresetItem) {
    const next = new Set(activePresets)
    if (next.has(preset.id)) {
      next.delete(preset.id)
      setItems(prev => prev.filter(i => i.id !== `preset-${preset.id}`))
    } else {
      next.add(preset.id)
      setItems(prev => [...prev, { id: `preset-${preset.id}`, name: preset.name, section: preset.section, order_index: prev.length, qty: 1 }])
    }
    setActivePresets(next)
  }

  function addManualItem() {
    const name = newItemName.trim()
    if (!name) return
    setItems(prev => [...prev, { id: `manual-${Date.now()}`, name, section: assignSection(name), order_index: prev.length, qty: 1 }])
    setNewItemName('')
    setAddingItem(false)
  }

  async function finalizeList() {
    if (items.length === 0) return
    setState('saving')
    try {
      const res  = await fetch('/api/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((it, i) => ({ name: it.name, section: it.section, order_index: i, qty: it.qty })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetch('/api/list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', list_id: data.list.id }),
      })
      setListId(data.list.id)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar lista')
      setState('editing')
    }
  }

  async function continueExistingDraft() {
    if (!existingDraft) return
    const res  = await fetch('/api/list')
    const data = await res.json()
    setItems((data.items as ListItem[]).map(it => ({ id: it.id, name: it.name, section: it.section, order_index: it.order_index, qty: it.qty ?? 1 })))
    setListId(existingDraft.id)
    setExistingDraft(null)
    setState('editing')
  }

  // ── DONE ──────────────────────────────────────────────────
  if (state === 'done') return (
    <main style={{ minHeight: '100dvh', background: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: S.green, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Check size={38} color="#fff" strokeWidth={2.5} />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: -0.5, textAlign: 'center' }}>Lista pronta!</h1>
      <p style={{ color: S.p2, fontSize: 17, margin: '0 0 36px', textAlign: 'center' }}>
        {items.length} {items.length === 1 ? 'item salvo' : 'itens salvos'}
      </p>
      <Link href="/shop" style={{
        display: 'block', width: '100%', maxWidth: 320,
        background: S.blue, color: '#fff',
        padding: '17px 0', borderRadius: 14,
        fontSize: 17, fontWeight: 600, textDecoration: 'none', textAlign: 'center',
        marginBottom: 16,
      }}>
        Ir para o mercado
      </Link>
      <button
        onClick={() => { setState('idle'); setItems([]); setImagePreview(null); setActivePresets(new Set()) }}
        style={{ background: 'none', border: 'none', color: S.blue, fontSize: 17, cursor: 'pointer', padding: '10px 20px' }}
      >
        Nova lista
      </button>
    </main>
  )

  // ── MAIN ──────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', background: S.bg, paddingBottom: state === 'editing' ? 96 : 32 }}>

      {/* Header */}
      <header className="apple-header" style={{ padding: '12px 20px 14px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: S.blue, textDecoration: 'none', fontSize: 16, marginBottom: 2 }}>
          <ChevronLeft size={20} strokeWidth={2} style={{ marginLeft: -4 }} />
          Início
        </Link>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Lista de Compras</h1>
      </header>

      {/* Fullscreen image */}
      {imageFullscreen && imagePreview && (
        <div
          onClick={() => setImageFullscreen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src={imagePreview} alt="Lista" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color="#fff" />
          </div>
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(255,59,48,0.1)', border: '0.5px solid rgba(255,59,48,0.3)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={17} color={S.red} style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ flex: 1, margin: 0, fontSize: 14, color: S.red, fontWeight: 500 }}>{error}</p>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1 }}>
              <X size={15} color={S.p3} />
            </button>
          </div>
        )}

        {/* Existing draft */}
        {existingDraft && state === 'idle' && (
          <div style={{ background: 'rgba(255,149,0,0.1)', border: '0.5px solid rgba(255,149,0,0.35)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: S.orange }}>Tem uma lista em andamento</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={continueExistingDraft} style={{ flex: 1, background: S.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Continuar
              </button>
              <button onClick={() => setExistingDraft(null)} style={{ flex: 1, background: S.fill2, color: S.p1, border: 'none', borderRadius: 10, padding: '11px', fontSize: 15, cursor: 'pointer' }}>
                Começar nova
              </button>
            </div>
          </div>
        )}

        {/* Processing */}
        {state === 'processing' && (
          <div style={{ marginBottom: 16 }}>
            {imagePreview && (
              <img src={imagePreview} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 12, display: 'block' }} />
            )}
            <div style={{ background: S.card, borderRadius: 12, padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Loader2 size={19} color={S.blue} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Lendo a lista…</span>
              </div>
              {[72, 55, 80, 62, 68].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 18, marginBottom: 10, width: `${w}%` }} />
              ))}
            </div>
          </div>
        )}

        {/* Idle CTA */}
        {state === 'idle' && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', background: S.blue, color: '#fff', border: 'none',
                borderRadius: 14, height: 56,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 17, fontWeight: 600, cursor: 'pointer', marginBottom: 10,
              }}
            >
              <Camera size={22} />
              Tirar foto da lista
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: 0.5, background: S.sep }} />
              <span style={{ fontSize: 13, color: S.p3, fontWeight: 500 }}>ou</span>
              <div style={{ flex: 1, height: 0.5, background: S.sep }} />
            </div>
          </>
        )}

        {/* Editing — item list */}
        {state === 'editing' && (
          <>
            {/* Thumbnail */}
            {imagePreview && (
              <button
                onClick={() => setImageFullscreen(true)}
                style={{ width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', borderRadius: 12, overflow: 'hidden', display: 'block', marginBottom: 16 }}
              >
                <img src={imagePreview} alt="Toque para ampliar" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
              </button>
            )}

            {/* List */}
            <div className="apple-card" style={{ marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {items.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: S.p2 }}>Nenhum item ainda</p>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: S.p3 }}>Tire uma foto ou adicione manualmente</p>
                </div>
              ) : (
                [...items].sort((a, b) => a.order_index - b.order_index).map((item, idx) => {
                  const isEditing = editingId === item.id
                  const isLast = idx === items.length - 1
                  return (
                    <div key={item.id}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: isEditing ? '10px 12px' : '12px 14px',
                        minHeight: 50,
                        background: isEditing ? S.fill3 : undefined,
                      }}>
                        {isEditing ? (
                          /* Edit mode */
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                              <button
                                onClick={() => updateItemQty(item.id, item.qty - 1)}
                                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: S.fill2, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.p2, fontWeight: 300 }}
                              >−</button>
                              <span style={{ minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: 600, color: S.p1 }}>{item.qty}</span>
                              <button
                                onClick={() => updateItemQty(item.id, item.qty + 1)}
                                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: S.fill2, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.blue, fontWeight: 300 }}
                              >+</button>
                            </div>
                            <input
                              autoFocus
                              value={item.name}
                              onChange={e => updateItemName(item.id, e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') setEditingId(null) }}
                              style={{
                                flex: 1, border: 'none', background: 'none',
                                fontSize: 17, color: S.p1, outline: 'none', padding: 0,
                                caretColor: S.blue,
                              }}
                            />
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: S.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                              <Check size={15} color="#fff" strokeWidth={2.5} />
                            </button>
                          </>
                        ) : (
                          /* Display mode */
                          <>
                            {item.qty > 1 && (
                              <span style={{
                                minWidth: 24, height: 22, padding: '0 6px',
                                borderRadius: 11, background: S.blue,
                                fontSize: 12, fontWeight: 700, color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, letterSpacing: -0.2,
                              }}>
                                {item.qty}
                              </span>
                            )}
                            {item.qty === 1 && (
                              <span style={{
                                minWidth: 24, height: 22, padding: '0 6px',
                                borderRadius: 11, background: S.fill2,
                                fontSize: 12, fontWeight: 600, color: S.p3,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                1
                              </span>
                            )}
                            <span style={{ flex: 1, fontSize: 17, color: S.p1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </span>
                          </>
                        )}

                        {!isEditing && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                            <button
                              onClick={() => setEditingId(item.id)}
                              style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: S.p3, display: 'flex' }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: S.red, display: 'flex' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      {!isLast && <div className="list-separator" />}
                    </div>
                  )
                })
              )}
            </div>

            {/* Add item */}
            {addingItem ? (
              <div style={{ background: S.card, borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <input
                  autoFocus
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addManualItem() }}
                  placeholder="Nome do item…"
                  style={{ flex: 1, border: 'none', background: 'none', fontSize: 17, outline: 'none', padding: 0, caretColor: S.blue }}
                />
                <button onClick={addManualItem} style={{ background: S.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  Ok
                </button>
                <button onClick={() => { setAddingItem(false); setNewItemName('') }} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', flexShrink: 0, display: 'flex' }}>
                  <X size={18} color={S.p3} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingItem(true)}
                style={{
                  width: '100%', background: S.card, border: 'none', borderRadius: 12,
                  padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 17, color: S.blue, cursor: 'pointer', marginBottom: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: S.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={16} color="#fff" strokeWidth={2.5} />
                </div>
                <span style={{ fontWeight: 500 }}>Novo item</span>
              </button>
            )}
          </>
        )}

        {/* Presets */}
        {(state === 'idle' || state === 'editing') && (() => {
          const grouped = PRESET_CATS
            .map(cat => ({ ...cat, items: presets.filter(p => p.section === cat.id) }))
            .filter(cat => cat.items.length > 0)
          return (
            <div style={{ background: S.card, borderRadius: 12, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <button
                onClick={() => setPresetsOpen(p => !p)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}
              >
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: S.p1 }}>Itens frequentes</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: S.p2 }}>
                    {activePresets.size > 0 ? `${activePresets.size} selecionado${activePresets.size > 1 ? 's' : ''}` : 'Toque para selecionar'}
                  </p>
                </div>
                {presetsOpen ? <ChevronUp size={18} color={S.p3} /> : <ChevronDown size={18} color={S.p3} />}
              </button>

              {presetsOpen && (
                <div style={{ borderTop: `0.5px solid ${S.sep}`, padding: '12px 16px 16px' }}>
                  {grouped.length === 0
                    ? <p style={{ fontSize: 14, color: S.p2, margin: '8px 0' }}>Nenhum item frequente cadastrado.</p>
                    : grouped.map(cat => (
                      <div key={cat.id} style={{ marginBottom: 14 }}>
                        <p style={{ margin: '0 0 7px', fontSize: 12, fontWeight: 600, color: S.p3, letterSpacing: 0.2 }}>
                          {cat.label}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          {cat.items.map(preset => {
                            const active = activePresets.has(preset.id)
                            return (
                              <button
                                key={preset.id}
                                onClick={() => { if (state === 'idle') setState('editing'); togglePreset(preset) }}
                                style={{
                                  background: active ? S.blue : S.fill3,
                                  color: active ? '#fff' : S.p1,
                                  border: 'none', borderRadius: 20,
                                  padding: '7px 14px', fontSize: 15,
                                  cursor: 'pointer', fontWeight: active ? 600 : 400,
                                  transition: 'background 0.15s ease, color 0.15s ease',
                                }}
                              >
                                {preset.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Bottom bar */}
      {(state === 'editing' || state === 'saving') && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderTop: `0.5px solid ${S.sep}`,
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: S.p2 }}>
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
          <button
            onClick={finalizeList}
            disabled={items.length === 0 || state === 'saving'}
            style={{
              background: items.length === 0 ? S.fill2 : S.green,
              color: items.length === 0 ? S.p3 : '#fff',
              border: 'none', borderRadius: 12,
              padding: '13px 22px', fontSize: 16, fontWeight: 600,
              cursor: items.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.2s ease',
            }}
          >
            {state === 'saving'
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : <CheckCircle2 size={18} />
            }
            Finalizar lista
          </button>
        </div>
      )}
    </main>
  )
}
