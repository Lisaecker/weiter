import { useState, useRef, useEffect, useCallback } from 'react'
import { askCoachChat } from '../coach/CoachService.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

function getBerlinDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
}

function getBerlinHour() {
  return parseInt(new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin', hour: 'numeric', hour12: false,
  }).format(new Date()))
}

function getDaysUntil(dateStr) {
  const today = new Date(getBerlinDate())
  const target = new Date(dateStr)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

const ENERGY_WORDS = {
  1: 'sehr erschöpft',
  2: 'müde',
  3: 'okay',
  4: 'gut',
  5: 'sehr energievoll',
}

function getYesterdayEnergy() {
  try {
    const energyLog = JSON.parse(localStorage.getItem('energyLog') || '{}')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const key = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(yesterday)
    const entry = energyLog[key]
    const level = entry?.level ?? entry ?? null
    return level ? { level, word: ENERGY_WORDS[level] } : null
  } catch { return null }
}

function getLastEveningReflection() {
  try {
    const eveningLog = JSON.parse(localStorage.getItem('eveningLog') || '{}')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const key = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(yesterday)
    const entry = eveningLog[key]
    if (!entry?.saved) return null
    return entry.morgen || null // "Was machst du morgen anders"
  } catch { return null }
}

function buildOpeningTrigger(interviews, hour) {
  const isEvening = hour >= 18

  const upcoming = interviews
    .filter(iv => iv.status === 'upcoming')
    .map(iv => ({ ...iv, daysUntil: getDaysUntil(iv.date) }))
    .sort((a, b) => a.daysUntil - b.daysUntil)[0]

  const recentDone = interviews
    .filter(iv => iv.status === 'done')
    .map(iv => ({ ...iv, daysAgo: -getDaysUntil(iv.date) }))
    .filter(iv => iv.daysAgo >= 0 && iv.daysAgo <= 2)
    .sort((a, b) => a.daysAgo - b.daysAgo)[0]

  const yesterdayEnergy = getYesterdayEnergy()
  const lastIntention = getLastEveningReflection()

  // Kontext-Snippets für natürlichere Eröffnung
  const energyContext = yesterdayEnergy
    ? `Gestern war die Person ${yesterdayEnergy.word}${yesterdayEnergy.level <= 2 ? ' — das ist ein schwieriger Tag gewesen' : ''}.`
    : ''
  const intentionContext = lastIntention
    ? `Sie hatte sich gestern Abend vorgenommen: "${lastIntention}".`
    : ''

  if (isEvening) {
    if (recentDone && recentDone.daysAgo === 0) {
      return `Eröffne das Abendgespräch. Heute war das Interview bei ${recentDone.company}. Frage wie es gelaufen ist — offen, menschlich, ohne Wertungsskala.`
    }
    if (upcoming && upcoming.daysUntil === 0) {
      return `Eröffne das Abendgespräch. Heute war das Interview bei ${upcoming.company}. Frage wie es gelaufen ist.`
    }
    return `Eröffne das Abendgespräch. ${energyContext} Frage was heute wirklich bewegt hat — persönlich, konkret, nicht generisch.`
  }

  if (upcoming) {
    const d = upcoming.daysUntil
    if (d === 0) {
      return `Eröffne den Morgen. Heute ist das Interview bei ${upcoming.company}. ${energyContext} Frag zuerst wie die Person sich gerade fühlt.`
    }
    if (d === 1) {
      return `Eröffne den Morgen. Morgen ist das Interview bei ${upcoming.company}. ${energyContext} Starte mit dem Befinden, bring das Interview dann natürlich ins Gespräch.`
    }
    if (d <= 7) {
      return `Eröffne den Morgen. In ${d} Tagen ist das Interview bei ${upcoming.company}. ${energyContext} Frag zuerst wie es geht.`
    }
  }

  if (recentDone) {
    return `Eröffne den Morgen. Vor ${recentDone.daysAgo === 0 ? 'kurzem' : recentDone.daysAgo + ' Tag'} war das Interview bei ${recentDone.company}. Frag wie die Person das verarbeitet hat.`
  }

  // Standard-Morgen: persönlich, mit Kontext
  if (energyContext || intentionContext) {
    return `Eröffne den Morgen. ${energyContext} ${intentionContext} Frag wie die Person heute aufgewacht ist — beziehe dich auf den gestrigen Tag, ohne ihn kleinzureden. Sprich natürliches Deutsch.`
  }

  return `Eröffne den Morgen mit einer echten, persönlichen Frage wie es der Person wirklich geht. Kein "Guten Morgen! Wie geht es dir?" — konkreter, wärmer. Sprich natürliches Deutsch.`
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 0', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)',
          animation: 'coachBounce 1.2s ease infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}

function CoachBubble({ text, loading }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #2D6A4F, #1B4332)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', color: 'white', fontWeight: 700, marginTop: 2,
      }}>W</div>
      <div style={{
        background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
        borderRadius: '4px 16px 16px 16px',
        padding: '12px 16px', maxWidth: 'calc(100% - 42px)',
      }}>
        {loading ? <TypingDots /> : (
          <p style={{ color: 'white', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{text}</p>
        )}
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px 4px 16px 16px',
        padding: '12px 16px', maxWidth: '80%',
      }}>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0, color: 'var(--text)' }}>{text}</p>
      </div>
    </div>
  )
}

function InterviewBadge({ interview }) {
  const days = getDaysUntil(interview.date)
  const isToday = days === 0
  const isTomorrow = days === 1
  const label = isToday ? 'Heute' : isTomorrow ? 'Morgen' : `in ${days} Tagen`
  const color = isToday ? '#DC2626' : days <= 2 ? '#D97706' : '#2D6A4F'

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: '100px', padding: '4px 12px 4px 8px',
      fontSize: '0.75rem', color, fontWeight: 600,
    }}>
      <span>⌖</span>
      <span>{label} · {interview.company}</span>
    </div>
  )
}

function AddInterviewModal({ onSave, onClose }) {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [date, setDate] = useState('')

  const save = () => {
    if (!company.trim() || !date) return
    onSave({ id: Date.now(), company: company.trim(), role: role.trim(), date, status: 'upcoming' })
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
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Unternehmen *
          </label>
          <input
            className="input-field"
            placeholder="z.B. Siemens"
            value={company}
            onChange={e => setCompany(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Rolle (optional)
          </label>
          <input
            className="input-field"
            placeholder="z.B. Head of Customer Success"
            value={role}
            onChange={e => setRole(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Datum *
          </label>
          <input
            className="input-field"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={getBerlinDate()}
          />
        </div>
        <button
          className="btn-primary"
          onClick={save}
          disabled={!company.trim() || !date}
          style={{ opacity: !company.trim() || !date ? 0.5 : 1 }}
        >
          Speichern
        </button>
      </div>
    </div>
  )
}

function TaskSection({ tasks, onAdd, onToggle, onRemove }) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(true)
  const done = tasks.filter(t => t.done).length

  const handleAdd = () => {
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: 0, background: 'none',
        }}
      >
        <span className="label" style={{ marginBottom: 0 }}>
          Mein Fokus heute
          {tasks.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: done === tasks.length && tasks.length > 0 ? 'var(--green)' : 'var(--text-muted)', fontWeight: 400 }}>
              {done}/{tasks.length}
            </span>
          )}
        </span>
        <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              className="input-field"
              placeholder="Was willst du heute schaffen?"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1 }}
            />
            <button
              onClick={handleAdd}
              style={{
                width: 44, height: 44, background: input.trim() ? 'var(--green)' : 'var(--border)',
                color: 'white', borderRadius: 'var(--radius-sm)',
                fontSize: '1.3rem', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >+</button>
          </div>
          {tasks.map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <button
                onClick={() => onToggle(task.id)}
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: task.done ? 'none' : '2px solid var(--border)',
                  background: task.done ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s', color: 'white', fontSize: '0.7rem',
                }}
              >{task.done ? '✓' : ''}</button>
              <span style={{
                flex: 1, fontSize: '0.9rem',
                color: task.done ? 'var(--text-muted)' : 'var(--text)',
                textDecoration: task.done ? 'line-through' : 'none',
              }}>{task.label}</span>
              <button onClick={() => onRemove(task.id)} style={{ color: 'var(--text-light)', fontSize: '1rem', padding: '0 4px' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Heute() {
  const today = getBerlinDate()
  const hour = getBerlinHour()

  const [dailyChat, setDailyChat] = useLocalStorage('dailyChat', {})
  const [taskLog, setTaskLog] = useLocalStorage('taskLog', {})
  const [interviews, setInterviews] = useLocalStorage('interviews', [])

  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('userProfile') || 'null') } catch { return null }
  })()

  const todayMessages = dailyChat[today] || []
  const todayTasks = taskLog[today] || []

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAddInterview, setShowAddInterview] = useState(false)

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const initialized = useRef(false)

  const upcomingInterviews = interviews
    .filter(iv => iv.status === 'upcoming' && getDaysUntil(iv.date) >= 0)
    .sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date))

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [todayMessages, loading])

  // Coach-Eröffnung wenn kein Chat für heute
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (todayMessages.length > 0) return
    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
      const fallback = hour >= 18
        ? 'Wie war dein Tag heute — was hat dich bewegt?'
        : 'Guten Morgen — wie geht es dir heute wirklich?'
      setDailyChat(prev => ({
        ...prev,
        [today]: [{ role: 'assistant', content: fallback }],
      }))
      return
    }
    const trigger = buildOpeningTrigger(interviews, hour)
    setLoading(true)
    askCoachChat([{ role: 'user', content: trigger }])
      .then(text => {
        setDailyChat(prev => ({
          ...prev,
          [today]: [{ role: 'assistant', content: text }],
        }))
      })
      .catch(() => {
        const fallback = hour >= 18
          ? 'Wie war dein Tag heute — was hat dich bewegt?'
          : 'Guten Morgen — wie geht es dir heute wirklich?'
        setDailyChat(prev => ({
          ...prev,
          [today]: [{ role: 'assistant', content: fallback }],
        }))
      })
      .finally(() => setLoading(false))
  }, [])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg = { role: 'user', content: text }
    const newMessages = [...todayMessages, userMsg]
    setDailyChat(prev => ({ ...prev, [today]: newMessages }))

    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) return

    setLoading(true)
    try {
      const reply = await askCoachChat(newMessages)
      setDailyChat(prev => ({
        ...prev,
        [today]: [...(prev[today] || []), { role: 'assistant', content: reply }],
      }))
    } catch {
      setDailyChat(prev => ({
        ...prev,
        [today]: [...(prev[today] || []), { role: 'assistant', content: 'Ich bin gerade kurz weg — schreib nochmal.' }],
      }))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const addTask = label => {
    setTaskLog(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), { label, done: false, id: Date.now() }],
    }))
  }

  const toggleTask = id => {
    setTaskLog(prev => ({
      ...prev,
      [today]: prev[today].map(t => t.id === id ? { ...t, done: !t.done } : t),
    }))
  }

  const removeTask = id => {
    setTaskLog(prev => ({
      ...prev,
      [today]: prev[today].filter(t => t.id !== id),
    }))
  }

  const addInterview = iv => {
    setInterviews(prev => [...prev, iv])
  }

  const markInterviewDone = id => {
    setInterviews(prev => prev.map(iv => iv.id === id ? { ...iv, status: 'done' } : iv))
  }

  const dateLabel = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', maxWidth: 430, margin: '0 auto',
      paddingBottom: 'var(--tab-height)',
    }}>

      {/* Header */}
      <div style={{
        padding: '52px 20px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{dateLabel}</p>
            <h1 style={{ fontSize: '1.3rem', fontFamily: 'Lora, serif' }}>Weiter.</h1>
          </div>
          <button
            onClick={() => setShowAddInterview(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: '100px',
              border: '1.5px solid var(--border)', background: 'var(--bg)',
              fontSize: '0.78rem', color: 'var(--text-muted)',
            }}
          >
            <span>⌖</span> Interview
          </button>
        </div>

        {/* Kommende Interviews */}
        {upcomingInterviews.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {upcomingInterviews.slice(0, 2).map(iv => (
              <div key={iv.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <InterviewBadge interview={iv} />
                {getDaysUntil(iv.date) <= 0 && (
                  <button
                    onClick={() => markInterviewDone(iv.id)}
                    style={{ fontSize: '0.7rem', color: 'var(--text-light)', textDecoration: 'underline' }}
                  >
                    erledigt
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat-Bereich */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '20px 20px 8px',
        WebkitOverflowScrolling: 'touch',
      }}>
        {todayMessages.map((msg, i) => (
          msg.role === 'assistant'
            ? <CoachBubble key={i} text={msg.content} />
            : <UserBubble key={i} text={msg.content} />
        ))}
        {loading && <CoachBubble loading />}

        {/* Task-Section im Chat */}
        <TaskSection
          tasks={todayTasks}
          onAdd={addTask}
          onToggle={toggleTask}
          onRemove={removeTask}
        />

        <div ref={chatEndRef} style={{ height: 1 }} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border)',
        background: 'rgba(250,250,247,0.95)',
        backdropFilter: 'blur(16px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="input-field"
            placeholder="Schreib dem Coach …"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            rows={1}
            style={{
              flex: 1, resize: 'none', lineHeight: 1.5,
              maxHeight: 120, overflow: 'auto',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: input.trim() && !loading ? 'var(--green)' : 'var(--border)',
              color: 'white', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', transition: 'background 0.15s',
            }}
          >↑</button>
        </div>
      </div>

      {showAddInterview && (
        <AddInterviewModal
          onSave={addInterview}
          onClose={() => setShowAddInterview(false)}
        />
      )}
    </div>
  )
}
