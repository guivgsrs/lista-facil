'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Loader2, AlertCircle, X, Pencil } from 'lucide-react'
import { assignSection } from '@/lib/store-map'
import type { ListItem, PresetItem } from '@/lib/types'
import Link from 'next/link'

type DraftItem = { id: string; name: string; section: string; order_index: number; qty: number }

type PageState =
  | 'idle'
  | 'processing'
  | 'editing'
  | 'saving'
  | 'done'

export default function EditPage() {
  const [state, setState] = useState<PageState>('idle')
  const [listId, setListId] = useState<string | null>(null)
  const [items, setItems] = useState<DraftItem[]>([])
  const [presets, setPresets] = useState<PresetItem[]>([])
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [activePresets, setActivePresets] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFullscreen, setImageFullscreen] = useState(false)
  const [existingDraft, setExistingDraft] = useState<{ id: string; created_at: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const [presetsRes, listRes] = await Promise.all([
        fetch('/api/presets'),
        fetch('/api/list'),
      ])
      const presetsData = await presetsRes.json()
      const listData = await listRes.json()

      setPresets(presetsData.presets ?? [])

      if (listData.list && listData.list.status === 'draft') {
        setExistingDraft(listData.list)
      }
    }
    init().catch(console.error)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    processImage(file)
  }

  async function processImage(file: File) {
    setState('processing')
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
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
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, name, section: assignSection(name) } : i
    ))
  }

  function updateItemQty(id: string, qty: number) {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, qty: Math.max(1, qty) } : i
    ))
  }

  function togglePreset(preset: PresetItem) {
    const next = new Set(activePresets)
    if (next.has(preset.id)) {
      next.delete(preset.id)
      setItems(prev => prev.filter(i => i.id !== `preset-${preset.id}`))
    } else {
      next.add(preset.id)
      setItems(prev => [
        ...prev,
        {
          id: `preset-${preset.id}`,
          name: preset.name,
          section: preset.section,
          order_index: prev.length,
          qty: 1,
        },
      ])
    }
    setActivePresets(next)
  }

  function addManualItem() {
    if (!newItemName.trim()) return
    const name = newItemName.trim()
    setItems(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        name,
        section: assignSection(name),
        order_index: prev.length,
        qty: 1,
      },
    ])
    setNewItemName('')
    setAddingItem(false)
  }

  async function finalizeList() {
    if (items.length === 0) return
    setState('saving')

    try {
      const res = await fetch('/api/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item, i) => ({
            name: item.name,
            section: item.section,
            order_index: i,
            qty: item.qty,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const { list } = data
      await fetch('/api/list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', list_id: list.id }),
      })

      setListId(list.id)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar lista')
      setState('editing')
    }
  }

  async function continueExistingDraft() {
    if (!existingDraft) return
    const res = await fetch('/api/list')
    const data = await res.json()
    const loaded: DraftItem[] = (data.items as ListItem[]).map(item => ({
      id: item.id,
      name: item.name,
      section: item.section,
      order_index: item.order_index,
      qty: item.qty ?? 1,
    }))
    setItems(loaded)
    setListId(existingDraft.id)
    setExistingDraft(null)
    setState('editing')
  }

  function startFresh() {
    setExistingDraft(null)
    setState('idle')
  }

  // ────── RENDER ──────

  if (state === 'done') {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Lista pronta!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 17 }}>
            {items.length} itens salvos
          </p>
          <Link href="/shop"
            style={{
              display: 'block',
              background: 'var(--blue)',
              color: '#fff',
              padding: '16px 32px',
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: 12,
            }}>
            Abrir lista do mercado →
          </Link>
          <button
            onClick={() => { setState('idle'); setItems([]); setImagePreview(null); setActivePresets(new Set()) }}
            style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 17, cursor: 'pointer', padding: '12px' }}
          >
            Nova lista
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: state === 'editing' ? 100 : 24 }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--separator)',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Lista de Compras</h1>
      </header>

      {/* Fullscreen image modal */}
      {imageFullscreen && imagePreview && (
        <div
          onClick={() => setImageFullscreen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img
            src={imagePreview}
            alt="Lista original"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
          <button
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>
        {/* Error toast */}
        {error && (
          <div style={{
            background: '#FFF0F0',
            border: '1px solid #FFCDD2',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <AlertCircle size={18} color="var(--red)" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#B71C1C', fontWeight: 500 }}>{error}</p>
            </div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <X size={16} color="var(--text-secondary)" />
            </button>
          </div>
        )}

        {/* Existing draft banner */}
        {existingDraft && state === 'idle' && (
          <div style={{
            background: '#FFF8E1',
            border: '1px solid #FFE082',
            borderRadius: 14,
            padding: '16px',
            marginBottom: 16,
          }}>
            <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#5D4037' }}>
              Tem uma lista em andamento
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={continueExistingDraft}
                style={{ flex: 1, background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
              >
                Continuar
              </button>
              <button
                onClick={startFresh}
                style={{ flex: 1, background: 'var(--gray5)', color: 'var(--text-primary)', border: 'none', borderRadius: 10, padding: '10px', fontSize: 15, cursor: 'pointer' }}
              >
                Começar nova
              </button>
            </div>
          </div>
        )}

        {/* Processing state */}
        {state === 'processing' && (
          <div style={{ marginBottom: 16 }}>
            {imagePreview && (
              <img src={imagePreview} alt="Lista" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 14, marginBottom: 16 }} />
            )}
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Loader2 size={20} color="var(--blue)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Lendo a lista...</span>
              </div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: 20, marginBottom: 10, width: `${60 + i * 8}%` }} />
              ))}
            </div>
          </div>
        )}

        {/* Idle state — main CTA */}
        {state === 'idle' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              <Camera size={24} />
              Tirar foto da lista
            </button>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
              ou adicione itens abaixo
            </p>
          </>
        )}

        {/* Items list (editing state) */}
        {state === 'editing' && (
          <>
            {imagePreview && (
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setImageFullscreen(true)}
                  style={{ width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', borderRadius: 14, overflow: 'hidden', display: 'block' }}
                >
                  <img
                    src={imagePreview}
                    alt="Lista original — toque para ampliar"
                    style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }}
                  />
                </button>
              </div>
            )}

            <div style={{ background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
              {items.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Nenhum item ainda</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '4px 0 0' }}>
                    Tire uma foto ou adicione manualmente
                  </p>
                </div>
              ) : (
                [...items].sort((a, b) => a.order_index - b.order_index).map((item, idx) => {
                  const isEditing = editingId === item.id
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: isEditing ? '10px 12px' : '11px 16px',
                        borderBottom: idx < items.length - 1 ? '1px solid var(--separator)' : 'none',
                        background: isEditing ? 'var(--bg)' : undefined,
                      }}
                    >
                      {isEditing ? (
                        <>
                          {/* Qty stepper */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={() => updateItemQty(item.id, item.qty - 1)}
                              style={{ width: 28, height: 28, border: '1px solid var(--separator)', borderRadius: 6, background: 'var(--bg-card)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                            >−</button>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={e => updateItemQty(item.id, parseInt(e.target.value) || 1)}
                              min={1}
                              style={{ width: 36, border: '1px solid var(--separator)', borderRadius: 6, padding: '4px 2px', fontSize: 15, textAlign: 'center', background: 'var(--bg-card)' }}
                            />
                            <button
                              onClick={() => updateItemQty(item.id, item.qty + 1)}
                              style={{ width: 28, height: 28, border: '1px solid var(--separator)', borderRadius: 6, background: 'var(--bg-card)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}
                            >+</button>
                          </div>
                          {/* Name input */}
                          <input
                            autoFocus
                            value={item.name}
                            onChange={e => updateItemName(item.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={e => { if (e.key === 'Enter') setEditingId(null) }}
                            style={{
                              flex: 1,
                              border: '1px solid var(--separator)',
                              borderRadius: 8,
                              padding: '6px 10px',
                              fontSize: 15,
                              color: 'var(--text-primary)',
                              background: 'var(--bg-card)',
                              outline: 'none',
                            }}
                          />
                        </>
                      ) : (
                        /* Display mode */
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{
                            fontSize: 13, fontWeight: 600,
                            color: 'var(--bg-card)',
                            background: 'var(--text-secondary)',
                            borderRadius: 10,
                            padding: '1px 7px',
                            flexShrink: 0,
                          }}>
                            {item.qty}
                          </span>
                          <span style={{ fontSize: 16, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </span>
                        </div>
                      )}

                      {/* Action icons */}
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => setEditingId(isEditing ? null : item.id)}
                          style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', borderRadius: 6 }}
                        >
                          <Pencil size={17} color={isEditing ? 'var(--blue)' : 'var(--text-tertiary)'} />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', borderRadius: 6 }}
                        >
                          <Trash2 size={17} color="var(--red)" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Add item row */}
            {addingItem ? (
              <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  autoFocus
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addManualItem() }}
                  placeholder="Nome do item..."
                  style={{
                    flex: 1,
                    border: '1px solid var(--separator)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 16,
                    outline: 'none',
                    background: 'var(--bg)',
                  }}
                />
                <button
                  onClick={addManualItem}
                  style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                >
                  Add
                </button>
                <button
                  onClick={() => { setAddingItem(false); setNewItemName('') }}
                  style={{ background: 'var(--gray5)', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingItem(true)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16,
                  color: 'var(--blue)',
                  cursor: 'pointer',
                  marginBottom: 12,
                  fontWeight: 500,
                }}
              >
                <Plus size={20} />
                Adicionar item
              </button>
            )}
          </>
        )}

        {/* Presets panel */}
        {(state === 'idle' || state === 'editing') && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <button
              onClick={() => setPresetsOpen(p => !p)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>
                  Itens frequentes
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'left' }}>
                  {activePresets.size > 0 ? `${activePresets.size} selecionado(s)` : 'Toque para ativar'}
                </p>
              </div>
              {presetsOpen ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
            </button>

            {presetsOpen && (
              <div style={{ borderTop: '1px solid var(--separator)', padding: '8px 16px 12px' }}>
                {presets.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '8px 0' }}>
                    Nenhum item frequente cadastrado ainda.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 8 }}>
                    {presets.map(preset => {
                      const active = activePresets.has(preset.id)
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            if (state === 'idle') setState('editing')
                            togglePreset(preset)
                          }}
                          style={{
                            background: active ? 'var(--blue)' : 'var(--bg)',
                            color: active ? '#fff' : 'var(--text-primary)',
                            border: `1px solid ${active ? 'var(--blue)' : 'var(--separator)'}`,
                            borderRadius: 20,
                            padding: '7px 14px',
                            fontSize: 15,
                            cursor: 'pointer',
                            fontWeight: active ? 600 : 400,
                          }}
                        >
                          {preset.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar — editing/saving state */}
      {(state === 'editing' || state === 'saving') && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--separator)',
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ flex: 1, fontSize: 15, color: 'var(--text-secondary)' }}>
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
          <button
            onClick={finalizeList}
            disabled={items.length === 0}
            style={{
              background: items.length === 0 ? 'var(--gray4)' : 'var(--green)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '13px 24px',
              fontSize: 16,
              fontWeight: 600,
              cursor: items.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {state === 'saving' ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            Finalizar lista
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        :root { --gray4: #D1D1D6; }
      `}</style>
    </main>
  )
}
