import { useState, useRef, useEffect, useCallback } from 'react'
import { askCoachChat } from '../coach/CoachService.js'
import { getTimeGreeting } from '../coach/timeGreeting.js'
import { saveEnergyEntry, hasEnergyToday } from '../coach/energyTracker.js'
import { extractTrackingData, saveTrackingData } from '../coach/autoTracker.js'
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
  1: 'sehr erschöpft', 2: 'müde', 3: 'okay', 4: 'gut', 5: 'richtig in Fahrt',
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
    return entry?.saved ? (entry.morgen || null) : null
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

  const ye = getYesterdayEnergy()
  const lastIntention = getLastEveningReflection()

  const energyCtx = ye
    ? `Gestern war die Person ${ye.word}${ye.level <= 2 ? ' — das war ein harter Tag' : ''}.`
    : ''
  const intentionCtx = lastIntention
    ? `Sie hatte sich vorgenommen: "${lastIntention}".`
    : ''

  if (isEvening) {
    if (recentDone?.daysAgo === 0 || (upcoming?.daysUntil === 0)) {
      const company = recentDone?.company || upcoming?.company
      return `Eröffne das Abendgespräch. Heute war das Interview bei ${company}. Frag wie es gelaufen ist — offen, menschlich.`
    }
    return `Eröffne das Abendgespräch. ${energyCtx} Frag was heute wirklich bewegt hat — persönlich, konkret.`
  }

  if (upcoming) {
    const d = upcoming.daysUntil
    if (d === 0) return `Eröffne den Morgen. Heute ist das Interview bei ${upcoming.company}. ${energyCtx} Frag wie die Person sich gerade fühlt.`
    if (d === 1) return `Eröffne den Morgen. Morgen ist das Interview bei ${upcoming.company}. ${energyCtx} Starte mit dem Befinden.`
    if (d <= 7) return `Eröffne den Morgen. In ${d} Tagen ist das Interview bei ${upcoming.company}. ${energyCtx} Frag zuerst wie es geht.`
  }

  if (recentDone) {
    return `Eröffne den Morgen. Vor ${recentDone.daysAgo} Tag${recentDone.daysAgo > 1 ? 'en' : ''} war das Interview bei ${recentDone.company}. Frag wie die Person das verarbeitet hat.`
  }

  return null
}

// ── Voice Button ──────────────────────────────────────────────────────────────
function VoiceButton({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false)
  const recogRef = useRef(null)

  const toggle = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt.')
      return
    }
    if (listening) {
      recogRef.current?.stop()
      setListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = 'de-DE'
    r.continuous = true
    r.interimResults = false
    r.onresult = e => {
      const text = Array.from(e.results)
        .slice(e.resultIndex)
        .map(res => res[0].transcript)
        .join('')
      onTranscript(text)
    }
    r.onend = () => setListening(false)
    r.start()
    recogRef.current = r
    setListening(true)
  }, [listening, onTranscript])

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Aufnahme stoppen' : 'Spracheingabe'}
      style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: listening ? '#DC2626' : 'var(--bg-card)',
        border: `1.5px solid ${listening ? '#DC2626' : 'var(--border)'}`,
        color: listening ? 'white' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', transition: 'all 0.2s',
        animation: listening ? 'pulse 1.5s ease infinite' : 'none',
      }}
    >
      {listening ? '⏹' : '🎙'}
    </button>
  )
}

// ── Bubbles ───────────────────────────────────────────────────────────────────
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
        {loading
          ? <TypingDots />
          : <p style={{ color: 'white', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{text}</p>
        }
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

// ── Energie-Picker ────────────────────────────────────────────────────────────
function EnergyPicker({ onPick }) {
  const emojis = ['😴', '😕', '😐', '🙂', '⚡']
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '14px 16px', marginBottom: 16,
    }}>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
        Wie fühlst du dich gerade?
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {emojis.map(e => (
          <button
            key={e}
            onClick={() => onPick(e)}
            style={{
              fontSize: '1.6rem', width: 48, height: 48,
              borderRadius: '50%', border: '1.5px solid var(--border)',
              background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.1s',
            }}
          >{e}</button>
        ))}
      </div>
    </div>
  )
}

// ── Fokus-Karte im Chat ───────────────────────────────────────────────────────
function FocusCard({ tasks, onAdd, onToggle, onRemove }) {
  const [input, setInput] = useState('')
  const done = tasks.filter(t => t.done).length

  const handleAdd = () => {
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--green)',
      borderRadius: 16, padding: 16, marginBottom: 16,
      borderLeft: '3px solid var(--green)',
    }}>
      <div style={{
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--green)', marginBottom: 12,
      }}>
        Fokus heute {tasks.length > 0 && `· ${done}/${tasks.length}`}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: tasks.length > 0 ? 12 : 0 }}>
        <input
          className="input-field"
          placeholder="Was ist dein Fokus heute?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1, fontSize: '0.875rem' }}
          autoFocus
        />
        <button
          onClick={handleAdd}
          style={{
            width: 40, height: 40, background: input.trim() ? 'var(--green)' : 'var(--border)',
            color: 'white', borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', transition: 'background 0.15s', flexShrink: 0,
          }}
        >+</button>
      </div>

      {tasks.map(task => (
        <div key={task.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 0', borderBottom: '1px solid var(--border)',
        }}>
          <button
            onClick={() => onToggle(task.id)}
            style={{
              width: 22, height: 22, borderRadius: 6,
              border: task.done ? 'none' : '2px solid var(--border)',
              background: task.done ? 'var(--green)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: 'white', fontSize: '0.7rem',
            }}
          >{task.done ? '✓' : ''}</button>
          <span style={{
            flex: 1, fontSize: '0.875rem',
            color: task.done ? 'var(--text-muted)' : 'var(--text)',
            textDecoration: task.done ? 'line-through' : 'none',
          }}>{task.label}</span>
          <button onClick={() => onRemove(task.id)}
            style={{ color: 'var(--text-light)', fontSize: '1rem', padding: '0 4px' }}>×</button>
        </div>
      ))}

      {tasks.length > 0 && done === tasks.length && (
        <div style={{
          marginTop: 12, textAlign: 'center',
          fontSize: '0.82rem', color: 'var(--green)', fontWeight: 600,
        }}>
          Alles erledigt — starker Tag. 🎉
        </div>
      )}
    </div>
  )
}

// ── Interview Badge + Modal ───────────────────────────────────────────────────
function InterviewBadge({ interview }) {
  const days = getDaysUntil(interview.date)
  const label = days === 0 ? 'Heute' : days === 1 ? 'Morgen' : `in ${days} Tagen`
  const color = days === 0 ? '#DC2626' : days <= 2 ? '#D97706' : '#2D6A4F'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: '100px', padding: '4px 12px 4px 8px',
      fontSize: '0.75rem', color, fontWeight: 600,
    }}>
      <span>⌖</span><span>{label} · {interview.company}</span>
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
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Unternehmen *</label>
          <input className="input-field" placeholder="z.B. Siemens" value={company}
            onChange={e => setCompany(e.target.value)} autoFocus />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Rolle (optional)</label>
          <input className="input-field" placeholder="z.B. Head of Customer Success"
            value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Datum *</label>
          <input className="input-field" type="date" value={date}
            onChange={e => setDate(e.target.value)} min={getBerlinDate()} />
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

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function Heute() {
  const today = getBerlinDate()
  const hour = getBerlinHour()

  const [dailyChat, setDailyChat] = useLocalStorage('dailyChat', {})
  const [taskLog, setTaskLog] = useLocalStorage('taskLog', {})
  const [interviews, setInterviews] = useLocalStorage('interviews', [])

  const todayMessages = dailyChat[today] || []
  const todayTasks = taskLog[today] || []
  const focusVisible = todayMessages.some(m => m.role === 'focus-card')

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAddInterview, setShowAddInterview] = useState(false)
  const hasUserReplied = todayMessages.some(m => m.role === 'user')
  const [inputActive, setInputActive] = useState(false)

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const initialized = useRef(false)

  const upcomingInterviews = interviews
    .filter(iv => iv.status === 'upcoming' && getDaysUntil(iv.date) >= 0)
    .sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date))

  const chatContainerRef = useRef(null)
  useEffect(() => {
    if (todayMessages.length <= 2 && !loading) {
      // Initiales Laden → nach oben scrollen damit Begrüßung sichtbar ist
      chatContainerRef.current?.scrollTo({ top: 0 })
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [todayMessages, loading])

  // Coach-Eröffnung — statische Begrüßung, kein API-Call
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (todayMessages.length > 0) return

    const trigger = buildOpeningTrigger(interviews, hour)

    // Interview-Kontext hat Vorrang → API-Call für personalisierten Einstieg
    if (trigger && import.meta.env.VITE_ANTHROPIC_API_KEY) {
      setLoading(true)
      askCoachChat([{ role: 'user', content: trigger }])
        .then(text => {
          setDailyChat(prev => ({ ...prev, [today]: [{ role: 'assistant', content: text }] }))
        })
        .catch(() => {
          const greetingObj = getTimeGreeting()
          const greetingText = greetingObj?.text || 'Hey — wie geht es dir heute?'
          setDailyChat(prev => ({ ...prev, [today]: [{ role: 'assistant', content: greetingText }] }))
        })
        .finally(() => setLoading(false))
      return
    }

    // Kein Interview-Kontext → statische Zeit-Begrüßung (kein API-Call)
    const greetingObj = getTimeGreeting()
    const greetingText = greetingObj?.text || 'Hey — wie geht es dir heute?'
    const showEnergy = greetingObj?.askEnergy && !hasEnergyToday()
    const msgs = [{ role: 'assistant', content: greetingText }]
    if (showEnergy) msgs.push({ role: 'energy-picker', content: '' })
    setDailyChat(prev => ({ ...prev, [today]: msgs }))
  }, [])

  const sendMessage = async (textOverride) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return
    if (!textOverride) setInput('')

    const userMsg = { role: 'user', content: text }

    // Auto-Tracking aus Nachricht extrahieren
    const tracked = extractTrackingData(text)
    if (tracked.bewerbungen > 0 || tracked.interviews > 0 || tracked.sport) {
      saveTrackingData(tracked)
    }

    // Nur echte Chat-Nachrichten an die API (focus-card überspringen)
    const allHistory = [...todayMessages.filter(m => m.role !== 'focus-card' && m.role !== 'task-saved' && m.role !== 'energy-picker'), userMsg]
    const chatHistory = allHistory.slice(-10) // max 10 Nachrichten → Token-Kontrolle
    const withUser = [...todayMessages, userMsg]
    setDailyChat(prev => ({ ...prev, [today]: withUser }))

    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) return

    setLoading(true)
    try {
      const reply = await askCoachChat(chatHistory)

      // [FOKUS] Tag
      const hasFokus = reply.includes('[FOKUS]')

      // [TASK: ...] Tags extrahieren
      const taskMatches = [...reply.matchAll(/\[TASK:\s*([^\]]+)\]/g)]
      const newTaskLabels = taskMatches.map(m => m[1].trim())

      // Tags aus dem angezeigten Text entfernen
      const cleanReply = reply
        .replace('[FOKUS]', '')
        .replace(/\[TASK:[^\]]+\]/g, '')
        .trim()

      // Tasks automatisch speichern
      if (newTaskLabels.length > 0) {
        setTaskLog(prev => {
          const existing = prev[today] || []
          const existingLabels = existing.map(t => t.label)
          const toAdd = newTaskLabels
            .filter(l => !existingLabels.includes(l))
            .map(l => ({ label: l, done: false, id: Date.now() + Math.random() }))
          return { ...prev, [today]: [...existing, ...toAdd] }
        })
      }

      const newMessages = [
        ...withUser,
        { role: 'assistant', content: cleanReply },
        ...(newTaskLabels.length > 0 ? [{ role: 'task-saved', content: newTaskLabels.join(', ') }] : []),
        ...(hasFokus ? [{ role: 'focus-card', content: '' }] : []),
      ]

      setDailyChat(prev => ({ ...prev, [today]: newMessages }))
    } catch (err) {
      const msg = err?.message?.includes('CIRCUIT_BREAKER')
        ? err.message.replace('CIRCUIT_BREAKER: ', '')
        : 'Verbindungsfehler — bitte nochmal versuchen.'
      setDailyChat(prev => ({
        ...prev,
        [today]: [...withUser, { role: 'assistant', content: msg }],
      }))
    } finally {
      setLoading(false)
      // Kein auto-focus auf Mobile — öffnet sonst sofort die Tastatur
      if (window.innerWidth > 600) setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleVoiceTranscript = useCallback((text) => {
    setInput(prev => prev ? prev + ' ' + text : text)
  }, [])

  const handleEnergyPick = (emoji) => {
    saveEnergyEntry(emoji)

    const isGood = emoji === '🙂' || emoji === '⚡'
    const isLow = emoji === '😴' || emoji === '😕'

    let followUp
    if (hour >= 6 && hour < 12) {
      followUp = isGood
        ? 'Das ist ein guter Start. Was willst du damit heute machen?'
        : isLow
        ? 'Ein harter Start — was ist los?'
        : 'Okay. Was willst du heute draus machen?'
    } else if (hour >= 12 && hour < 15) {
      followUp = isGood
        ? 'Was trägt dich gerade?'
        : isLow
        ? 'Was zieht dich gerade runter?'
        : 'Halber Tag — was war bisher prägend?'
    } else if (hour >= 15 && hour < 18) {
      followUp = isGood
        ? 'Was treibt dich an?'
        : isLow
        ? `Woran liegt's?`
        : 'Was hat den Nachmittag so gemacht?'
    } else {
      followUp = isGood
        ? 'Schön, dass du den Tag mit einem guten Gefühl abschließt. An was liegt es?'
        : isLow
        ? 'Solche Tage gibt es. Wichtig ist zu verstehen, an was es liegt.'
        : 'Wie war der Tag insgesamt für dich?'
    }

    setDailyChat(prev => ({
      ...prev,
      [today]: [
        ...prev[today].map(m => m.role === 'energy-picker' ? { role: 'energy-done', content: emoji } : m),
        { role: 'assistant', content: followUp },
      ],
    }))
  }

  const addTask = label => setTaskLog(prev => ({
    ...prev,
    [today]: [...(prev[today] || []), { label, done: false, id: Date.now() }],
  }))
  const toggleTask = id => setTaskLog(prev => ({
    ...prev,
    [today]: prev[today].map(t => t.id === id ? { ...t, done: !t.done } : t),
  }))
  const removeTask = id => setTaskLog(prev => ({
    ...prev,
    [today]: prev[today].filter(t => t.id !== id),
  }))

  const dateLabel = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
      paddingBottom: 'var(--tab-height)',
    }}>

      {/* Header */}
      <div style={{
        padding: '52px 20px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', flexShrink: 0,
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
          ><span>⌖</span> Interview</button>
        </div>
        {upcomingInterviews.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {upcomingInterviews.slice(0, 2).map(iv => (
              <div key={iv.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <InterviewBadge interview={iv} />
                {getDaysUntil(iv.date) <= 0 && (
                  <button onClick={() => setInterviews(prev => prev.map(i => i.id === iv.id ? { ...i, status: 'done' } : i))}
                    style={{ fontSize: '0.7rem', color: 'var(--text-light)', textDecoration: 'underline' }}>
                    erledigt
                  </button>
                )}
                <button
                  onClick={() => setInterviews(prev => prev.filter(i => i.id !== iv.id))}
                  style={{ fontSize: '0.9rem', color: 'var(--text-light)', padding: '2px 4px', lineHeight: 1 }}
                  title="Löschen"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 20px 8px',
        WebkitOverflowScrolling: 'touch',
      }} ref={chatContainerRef}>
        {todayMessages.map((msg, i) => {
          if (msg.role === 'assistant') return <CoachBubble key={i} text={msg.content} />
          if (msg.role === 'user') return <UserBubble key={i} text={msg.content} />
          if (msg.role === 'task-saved') return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'center', marginBottom: 12,
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--green-pale)', border: '1px solid var(--green)',
                borderRadius: '100px', padding: '5px 14px',
                fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600,
              }}>
                ✓ Notiert: {msg.content}
              </div>
            </div>
          )
          if (msg.role === 'energy-picker') return (
            <EnergyPicker key={i} onPick={handleEnergyPick} />
          )
          if (msg.role === 'energy-done') return (
            <div key={i} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '100px', padding: '5px 14px',
                fontSize: '0.82rem', color: 'var(--text-muted)',
              }}>
                {msg.content} Energie gespeichert
              </div>
            </div>
          )
          if (msg.role === 'focus-card') return (
            <FocusCard
              key={i}
              tasks={todayTasks}
              onAdd={addTask}
              onToggle={toggleTask}
              onRemove={removeTask}
            />
          )
          return null
        })}
        {loading && <CoachBubble loading />}
        <div ref={chatEndRef} style={{ height: 1 }} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(250,250,247,0.97)',
        backdropFilter: 'blur(16px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <VoiceButton onTranscript={handleVoiceTranscript} disabled={loading} />
          {!hasUserReplied && !inputActive ? (
            <div
              onClick={() => { setInputActive(true); setTimeout(() => inputRef.current?.focus(), 50) }}
              className="input-field"
              style={{ flex: 1, lineHeight: 1.5, color: 'var(--text-muted)', cursor: 'text' }}
            >
              Antworten …
            </div>
          ) : (
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
              style={{ flex: 1, resize: 'none', lineHeight: 1.5, maxHeight: 100, overflow: 'auto' }}
            />
          )}
          <button
            onClick={() => sendMessage()}
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
          onSave={iv => setInterviews(prev => [...prev, iv])}
          onClose={() => setShowAddInterview(false)}
        />
      )}
    </div>
  )
}
