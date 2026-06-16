import { useState } from 'react'
import Coach from '../components/Coach.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { ideaCoachMessages } from '../data/coachMessages.js'

export const CATEGORIES = [
  { id: 'alle',       label: 'Alle',        icon: '✦' },
  { id: 'pause',      label: 'Pause',       icon: '☕' },
  { id: 'inspiration',label: 'Inspiration', icon: '💡' },
  { id: 'reflexion',  label: 'Reflexion',   icon: '🪞' },
  { id: 'motivation', label: 'Motivation',  icon: '🔥' },
  { id: 'lernen',     label: 'Lernen',      icon: '📚' },
  { id: 'erleben',    label: 'Erleben',     icon: '🌍' },
  { id: 'genuss',     label: 'Genuss',      icon: '🍋' },
  { id: 'persönlich', label: 'Persönlich',  icon: '🌱' },
]

export const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[1]

export default function Ideen() {
  const [ideas, setIdeas] = useLocalStorage('ideas', [
    { id: 1, text: 'Kraulen lernen', category: 'erleben', date: new Date().toISOString().slice(0,10), done: false },
    { id: 2, text: 'Lemon Tart perfektionieren', category: 'genuss', date: new Date().toISOString().slice(0,10), done: false },
  ])
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('inspiration')
  const [filter, setFilter] = useState('alle')
  const [coachMsg] = useState(
    ideaCoachMessages[Math.floor(Math.random() * ideaCoachMessages.length)]
  )

  const addIdea = () => {
    if (!input.trim()) return
    setIdeas(prev => [{
      id: Date.now(),
      text: input.trim(),
      category,
      date: new Date().toISOString().slice(0, 10),
      done: false,
    }, ...prev])
    setInput('')
  }

  const updateIdea = (id, patch) => setIdeas(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  const deleteIdea = (id) => setIdeas(prev => prev.filter(i => i.id !== id))

  const filtered = filter === 'alle' ? ideas : ideas.filter(i => i.category === filter)

  return (
    <div className="screen">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Ideen & so</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Impulse, Wünsche, Pausen, Motivation
        </p>
      </div>

      <Coach message={coachMsg} icon="✦" />

      {/* Quick-Input */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            className="input-field"
            placeholder="Idee, Wunsch, Impuls …"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIdea()}
            style={{ flex: 1 }}
          />
          <button
            onClick={addIdea}
            style={{
              width: 44, height: 44,
              background: input.trim() ? 'var(--green)' : 'var(--border)',
              color: 'white', borderRadius: 'var(--radius-sm)',
              fontSize: '1.3rem', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >+</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.filter(c => c.id !== 'alle').map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                padding: '4px 10px', borderRadius: '100px',
                border: `1.5px solid ${category === c.id ? 'var(--green)' : 'var(--border)'}`,
                background: category === c.id ? 'var(--green-pale)' : 'transparent',
                color: category === c.id ? 'var(--green)' : 'var(--text-muted)',
                fontSize: '0.75rem', fontWeight: 500,
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter-Leiste */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4, scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            style={{
              padding: '6px 14px', borderRadius: '100px',
              background: filter === c.id ? 'var(--green)' : 'var(--bg-card)',
              color: filter === c.id ? 'white' : 'var(--text-muted)',
              fontSize: '0.8rem', fontWeight: 500,
              whiteSpace: 'nowrap', boxShadow: 'var(--shadow)',
              border: 'none', transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          <p>Noch keine Ideen —<br />trag ein, was dich bewegt.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onUpdate={(patch) => updateIdea(idea.id, patch)}
              onDelete={() => deleteIdea(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function IdeaCard({ idea, onUpdate, onDelete }) {
  const [editCat, setEditCat] = useState(false)
  const cat = getCat(idea.category)

  return (
    <div
      className="fade-in"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow)',
        opacity: idea.done ? 0.55 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Checkbox */}
        <button
          onClick={() => onUpdate({ done: !idea.done })}
          style={{
            width: 24, height: 24, borderRadius: 6,
            border: idea.done ? 'none' : '2px solid var(--border)',
            background: idea.done ? 'var(--green)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: '0.75rem', color: 'white', transition: 'all 0.15s',
          }}
        >
          {idea.done ? '✓' : ''}
        </button>

        {/* Kategorie-Icon — Tipp öffnet Picker */}
        <button
          onClick={() => setEditCat(v => !v)}
          title="Kategorie ändern"
          style={{
            fontSize: '1.2rem', flexShrink: 0,
            width: 32, height: 32, borderRadius: 8,
            background: editCat ? 'var(--green-pale)' : 'transparent',
            border: editCat ? '1.5px solid var(--green)' : '1.5px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {cat.icon}
        </button>

        {/* Text + Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.9rem', color: 'var(--text)',
            textDecoration: idea.done ? 'line-through' : 'none',
            lineHeight: 1.4,
          }}>
            {idea.text}
          </p>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
            {cat.label} · {idea.date}
          </span>
        </div>

        <button
          onClick={onDelete}
          style={{ color: 'var(--text-light)', padding: 4, fontSize: '1rem', flexShrink: 0 }}
        >×</button>
      </div>

      {/* Kategorie-Picker inline */}
      {editCat && (
        <div className="slide-up" style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '1px solid var(--border)',
          display: 'flex', flexWrap: 'wrap', gap: 6,
        }}>
          {CATEGORIES.filter(c => c.id !== 'alle').map(c => (
            <button
              key={c.id}
              onClick={() => { onUpdate({ category: c.id }); setEditCat(false) }}
              style={{
                padding: '5px 12px', borderRadius: '100px',
                border: `1.5px solid ${idea.category === c.id ? 'var(--green)' : 'var(--border)'}`,
                background: idea.category === c.id ? 'var(--green-pale)' : 'transparent',
                color: idea.category === c.id ? 'var(--green)' : 'var(--text-muted)',
                fontSize: '0.78rem', fontWeight: idea.category === c.id ? 600 : 400,
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
