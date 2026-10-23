'use client'

import { useEffect, useState } from 'react'

type Phase = 'waking' | 'waiting'

function RestoreOverlay({ phase }: { phase: Phase }) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'var(--blue)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, fontSize: 34,
      }}>
        ☁️
      </div>
      <h2 style={{
        fontSize: 22, fontWeight: 700, margin: '0 0 10px',
        letterSpacing: -0.4, textAlign: 'center',
        color: 'var(--label-primary)',
      }}>
        Acordando o banco de dados
      </h2>
      <p style={{
        fontSize: 15, color: 'var(--label-secondary)',
        textAlign: 'center', lineHeight: 1.55,
        margin: '0 0 8px', maxWidth: 280,
      }}>
        {phase === 'waking'
          ? `Enviando sinal de restauração${dots}`
          : `Aguardando Supabase restaurar${dots}`
        }
      </p>
      <p style={{ fontSize: 13, color: 'var(--label-tertiary)', textAlign: 'center', margin: 0 }}>
        Isso leva cerca de 1 minuto. O app abre automaticamente.
      </p>
    </div>
  )
}

export default function SupabaseGuard({ children }: { children: React.ReactNode }) {
  const [overlay, setOverlay] = useState<Phase | null>(null)

  useEffect(() => {
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout>

    async function check(): Promise<boolean> {
      try {
        const res = await fetch('/api/health')
        const data = await res.json() as { status: string }
        return data.status === 'ok'
      } catch {
        return false
      }
    }

    async function poll() {
      if (cancelled) return
      const ok = await check()
      if (ok) {
        setOverlay(null)
      } else {
        pollTimer = setTimeout(poll, 6000)
      }
    }

    async function init() {
      const ok = await check()
      if (cancelled || ok) return

      // Supabase está pausado — acorda
      setOverlay('waking')
      try {
        await fetch('/api/wake', { method: 'POST' })
      } catch { /* ignora — poll vai detectar quando voltar */ }

      if (cancelled) return
      setOverlay('waiting')
      poll()
    }

    init()
    return () => {
      cancelled = true
      clearTimeout(pollTimer)
    }
  }, [])

  return (
    <>
      {children}
      {overlay && <RestoreOverlay phase={overlay} />}
    </>
  )
}
