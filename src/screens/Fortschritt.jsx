import { useState } from 'react'
import Coach from '../components/Coach.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

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

      {/* Milestones */}
      <div className="card">
        <span className="label">Deine Meilensteine</span>
        {[
          { done: loggedDays >= 1, text: 'Erster Check-in gemacht' },
          { done: loggedDays >= 3, text: '3 Tage in Folge eingecheckt' },
          { done: jobs.length >= 1, text: 'Ersten Job im Tracker' },
          { done: jobs.some(j => j.status === 'gespräch'), text: 'Ins Gespräch gekommen' },
          { done: jobs.some(j => j.status === 'final'), text: 'In der Finalrunde' },
          { done: growthFields.length >= 1, text: 'Wachstumsfeld angelegt' },
          { done: ideas.length >= 5, text: '5 Ideen gesammelt' },
          { done: completedIdeas >= 1, text: 'Erste Idee erlebt' },
        ].map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 0',
            borderBottom: '1px solid var(--border)',
            opacity: m.done ? 1 : 0.45,
          }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: m.done ? 'var(--green)' : 'var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: 'white',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}>
              {m.done ? '✓' : '○'}
            </div>
            <span style={{ fontSize: '0.875rem', color: m.done ? 'var(--text)' : 'var(--text-muted)' }}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
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
