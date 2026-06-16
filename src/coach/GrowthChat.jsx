import { useState, useRef, useEffect } from 'react'
import { buildGrowthSystemPrompt } from './systemPrompt.js'

const PHASES = [
  { id: 'standort', label: 'Standort' },
  { id: 'ziel',     label: 'Ziel' },
  { id: 'plan',     label: 'Plan' },
  { id: 'training', label: 'Training' },
]

async function callClaude(systemPrompt, apiMessages) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) throw new Error('Kein API Key')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: apiMessages,
    }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  return data.content[0]?.text || ''
}

function parseResponse(text) {
  let clean = text
  const updates = {}

  const zielMatch = text.match(/\[ZIEL:\s*(.*?)\]/s)
  if (zielMatch) {
    updates.goal = zielMatch[1].trim()
    updates.phase = 'plan'
    clean = clean.replace(zielMatch[0], '').trim()
  }

  const planMatch = text.match(/\[PLAN:\s*(.*?)\]/s)
  if (planMatch) {
    updates.planSteps = planMatch[1].split('|').map((s, i) => ({
      id: i + 1, title: s.trim(), done: false,
    }))
    updates.phase = 'training'
    clean = clean.replace(planMatch[0], '').trim()
  }

  return { clean, updates }
}

function saveSession(fieldId, data) {
  const all = JSON.parse(localStorage.getItem('growthSessions') || '{}')
  localStorage.setItem('growthSessions', JSON.stringify({
    ...all,
    [fieldId]: { ...data, lastUpdated: new Date().toISOString() },
  }))
}

export default function GrowthChat({ field, onClose }) {
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
  const stored = JSON.parse(localStorage.getItem('growthSessions') || '{}')?.[field.id]

  const [phase, setPhase]           = useState(stored?.phase || 'standort')
  const [messages, setMessages]     = useState(stored?.messages || [])
  const [apiMessages, setApiMessages] = useState(stored?.apiMessages || [])
  const [goal, setGoal]             = useState(stored?.goal || null)
  const [planSteps, setPlanSteps]   = useState(stored?.planSteps || null)
  const [input, setInput]           = useState('')
  const [isTyping, setIsTyping]     = useState(false)
  const [showPlan, setShowPlan]     = useState(true)
  const [error, setError]           = useState(null)

  const chatEndRef = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Auto-start on first open
  useEffect(() => {
    if (messages.length > 0) return
    const trigger = `Ich möchte an meinem Wachstumsfeld "${field.name}" arbeiten. Starte die Standortbestimmung mit deiner ersten Frage.`
    const initApi = [{ role: 'user', content: trigger }]
    setApiMessages(initApi)
    setIsTyping(true)
    const sys = buildGrowthSystemPrompt(field, userProfile, 'standort', null, null)
    callClaude(sys, initApi)
      .then(text => {
        const { clean, updates } = parseResponse(text)
        const msg = { from: 'coach', text: clean, ts: new Date().toISOString() }
        const finalApi = [...initApi, { role: 'assistant', content: text }]
        const newPhase = updates.phase || 'standort'
        const newGoal = updates.goal || null
        const newSteps = updates.planSteps || null
        setMessages([msg])
        setApiMessages(finalApi)
        setPhase(newPhase)
        setGoal(newGoal)
        setPlanSteps(newSteps)
        saveSession(field.id, { phase: newPhase, messages: [msg], apiMessages: finalApi, goal: newGoal, planSteps: newSteps })
      })
      .catch(() => setError('Coach konnte nicht gestartet werden.'))
      .finally(() => {
        setIsTyping(false)
        setTimeout(() => inputRef.current?.focus(), 100)
      })
  }, []) // eslint-disable-line

  const send = async () => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    setError(null)

    const userMsg  = { from: 'user', text, ts: new Date().toISOString() }
    const newMsgs  = [...messages, userMsg]
    const newApi   = [...apiMessages, { role: 'user', content: text }]
    setMessages(newMsgs)
    setApiMessages(newApi)
    setIsTyping(true)

    try {
      const sys = buildGrowthSystemPrompt(field, userProfile, phase, goal, planSteps)
      const raw = await callClaude(sys, newApi)
      const { clean, updates } = parseResponse(raw)

      const coachMsg   = { from: 'coach', text: clean, ts: new Date().toISOString() }
      const finalMsgs  = [...newMsgs, coachMsg]
      const finalApi   = [...newApi, { role: 'assistant', content: raw }]
      const finalPhase = updates.phase || phase
      const finalGoal  = updates.goal ?? goal
      const finalSteps = updates.planSteps ?? planSteps

      setMessages(finalMsgs)
      setApiMessages(finalApi)
      if (updates.phase) setPhase(updates.phase)
      if (updates.goal)  setGoal(updates.goal)
      if (updates.planSteps) setPlanSteps(updates.planSteps)
      saveSession(field.id, { phase: finalPhase, messages: finalMsgs, apiMessages: finalApi, goal: finalGoal, planSteps: finalSteps })
    } catch {
      setError('Coach ist gerade nicht erreichbar — bitte nochmal versuchen.')
    }
    setIsTyping(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const toggleStep = (id) => {
    const updated = planSteps.map(s => s.id === id ? { ...s, done: !s.done } : s)
    setPlanSteps(updated)
    saveSession(field.id, { phase, messages, apiMessages, goal, planSteps: updated })
  }

  const phaseIdx = PHASES.findIndex(p => p.id === phase)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          ← Zurück
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: field.color }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{field.name}</span>
        </div>
        <button
          onClick={() => setShowPlan(v => !v)}
          style={{
            fontSize: '0.78rem', padding: '4px 12px', borderRadius: '100px',
            border: '1.5px solid var(--border)',
            background: showPlan ? 'var(--green-pale)' : 'transparent',
            color: showPlan ? 'var(--green)' : 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          Plan {showPlan ? '▲' : '▼'}
        </button>
      </div>

      {/* ── Plan Panel ── */}
      {showPlan && (
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)', flexShrink: 0,
        }}>
          {/* Phase chips */}
          <div style={{ display: 'flex', gap: 5, marginBottom: (goal || planSteps) ? 10 : 0 }}>
            {PHASES.map((p, i) => (
              <div key={p.id} style={{
                flex: 1, padding: '5px 4px', textAlign: 'center', borderRadius: 6,
                background: i === phaseIdx ? 'var(--green)' : i < phaseIdx ? 'var(--green-pale)' : 'var(--bg)',
                border: `1px solid ${i <= phaseIdx ? 'var(--green)' : 'var(--border)'}`,
              }}>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 600,
                  color: i === phaseIdx ? 'white' : i < phaseIdx ? 'var(--green)' : 'var(--text-light)',
                }}>
                  {i < phaseIdx ? '✓ ' : ''}{p.label}
                </span>
              </div>
            ))}
          </div>

          {/* Goal */}
          {goal && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: planSteps ? 8 : 0 }}>
              <span style={{ fontWeight: 600, color: 'var(--green)' }}>Ziel: </span>{goal}
            </div>
          )}

          {/* Plan steps */}
          {planSteps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {planSteps.map(step => (
                <button
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '4px 0', background: 'transparent', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: step.done ? 'none' : '1.5px solid var(--border)',
                    background: step.done ? 'var(--green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.6rem',
                  }}>
                    {step.done ? '✓' : ''}
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    color: step.done ? 'var(--text-muted)' : 'var(--text)',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}>
                    {step.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'coach' ? 'flex-start' : 'flex-end' }}>
            {msg.from === 'coach' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', color: 'white', flexShrink: 0, marginRight: 8, marginTop: 2,
              }}>✦</div>
            )}
            <div style={{
              maxWidth: '80%', padding: '12px 16px',
              borderRadius: msg.from === 'coach' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
              background: msg.from === 'coach' ? 'var(--bg-card)' : 'var(--green)',
              color: msg.from === 'coach' ? 'var(--text)' : 'white',
              fontSize: '0.9rem', lineHeight: 1.6, boxShadow: 'var(--shadow)',
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', color: 'white',
            }}>✦</div>
            <div style={{
              padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
              background: 'var(--bg-card)', boxShadow: 'var(--shadow)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--text-light)',
                  animation: 'coachBounce 1.2s ease infinite',
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p style={{ textAlign: 'center', color: '#EF4444', fontSize: '0.8rem', padding: 8 }}>
            {error}
          </p>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: '12px 20px 32px', borderTop: '1px solid var(--border)',
        background: 'var(--bg)', display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          className="input-field"
          placeholder="Schreib dem Coach …"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ flex: 1 }}
        />
        <button
          onClick={send}
          style={{
            width: 44, height: 44, flexShrink: 0, borderRadius: 'var(--radius-sm)',
            background: input.trim() && !isTyping ? 'var(--green)' : 'var(--border)',
            color: 'white', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >→</button>
      </div>

      <style>{`
        @keyframes coachBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
