import { useState } from 'react'
import PushSetup from '../components/PushSetup.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { generateSyncCode } from '../components/Onboarding.jsx'

const ENERGY_EMOJIS = { 1: '😴', 2: '😕', 3: '😐', 4: '🙂', 5: '⚡' }
const ENERGY_LABELS = { 1: 'Erschöpft', 2: 'Müde', 3: 'OK', 4: 'Gut', 5: 'Energievoll' }

function getBerlinDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
}

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(d))
  }
  return days
}

function formatDate(str) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Berlin',
  }).format(new Date(str))
}

function StatCard({ value, label, sub, color, icon }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color, fontFamily: 'Lora, serif' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function ProfileCard() {
  const [showConfirm, setShowConfirm] = useState(false)
  const raw = localStorage.getItem('userProfile')
  const profile = raw ? JSON.parse(raw) : null
  if (!profile) return null

  const SITUATION_ICONS = {
    'job-weg': '🔄', 'raus': '🚪', 'elternzeit': '🌿', 'pause': '⏸', 'erstmal': '✨',
  }

  const completedDate = profile.completedAt
    ? new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.completedAt))
    : null

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #2D6A4F, #1B4332)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          {profile.feelingEmoji || '🌱'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {SITUATION_ICONS[profile.situation] || '✦'} {profile.situationLabel}
          </div>
          {completedDate && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Seit {completedDate}
            </div>
          )}
        </div>
      </div>

      {profile.answers?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {profile.questions?.map((q, i) => profile.answers?.[i] ? (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3 }}>{q}</div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{profile.answers[i]}</div>
            </div>
          ) : null)}
        </div>
      )}

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}
        >
          Profil aktualisieren
        </button>
      ) : (
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
          <p style={{ fontSize: '0.82rem', marginBottom: 12, lineHeight: 1.5 }}>
            Dein Profil wird zurückgesetzt und du gehst durch das Onboarding. Deine Tageseinträge bleiben erhalten.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, fontSize: '0.82rem', padding: '10px 0' }}
              onClick={() => { localStorage.removeItem('userProfile'); window.location.reload() }}>
              Ja, neu starten
            </button>
            <button style={{ flex: 1, fontSize: '0.82rem', padding: '10px 0', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setShowConfirm(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SyncCard() {
  const [code, setCode] = useState(null)
  const [importCode, setImportCode] = useState('')
  const [mode, setMode] = useState(null)

  const generateCode = () => {
    const allData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      allData[key] = localStorage.getItem(key)
    }
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(allData))))
    setCode(encoded)
    setMode('export')
  }

  const importData = () => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(importCode.trim()))))
      Object.entries(decoded).forEach(([k, v]) => localStorage.setItem(k, v))
      window.location.reload()
    } catch {
      alert('Ungültiger Code')
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <span className="label">Gerät wechseln</span>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Übertrage deine Daten auf ein anderes Gerät.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: mode ? 16 : 0 }}>
        <button
          onClick={generateCode}
          style={{ flex: 1, padding: '10px 0', border: '1.5px solid var(--green)', color: 'var(--green)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600 }}
        >
          Code erstellen
        </button>
        <button
          onClick={() => setMode('import')}
          style={{ flex: 1, padding: '10px 0', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}
        >
          Code eingeben
        </button>
      </div>

      {mode === 'export' && code && (
        <div>
          <textarea
            readOnly value={code} rows={3}
            className="input-field"
            style={{ fontSize: '0.65rem', wordBreak: 'break-all', resize: 'none' }}
            onClick={e => e.target.select()}
          />
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Diesen Code auf dem anderen Gerät eingeben.
          </p>
        </div>
      )}
      {mode === 'import' && (
        <div>
          <textarea
            className="input-field" rows={3} placeholder="Code hier einfügen …"
            value={importCode} onChange={e => setImportCode(e.target.value)}
            style={{ resize: 'none', marginBottom: 8 }}
          />
          <button className="btn-primary" onClick={importData} disabled={!importCode.trim()}>
            Importieren
          </button>
        </div>
      )}
    </div>
  )
}

export default function Verlauf() {
  const [energyLog] = useLocalStorage('energyLog', {})
  const [taskLog] = useLocalStorage('taskLog', {})
  const [interviews] = useLocalStorage('interviews', [])
  const today = getBerlinDate()
  const last7 = getLast7Days()

  const loggedDays = last7.filter(d => energyLog[d]).length
  const completedTasks = Object.values(taskLog).flat().filter(t => t.done).length
  const totalInterviews = interviews.filter(iv => iv.status === 'done').length

  const energyValues = last7.map(d => energyLog[d]?.level ?? energyLog[d] ?? 0).filter(Boolean)
  const avgEnergy = energyValues.length > 0
    ? (energyValues.reduce((a, b) => a + b, 0) / energyValues.length).toFixed(1)
    : null

  return (
    <div className="screen">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Dein Verlauf</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Was du schon geschafft hast</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard value={loggedDays} label="Tage" sub="eingecheckt" color="var(--green)" icon="📅" />
        <StatCard value={completedTasks} label="Aufgaben" sub="erledigt" color="#8B5CF6" icon="✓" />
        <StatCard value={totalInterviews} label="Interviews" sub="geführt" color="var(--amber)" icon="⌖" />
      </div>

      {/* Energie-Verlauf */}
      <div className="card" style={{ marginBottom: 16 }}>
        <span className="label">Energie — letzte 7 Tage</span>
        {avgEnergy && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Ø {avgEnergy} · {ENERGY_EMOJIS[Math.round(Number(avgEnergy))]} {ENERGY_LABELS[Math.round(Number(avgEnergy))]}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {last7.map(day => {
            const entry = energyLog[day]
            const e = entry?.level ?? entry ?? 0
            const isToday = day === today
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', height: e ? `${(e / 5) * 56}px` : '4px',
                  background: e ? (isToday ? 'var(--green)' : 'var(--green-light)') : 'var(--border)',
                  borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease', minHeight: 4,
                }} />
                <span style={{ fontSize: '0.6rem', color: 'var(--text-light)', textAlign: 'center' }}>
                  {formatDate(day).split(' ')[0]}
                </span>
                {e > 0 && <span style={{ fontSize: '0.7rem' }}>{ENERGY_EMOJIS[e]}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Interview-Verlauf */}
      {interviews.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <span className="label">Interviews</span>
          {interviews
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map(iv => (
              <div key={iv.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{iv.company}</div>
                  {iv.role && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{iv.role}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(iv.date).toLocaleDateString('de-DE')}
                  </div>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    color: iv.status === 'done' ? 'var(--green)' : 'var(--amber)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {iv.status === 'done' ? 'Geführt' : 'Geplant'}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      <ProfileCard />
      <PushSetup />
      <SyncCard />
    </div>
  )
}
