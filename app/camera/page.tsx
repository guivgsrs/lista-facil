'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, Pencil } from 'lucide-react'
import Link from 'next/link'

type State = 'idle' | 'processing'

function ViewfinderCorners() {
  const base: React.CSSProperties = {
    position: 'absolute', width: 24, height: 24,
    borderColor: 'rgba(255,255,255,0.5)',
  }
  return (
    <>
      <div style={{ ...base, top: 0, left: 0, borderTop: '2.5px solid', borderLeft: '2.5px solid', borderTopLeftRadius: 4 }} />
      <div style={{ ...base, top: 0, right: 0, borderTop: '2.5px solid', borderRight: '2.5px solid', borderTopRightRadius: 4 }} />
      <div style={{ ...base, bottom: 0, left: 0, borderBottom: '2.5px solid', borderLeft: '2.5px solid', borderBottomLeftRadius: 4 }} />
      <div style={{ ...base, bottom: 0, right: 0, borderBottom: '2.5px solid', borderRight: '2.5px solid', borderBottomRightRadius: 4 }} />
    </>
  )
}

export default function CameraPage() {
  const [state, setState] = useState<State>('idle')
  const [error, setError]   = useState<string | null>(null)
  const fileInputRef        = useRef<HTMLInputElement>(null)
  const router              = useRouter()

  function openCamera() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setState('processing')
    setError(null)
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res  = await fetch('/api/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      sessionStorage.setItem('camera_items', JSON.stringify(data.items))
      router.push('/edit')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem')
      setState('idle')
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Topo: botão voltar */}
      <div style={{ padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))', position: 'relative', zIndex: 10 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#fff', textDecoration: 'none', fontSize: 16 }}>
          <ChevronLeft size={20} strokeWidth={2} style={{ marginLeft: -4 }} />
          Início
        </Link>
      </div>

      {/* Área principal — toque para abrir câmera */}
      <button
        onClick={openCamera}
        disabled={state === 'processing'}
        aria-label="Abrir câmera"
        style={{
          flex: 1, background: 'none', border: 'none', cursor: state === 'processing' ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 20, padding: '0 48px', position: 'relative',
        }}
      >
        {state === 'processing' ? (
          <>
            <Loader2
              size={52}
              color="rgba(255,255,255,0.55)"
              style={{ animation: 'spin 1s linear infinite' }}
              aria-hidden={true}
            />
            <p style={{ margin: 0, fontSize: 17, color: 'rgba(255,255,255,0.55)', fontWeight: 500, textAlign: 'center' }}>
              Lendo a lista…
            </p>
          </>
        ) : (
          <>
            {/* Viewfinder box */}
            <div style={{ position: 'relative', width: 200, height: 160 }}>
              <ViewfinderCorners />
            </div>
            <p style={{ margin: 0, fontSize: 17, color: 'rgba(255,255,255,0.55)', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
              Toque para fotografar<br />a lista manuscrita
            </p>
          </>
        )}
      </button>

      {/* Erro */}
      {error && (
        <div style={{ margin: '0 16px 12px', padding: '12px 16px', background: 'rgba(255,59,48,0.18)', borderRadius: 12 }}>
          <p style={{ margin: 0, color: '#ff453a', fontSize: 14, fontWeight: 500 }}>{error}</p>
        </div>
      )}

      {/* Botão manual — fundo estilo glass, igual à referência do banco */}
      <div style={{ padding: '16px 20px', paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}>
        <Link
          href="/edit"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(255,255,255,0.14)',
            borderRadius: 14, padding: '17px',
            color: '#fff', textDecoration: 'none',
            fontSize: 15, fontWeight: 700,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}
        >
          <Pencil size={16} aria-hidden={true} />
          Inserir manualmente
        </Link>
      </div>

    </main>
  )
}
