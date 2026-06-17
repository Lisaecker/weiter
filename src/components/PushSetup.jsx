import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = 'BHTS_r6D4smPe1VEdfl1wMRpyOWO9Qb6u1a5pN3dDUUD-Mwul5DB0RGh7ZXah6YDQdLjRj8tLr1UlzsJ36E1YCo'
const WORKER_URL = 'https://weiter-push.lisa-a-ecker.workers.dev'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function PushSetup() {
  const [status, setStatus] = useState('idle') // idle | requesting | subscribed | denied | unsupported

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') {
      setStatus('subscribed')
    } else if (Notification.permission === 'denied') {
      setStatus('denied')
    }
  }, [])

  const subscribe = async () => {
    setStatus('requesting')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await fetch(`${WORKER_URL}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })

      setStatus('subscribed')
    } catch (e) {
      console.error('Push subscribe error:', e)
      setStatus('idle')
    }
  }

  if (status === 'unsupported') return null

  if (status === 'subscribed') {
    return (
      <div className="card" style={{ border: '1px solid var(--green)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--green-pale)', border: '1px solid var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>✓</div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--green)' }}>
              Benachrichtigungen aktiv
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              08:00 Morgen-Check · 20:00 Tagesrückblick
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="card" style={{ border: '1px solid var(--border)', marginBottom: 16 }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          🔕 Benachrichtigungen blockiert. In den Browser-Einstellungen aktivieren.
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={{ border: '1px solid var(--border)', marginBottom: 16 }}>
      <span className="label">Täglich begleitet werden</span>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Morgens um 8 fragt der Coach nach deiner Energie. Abends um 20 Uhr kommt dein Rückblick — direkt aufs Handy.
      </p>
      <button
        className="btn-primary"
        onClick={subscribe}
        disabled={status === 'requesting'}
        style={{ opacity: status === 'requesting' ? 0.7 : 1 }}
      >
        {status === 'requesting' ? 'Wird eingerichtet …' : '🔔 Benachrichtigungen aktivieren'}
      </button>
    </div>
  )
}
