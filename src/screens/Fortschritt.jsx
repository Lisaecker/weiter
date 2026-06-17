import { useState } from 'react'
import Coach from '../components/Coach.jsx'
import PushSetup from '../components/PushSetup.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { generateSyncCode } from '../components/Onboarding.jsx'

const SITUATION_ICONS = {
  'job-weg':    '🔄',
  'raus':       '🚪',
  'elternzeit': '🌿',
  'pause':      '⏸',
  'erstmal':    '✨',
}

const ENERGY_EMOJIS = { 1: '😴', 2: '😕', 3: '😐', 4: '🙂', 5: '⚡' }
const ENERGY_LABELS = { 1: 'Erschöpft', 2: 'Müde', 3: 'OK', 4: 'Gut', 5: 'Energievoll' }

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })
}

export default function Fortschritt() {
  const [energyLog] = useLocalStorage('energyLog', {})
  const [jobs] = useLocalStorage('jobs', [])
  const [ideas] = useLocalStorage('ideas', [])
  const [growthFields] = useLocalStorage('growthFields', [])

  const last7 = getLast7Days()
  const loggedDays = last7.filter(d => energyLog[d]).length
  const avgEnergy = loggedDays > 0
    ? (last7.reduce((sum, d) => sum + (energyLog[d] || 0), 0) / loggedDays).toFixed(1)
    : null

  const activeJobs = jobs.filter(j => j.status !== 'absage').length
  const completedIdeas = ideas.filter(i => i.done).length
  const avgGrowth = growthFields.length
    ? Math.round(growthFields.reduce((s, f) => s + f.progress, 0) / growthFields.length)
    : 0

  const coachMessages = [
    `Du hast in den letzten 7 Tagen an ${loggedDays} Tagen eingecheckt. ${loggedDays >= 5 ? 'Das ist Kontinuität — der wichtigste Faktor.' : 'Jeden Tag einchecken hilft dir, Muster zu erkennen.'}`,
    activeJobs > 0
      ? `${activeJobs} aktive Job${activeJobs > 1 ? 's' : ''} in deiner Pipeline. Du bist im Spiel.`
      : 'Trag deinen ersten Job ein — jeder Anfang zählt.',
    avgGrowth > 0
      ? `Dein Wachstumsdurchschnitt liegt bei ${avgGrowth}%. Wachstum passiert leise — bis du zurückschaust.`
      : 'Lege Wachstumsfelder an, um deinen Fortschritt sichtbar zu machen.',
  ]
  const coachMsg = coachMessages[Math.floor(Math.random() * coachMessages.length)]

  return (
    <div className="screen">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Dein Fortschritt</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Was du schon geschafft hast
        </p>
      </div>

      <Coach message={coachMsg} icon="◎" />

      {/* Stats-Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard
          value={loggedDays}
          label="Tage eingecheckt"
          sub="letzte 7 Tage"
          color="var(--green)"
          icon="📅"
        />
        <StatCard
          value={activeJobs}
          label="Aktive Jobs"
          sub="in Pipeline"
          color="#8B5CF6"
          icon="⌖"
        />
        <StatCard
          value={completedIdeas}
          label="Ideen erlebt"
          sub="abgehakt"
          color="var(--amber)"
          icon="✦"
        />
        <StatCard
          value={`${avgGrowth}%`}
          label="Wachstum"
          sub="Ø über alle Felder"
          color="#3B82F6"
          icon="↑"
        />
      </div>

      {/* Energie-Verlauf */}
      <div className="card">
        <span className="label">Energieverlauf — 7 Tage</span>
        {avgEnergy && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Ø {avgEnergy} · {ENERGY_EMOJIS[Math.round(Number(avgEnergy))]} {ENERGY_LABELS[Math.round(Number(avgEnergy))]}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {last7.map(day => {
            const e = energyLog[day] || 0
            const isToday = day === new Date().toISOString().slice(0, 10)
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%',
                  height: e ? `${(e / 5) * 56}px` : '4px',
                  background: e
                    ? (isToday ? 'var(--green)' : 'var(--green-light)')
                    : 'var(--border)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.4s ease',
                  minHeight: 4,
                }} />
                <span style={{ fontSize: '0.6rem', color: 'var(--text-light)', textAlign: 'center' }}>
                  {formatDate(day).split(' ')[0]}
                </span>
                {e > 0 && (
                  <span style={{ fontSize: '0.7rem' }}>{ENERGY_EMOJIS[e]}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Profil */}
      <ProfileCard />

      {/* Push-Benachrichtigungen */}
      <PushSetup />

      {/* Sync-Code */}
      <SyncCard />
    </div>
  )
}

function ProfileCard() {
  const [showConfirm, setShowConfirm] = useState(false)

  const raw = localStorage.getItem('userProfile')
  const profile = raw ? JSON.parse(raw) : null

  if (!profile) return null

  const reset = () => {
    localStorage.removeItem('userProfile')
    window.location.reload()
  }

  return (
    <div className="card" style={{ border: '1px solid var(--border)' }}>
      <span className="label">Mein Profil</span>

      {/* Situation + Gefühl */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, marginTop: 8 }}>
        <span style={{
          fontSize: '0.82rem', padding: '5px 12px', borderRadius: '100px',
          background: 'var(--green-pale)', color: 'var(--green)', fontWeight: 500,
        }}>
          {SITUATION_ICONS[profile.situation]} {profile.situationLabel}
        </span>
        <span style={{
          fontSize: '0.82rem', padding: '5px 12px', borderRadius: '100px',
          background: 'var(--bg)', color: 'var(--text-muted)',
          border: '1px solid var(--border)',
        }}>
          {profile.feelingEmoji} {profile.feelingLabel}
        </span>
      </div>

      {/* Fragen & Antworten */}
      {profile.questions?.map((q, i) => (
        profile.answers?.[i] ? (
          <div key={i} style={{ marginBottom: 12 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3, lineHeight: 1.4 }}>
              {q}
            </p>
            <p style={{
              fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5,
              padding: '8px 12px', background: 'var(--bg)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            }}>
              {profile.answers[i]}
            </p>
          </div>
        ) : null
      ))}

      {/* Seit wann dabei */}
      {profile.completedAt && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: 14, marginTop: 4 }}>
          Dabei seit {new Date(profile.completedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}

      {/* Reset */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            padding: '9px 16px', borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--border)', color: 'var(--text-muted)',
            fontSize: '0.82rem', width: '100%', background: 'transparent',
          }}
        >
          Profil aktualisieren
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={reset}
            style={{
              flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
              background: '#EF4444', color: 'white',
              fontSize: '0.82rem', fontWeight: 500,
            }}
          >
            Ja, neu starten
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            style={{
              flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border)', color: 'var(--text-muted)',
              fontSize: '0.82rem', background: 'transparent',
            }}
          >
            Abbrechen
          </button>
        </div>
      )}
    </div>
  )
}

function SyncCard() {
  const [code, setCode] = useState(null)
  const [copied, setCopied] = useState(false)

  const generate = () => setCode(generateSyncCode())

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="card" style={{ border: '1px solid var(--border)' }}>
      <span className="label">Geräte synchronisieren</span>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Erzeuge einen Code und gib ihn auf einem anderen Gerät beim Start ein — alle Daten werden übertragen.
      </p>
      {!code ? (
        <button
          onClick={generate}
          style={{
            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--green)', color: 'var(--green)',
            fontSize: '0.875rem', fontWeight: 500, width: '100%',
            background: 'transparent',
          }}
        >
          Sync-Code erzeugen
        </button>
      ) : (
        <div>
          <div style={{
            background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
            padding: '10px 12px', marginBottom: 10,
            fontSize: '0.7rem', color: 'var(--text-muted)',
            wordBreak: 'break-all', lineHeight: 1.6,
            border: '1px solid var(--border)',
            maxHeight: 80, overflowY: 'auto',
          }}>
            {code}
          </div>
          <button
            onClick={copy}
            className="btn-primary"
            style={{ background: copied ? 'var(--green-light)' : 'var(--green)' }}
          >
            {copied ? '✓ Kopiert!' : 'Code kopieren'}
          </button>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 8, lineHeight: 1.5 }}>
            Code auf neuem Gerät beim Start eingeben. Enthält alle deine aktuellen Daten.
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({ value, label, sub, color, icon }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: 'Lora, serif', fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{sub}</div>
    </div>
  )
}
