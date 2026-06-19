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

function AddInterviewModal({ onSave, onClose }) {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('upcoming')

  const save = () => {
    if (!company.trim() || !date) return
    onSave({ id: Date.now(), company: company.trim(), role: role.trim(), date, status })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 430, margin: '0 auto',
        background: 'var(--bg)', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 40px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Interview eintragen</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Unternehmen *</label>
          <input className="input-field" placeholder="z.B. Siemens" value={company}
            onChange={e => setCompany(e.target.value)} autoFocus />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Rolle (optional)</label>
          <input className="input-field" placeholder="z.B. Head of Customer Success"
            value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Datum *</label>
          <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['upcoming', 'Geplant'], ['done', 'Geführt']].map(([val, label]) => (
              <button key={val} onClick={() => setStatus(val)} style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                border: `1.5px solid ${status === val ? 'var(--green)' : 'var(--border)'}`,
                color: status === val ? 'var(--green)' : 'var(--text-muted)',
                fontWeight: status === val ? 600 : 400,
              }}>{label}</button>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={save}
          disabled={!company.trim() || !date}
          style={{ opacity: !company.trim() || !date ? 0.5 : 1 }}>
          Speichern
        </button>
      </div>
    </div>
  )
}

export default function Verlauf() {
  const [energyLog] = useLocalStorage('energyLog', {})
  const [taskLog] = useLocalStorage('taskLog', {})
  const [interviews, setInterviews] = useLocalStorage('interviews', [])
  const [showAddInterview, setShowAddInterview] = useState(false)
  const today = getBerlinDate()
  const last7 = getLast7Days()

  // Profil-Daten
  const profile = (() => { try { return JSON.parse(localStorage.getItem('userProfile') || '{}') } catch { return {} } })()
  const nichtVerlieren = profile.answers?.[1] || ''

  const completedTasks = Object.values(taskLog).flat().filter(t => t.done).length
  const totalInterviews = interviews.filter(iv => iv.status === 'done').length

  // Auto-Tracking Daten
  const trackingData = last7.map(d => {
    try { return { date: d, ...JSON.parse(localStorage.getItem(`tracking_${d}`) || '{}') } } catch { return { date: d } }
  })
  const totalBewerbungen = trackingData.reduce((s, d) => s + (d.bewerbungen || 0), 0)
  const sportDays = trackingData.filter(d => d.sport).length

  const energyValues = last7.map(d => energyLog[d]?.level ?? energyLog[d] ?? 0).filter(Boolean)
  const avgEnergy = energyValues.length > 0
    ? (energyValues.reduce((a, b) => a + b, 0) / energyValues.length).toFixed(1)
    : null

  // Woche ist Freitag–Sonntag
  const dayOfWeek = new Date().getDay()
  const isEndOfWeek = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Dein Verlauf</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Was du schon geschafft hast</p>
        </div>
        <button
          onClick={() => setShowAddInterview(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: '100px',
            border: '1.5px solid var(--border)', background: 'var(--bg)',
            fontSize: '0.78rem', color: 'var(--text-muted)',
          }}
        ><span>⌖</span> Interview</button>
      </div>

      {/* Wochenrückblick Coach (Fr–So) */}
      {isEndOfWeek && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--green)' }}>
          <span className="label" style={{ color: 'var(--green)' }}>Wochenrückblick</span>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, marginTop: 8, color: 'var(--text-muted)' }}>
            Diese Woche: {totalBewerbungen > 0 ? `${totalBewerbungen} Bewerbung${totalBewerbungen > 1 ? 'en' : ''}` : 'keine Bewerbungen'}, {sportDays > 0 ? `${sportDays}× Sport` : 'kein Sport'}, {totalInterviews} Interview{totalInterviews !== 1 ? 's' : ''} geführt.
            {avgEnergy ? ` Energie im Schnitt: ${ENERGY_LABELS[Math.round(Number(avgEnergy))]}.` : ''}
          </p>
        </div>
      )}

      {/* Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard value={completedTasks} label="Aufgaben" sub="erledigt" color="#8B5CF6" icon="✓" />
        <StatCard value={totalBewerbungen} label="Bewerbungen" sub="diese Woche" color="#0EA5E9" icon="📨" />
        <StatCard
          value={sportDays}
          label={nichtVerlieren ? nichtVerlieren.split(' ').slice(0, 2).join(' ') : 'Sport'}
          sub="diese Woche"
          color="#F97316"
          icon="🏃"
        />
      </div>

      {/* Aktivitäts-Timeline */}
      <div className="card" style={{ marginBottom: 16 }}>
        <span className="label">Aktivitäten — letzte 7 Tage</span>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {last7.map(day => {
            const td = trackingData.find(d => d.date === day) || {}
            const energy = energyLog[day]?.level ?? energyLog[day] ?? 0
            const hasActivity = td.sport || (td.bewerbungen > 0) || energy > 0
            if (!hasActivity) return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.35 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 28 }}>{formatDate(day).split(' ')[0]}</span>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
              </div>
            )
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>
                  {formatDate(day).split(' ')[0]}
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {energy > 0 && (
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 8px', borderRadius: 100,
                      background: 'var(--green-pale)', color: 'var(--green)',
                    }}>{ENERGY_EMOJIS[energy]} {ENERGY_LABELS[energy]}</span>
                  )}
                  {td.sport && (
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 8px', borderRadius: 100,
                      background: '#FFF7ED', color: '#F97316',
                    }}>🏃 Sport</span>
                  )}
                  {td.bewerbungen > 0 && (
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 8px', borderRadius: 100,
                      background: '#F0F9FF', color: '#0EA5E9',
                    }}>📨 {td.bewerbungen} Bewerbung{td.bewerbungen > 1 ? 'en' : ''}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Energie-Chart */}
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

      {/* Interviews */}
      <div className="card" style={{ marginBottom: 16 }}>
        <span className="label">Interviews</span>
        {interviews.length === 0 && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>Noch keine Interviews eingetragen.</p>
        )}
        {interviews
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
          .map(iv => (
            <div key={iv.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{iv.company}</div>
                {iv.role && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{iv.role}</div>}
              </div>
              <div style={{ textAlign: 'right', marginRight: 8 }}>
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
              <button
                onClick={() => setInterviews(prev => prev.filter(i => i.id !== iv.id))}
                style={{ color: 'var(--text-light)', fontSize: '1.1rem', padding: '0 4px', flexShrink: 0 }}
              >×</button>
            </div>
          ))}
      </div>

      <ProfileCard />
      <PushSetup />
      <SyncCard />

      {showAddInterview && (
        <AddInterviewModal
          onSave={iv => setInterviews(prev => [...prev, iv])}
          onClose={() => setShowAddInterview(false)}
        />
      )}
    </div>
  )
}
