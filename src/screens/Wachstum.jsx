import { useState } from 'react'
import Coach from '../components/Coach.jsx'
import GrowthChat from '../coach/GrowthChat.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { growthMessages } from '../data/coachMessages.js'

const DEFAULT_FIELDS = [
  { id: 1, name: 'Selbstvertrauen', progress: 35, color: '#2D6A4F' },
  { id: 2, name: 'Auftreten', progress: 55, color: '#8B5CF6' },
  { id: 3, name: 'Netzwerken', progress: 20, color: '#E8A838' },
]

const COLORS = ['#2D6A4F', '#8B5CF6', '#E8A838', '#3B82F6', '#EF4444', '#EC4899']

function getExercise(name) {
  const msgs = growthMessages[name] || growthMessages['default']
  return msgs[Math.floor(Math.random() * msgs.length)]
}

export default function Wachstum() {
  const [fields, setFields] = useLocalStorage('growthFields', DEFAULT_FIELDS)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [activeExercise, setActiveExercise] = useState(null)
  const [chatField, setChatField] = useState(null)

  const addField = () => {
    if (!newName.trim()) return
    setFields(prev => [...prev, {
      id: Date.now(),
      name: newName.trim(),
      progress: 0,
      color: newColor,
    }])
    setNewName('')
    setShowForm(false)
  }

  const updateProgress = (id, delta) => {
    setFields(prev => prev.map(f =>
      f.id === id ? { ...f, progress: Math.min(100, Math.max(0, f.progress + delta)) } : f
    ))
  }

  const deleteField = (id) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }

  const avgProgress = fields.length
    ? Math.round(fields.reduce((sum, f) => sum + f.progress, 0) / fields.length)
    : 0

  const coachField = fields.length > 0
    ? fields.reduce((min, f) => f.progress < min.progress ? f : min, fields[0])
    : null

  const coachMsg = coachField
    ? `Fokus auf "${coachField.name}": ${getExercise(coachField.name)}`
    : 'Lege dein erstes Wachstumsfeld an — was möchtest du in dir stärken?'

  return (
    <>
    {chatField && <GrowthChat field={chatField} onClose={() => setChatField(null)} />}
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem' }}>Wachstum</h1>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '10px 16px' }}
          onClick={() => setShowForm(s => !s)}
        >
          {showForm ? '×' : '+ Feld'}
        </button>
      </div>

      <Coach message={coachMsg} icon="↑" />

      {/* Gesamt-Fortschritt */}
      {fields.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="label" style={{ marginBottom: 0 }}>Gesamtfortschritt</span>
            <span style={{ fontFamily: 'Lora, serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>
              {avgProgress}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>
      )}

      {/* Formular */}
      {showForm && (
        <div className="card slide-up" style={{ border: '1px solid var(--green)', marginBottom: 16 }}>
          <span className="label">Neues Wachstumsfeld</span>
          <input
            className="input-field"
            placeholder="z.B. Selbstvertrauen, Netzwerken, Klarheit …"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addField()}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: c,
                  border: newColor === c ? '3px solid var(--text)' : '3px solid transparent',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>
          <button className="btn-primary" onClick={addField}>Feld anlegen</button>
        </div>
      )}

      {fields.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">↑</div>
          <p>Wähle Bereiche, in denen du wachsen willst — der Coach gibt dir Übungen dazu.</p>
        </div>
      ) : (
        fields.map(field => (
          <GrowthCard
            key={field.id}
            field={field}
            onUpdate={updateProgress}
            onDelete={deleteField}
            activeExercise={activeExercise}
            onExercise={() => setActiveExercise(activeExercise === field.id ? null : field.id)}
            onChat={() => setChatField(field)}
          />
        ))
      )}
    </div>
    </>
  )
}

function GrowthCard({ field, onUpdate, onDelete, activeExercise, onExercise, onChat }) {
  const [expanded, setExpanded] = useState(false)
  const exercise = getExercise(field.name)

  return (
    <div className="card fade-in" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: field.color,
            flexShrink: 0,
          }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{field.name}</span>
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: field.color }}>
          {field.progress}%
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: 12 }}>
        <div
          className="progress-fill"
          style={{ width: `${field.progress}%`, background: field.color }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => onUpdate(field.id, -10)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
          }}
        >
          −
        </button>
        <button
          onClick={() => onUpdate(field.id, 10)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: field.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            color: 'white',
          }}
        >
          +
        </button>
        <button
          onClick={onChat}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: `1.5px solid ${field.color}`,
            color: field.color,
            fontSize: '0.8rem',
            fontWeight: 500,
            background: 'transparent',
          }}
        >
          💡 Übung
        </button>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ color: 'var(--text-light)', padding: 4, fontSize: '1rem' }}
        >
          ···
        </button>
      </div>

      {activeExercise === field.id && (
        <div className="slide-up" style={{
          marginTop: 12,
          padding: '12px 14px',
          background: `${field.color}10`,
          borderRadius: 'var(--radius-sm)',
          borderLeft: `3px solid ${field.color}`,
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.55 }}>
            {exercise}
          </p>
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <button
            onClick={() => onDelete(field.id)}
            style={{ color: '#EF4444', fontSize: '0.8rem' }}
          >
            Feld löschen
          </button>
        </div>
      )}
    </div>
  )
}
