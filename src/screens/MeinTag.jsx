import { useState, useRef } from 'react'
import Coach from '../components/Coach.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { energyMessages } from '../data/coachMessages.js'
import { CATEGORIES } from './Ideen.jsx'

// Welche Ideen-Kategorien passen zu welchem Energielevel
const IDEA_CAT_BY_ENERGY = {
  1: ['pause', 'reflexion', 'genuss'],
  2: ['pause', 'reflexion', 'inspiration'],
  3: ['inspiration', 'motivation', 'lernen'],
  4: ['motivation', 'lernen', 'erleben'],
  5: ['motivation', 'erleben', 'beruf'],
}

function pickIdeaForContext(ideas, level, tasks) {
  if (!ideas || ideas.length === 0) return null
  const relevantCats = IDEA_CAT_BY_ENERGY[level] || []
  const hasManyTasks = tasks.length >= 3
  const allDone = tasks.length > 0 && tasks.every(t => t.done)

  // Priorität: nicht erledigt, passende Kategorie
  const pool = ideas.filter(i => !i.done && relevantCats.includes(i.category))
  const fallback = ideas.filter(i => !i.done)
  const chosen = pool.length > 0 ? pool : fallback
  if (chosen.length === 0) return null

  const idea = chosen[Math.floor(Math.random() * chosen.length)]
  const cat = CATEGORIES.find(c => c.id === idea.category)

  if (allDone) return `${cat?.icon || '✦'} Alles erledigt — Zeit für: „${idea.text}"`
  if (hasManyTasks && level <= 2) return `${cat?.icon || '✦'} Gönn dir eine Pause mit: „${idea.text}"`
  if (level <= 2) return `${cat?.icon || '✦'} Für einen leichten Moment: „${idea.text}"`
  if (level >= 4) return `${cat?.icon || '✦'} Als Inspiration für heute: „${idea.text}"`
  return `${cat?.icon || '✦'} Deine Idee für heute: „${idea.text}"`
}

const ENERGY_LEVELS = [
  { value: 1, emoji: '😴', label: 'Erschöpft' },
  { value: 2, emoji: '😕', label: 'Müde' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 4, emoji: '🙂', label: 'Gut' },
  { value: 5, emoji: '⚡', label: 'Energievoll' },
]

const SUGGESTIONS_BY_ENERGY = {
  1: ['Spazieren gehen', 'Tagebuch schreiben', 'Podcast hören', 'Ausschlafen'],
  2: ['1 E-Mail beantworten', 'LinkedIn durchschauen', 'Kurze Meditation', 'Lesen'],
  3: ['Bewerbung überarbeiten', 'Netzwerknachricht senden', 'Recherche', 'Idee notieren'],
  4: ['Bewerbung schreiben', 'Interview vorbereiten', 'Headhunter anschreiben', 'Jobrecherche'],
  5: ['Kaltakquise', 'Wichtiges Gespräch führen', 'LinkedIn-Post', 'Mehrere Bewerbungen'],
}

function getBerlinHour() {
  return parseInt(
    new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
  )
}

function getBerlinDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
}

function getCoachMessage(level) {
  const msgs = energyMessages[level]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

export default function MeinTag() {
  const today = getBerlinDate()
  const hour = getBerlinHour()
  const isEvening = hour >= 18

  const [energyLog, setEnergyLog] = useLocalStorage('energyLog', {})
  const [taskLog, setTaskLog] = useLocalStorage('taskLog', {})
  const [eveningLog, setEveningLog] = useLocalStorage('eveningLog', {})
  const [ideas] = useLocalStorage('ideas', [])
  const [coachMsg] = useState(() =>
    energyLog[today]?.level ? getCoachMessage(energyLog[today].level) : null
  )
  const [pendingCoach, setPendingCoach] = useState(null)
  const [ideaMsg, setIdeaMsg] = useState(() => {
    const lvl = energyLog[today]?.level
    if (!lvl) return null
    const tasks = taskLog[today] || []
    return pickIdeaForContext(ideas, lvl, tasks)
  })
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const todayEnergy = energyLog[today] || null
  const currentLevel = todayEnergy?.level || null
  const todayTasks = taskLog[today] || []
  const todayEvening = eveningLog[today] || { energiequellen: '', haenger: '', morgen: '', saved: false }
  const doneCount = todayTasks.filter(t => t.done).length
  const allDone = todayTasks.length > 0 && doneCount === todayTasks.length
  const activeCoach = pendingCoach || coachMsg

  const handleEnergy = (level) => {
    if (currentLevel) return // einmal gesetzt, bleibt es
    const now = new Date()
    const berlinTime = new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit',
    }).format(now)
    setEnergyLog(prev => ({
      ...prev,
      [today]: { level, timestamp: now.toISOString(), berlinTime }
    }))
    setPendingCoach(getCoachMessage(level))
    setIdeaMsg(pickIdeaForContext(ideas, level, taskLog[today] || []))
  }

  const addTask = (label) => {
    if (!label.trim()) return
    if (todayTasks.some(t => t.label === label.trim())) return
    setTaskLog(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), { label: label.trim(), done: false, id: Date.now() }]
    }))
  }

  const toggleTask = (id) => {
    setTaskLog(prev => ({
      ...prev,
      [today]: prev[today].map(t => t.id === id ? { ...t, done: !t.done } : t)
    }))
  }

  const removeTask = (id) => {
    setTaskLog(prev => ({
      ...prev,
      [today]: prev[today].filter(t => t.id !== id)
    }))
  }

  const handleAdd = () => { addTask(input); setInput('') }

  const updateEvening = (field, value) => {
    setEveningLog(prev => ({
      ...prev,
      [today]: { ...(prev[today] || {}), [field]: value, saved: false }
    }))
  }

  const saveEvening = () => {
    setEveningLog(prev => ({
      ...prev,
      [today]: { ...todayEvening, saved: true, timestamp: new Date().toISOString() }
    }))
  }

  const suggestions = currentLevel
    ? SUGGESTIONS_BY_ENERGY[currentLevel].filter(s => !todayTasks.some(t => t.label === s))
    : []

  const greeting = () => {
    if (hour < 12) return 'Guten Morgen'
    if (hour < 18) return 'Hallo'
    return 'Guten Abend'
  }

  const levelObj = currentLevel ? ENERGY_LEVELS.find(e => e.value === currentLevel) : null

  return (
    <div className="screen">

      {/* ─── ABENDS: Tagesrückblick ─── */}
      {isEvening ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 2 }}>
              {new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
            </p>
            <h1 style={{ fontSize: '1.6rem' }}>Guten Abend 🌙</h1>
          </div>

          <Coach
            message={todayEvening.saved
              ? "Schön, dass du heute reflektiert hast. Was du aufschreibst, bleibt — und macht dich morgen klarer."
              : "Der Abend ist die beste Zeit zum Reflektieren. Nimm dir 3 Minuten — sie zahlen sich morgen aus."}
            icon="🌙"
          />

          {/* Tages-Snapshot */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: todayTasks.length > 0 ? 12 : 0 }}>
              {levelObj ? (
                <>
                  <span style={{ fontSize: '2rem' }}>{levelObj.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Energie: {levelObj.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Eingeloggt um {todayEnergy.berlinTime} Uhr
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Heute kein Energie-Check — das ist okay.
                </p>
              )}
            </div>
            {todayTasks.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Aufgaben:{' '}
                  <strong style={{ color: doneCount > 0 ? 'var(--green)' : 'var(--text)' }}>
                    {doneCount}/{todayTasks.length} erledigt
                  </strong>
                </div>
                {todayTasks.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.85rem', padding: '3px 0',
                    color: t.done ? 'var(--text-muted)' : 'var(--text)',
                    textDecoration: t.done ? 'line-through' : 'none',
                  }}>
                    <span style={{ color: t.done ? 'var(--green)' : 'var(--border)' }}>
                      {t.done ? '✓' : '○'}
                    </span>
                    {t.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reflexions-Fragen */}
          <div className="card" style={{ marginBottom: 12 }}>
            <ReflectionField
              label="Was hat dir heute Energie gegeben? 🌅"
              placeholder="z.B. Das Gespräch mit Laura, der Spaziergang, ein guter Kaffee …"
              value={todayEvening.energiequellen || ''}
              onChange={v => updateEvening('energiequellen', v)}
            />
            <div style={{ height: 16 }} />
            <ReflectionField
              label="Hattest du einen Hänger — an was lag es? 😶‍🌫️"
              placeholder="z.B. Nach dem Mittagessen bin ich nicht mehr reingekommen, weil …"
              value={todayEvening.haenger || ''}
              onChange={v => updateEvening('haenger', v)}
            />
            <div style={{ height: 16 }} />
            <ReflectionField
              label="Was machst du morgen konkret anders? 🌱"
              placeholder="z.B. Ich starte direkt mit der wichtigsten Aufgabe, bevor ich E-Mails öffne."
              value={todayEvening.morgen || ''}
              onChange={v => updateEvening('morgen', v)}
            />
          </div>

          <button
            className="btn-primary"
            onClick={saveEvening}
            style={{
              background: todayEvening.saved ? 'var(--green-light)' : 'var(--green)',
              marginBottom: 16,
              transition: 'background 0.3s',
            }}
          >
            {todayEvening.saved ? '✓ Gespeichert — gute Nacht 🌙' : 'Tagesrückblick speichern'}
          </button>
        </>
      ) : (

        /* ─── TAGS: Energie + Aufgaben ─── */
        <>
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 2 }}>
              {new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
            </p>
            <h1 style={{ fontSize: '1.6rem' }}>{greeting()} 👋</h1>
          </div>

          {/* ── Noch kein Level: Energie-Picker ── */}
          {!currentLevel && (
            <>
              <div className="card">
                <span className="label">Wie ist deine Energie heute?</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  {ENERGY_LEVELS.map(e => (
                    <button
                      key={e.value}
                      onClick={() => handleEnergy(e.value)}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 4, padding: '12px 4px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: '2px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{e.emoji}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-light)', textAlign: 'center' }}>
                        {e.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="empty-state">
                <div className="empty-state-icon">☀︎</div>
                <p>Wähle dein Energielevel —<br />der Coach passt deinen Tag daran an.</p>
              </div>
            </>
          )}

          {/* ── Level gesetzt: Tasks oben, Energie-Chip klein ── */}
          {currentLevel && (
            <>
              {/* Alles erledigt → ganz oben */}
              {allDone && (
                <div className="card slide-up" style={{
                  background: 'var(--green-pale)',
                  border: '1px solid var(--green)',
                  textAlign: 'center',
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🎉</div>
                  <div style={{ fontFamily: 'Lora, serif', fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>
                    Alles erledigt!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--green-light)' }}>
                    Das ist ein echter Fortschritt. Heute hast du geliefert.
                  </div>
                </div>
              )}

              {/* Coach */}
              {activeCoach && <Coach message={activeCoach} icon="✦" />}

              {/* Aufgaben-Karte */}
              <div className="card slide-up">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="label" style={{ marginBottom: 0 }}>Was willst du heute schaffen?</span>
                  {/* Energie-Chip klein */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '100px', padding: '3px 10px 3px 6px',
                  }}>
                    <span style={{ fontSize: '1rem' }}>{levelObj.emoji}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {levelObj.label}
                    </span>
                    {doneCount > 0 && (
                      <span style={{
                        marginLeft: 4,
                        fontSize: '0.7rem', fontWeight: 700,
                        color: 'var(--green)',
                      }}>
                        {doneCount}/{todayTasks.length}✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Input */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    ref={inputRef}
                    className="input-field"
                    placeholder="z.B. Vorbereitung REEV Gespräch …"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={handleAdd}
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

                {/* Vorschläge */}
                {suggestions.length > 0 && (
                  <div style={{ marginBottom: todayTasks.length > 0 ? 12 : 0 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>
                      Vorschläge
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => addTask(s)}
                          style={{
                            padding: '5px 12px', borderRadius: '100px',
                            border: '1.5px dashed var(--border)', background: 'transparent',
                            color: 'var(--text-muted)', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <span style={{ fontSize: '0.7rem' }}>+</span> {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task-Liste */}
                {todayTasks.length > 0 && (
                  <div style={{
                    borderTop: suggestions.length > 0 ? '1px solid var(--border)' : 'none',
                    paddingTop: suggestions.length > 0 ? 12 : 0,
                  }}>
                    {todayTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id)}
                        onRemove={() => removeTask(task.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tipp solange noch nichts erledigt */}
              {todayTasks.length > 0 && doneCount === 0 && (
                <div className="card" style={{ background: 'var(--amber-light)', border: '1px solid var(--amber)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.3rem' }}>💡</span>
                    <div style={{ fontSize: '0.85rem', color: '#78501A', lineHeight: 1.45 }}>
                      Fang mit der Aufgabe an, vor der du dich am meisten drückst.
                    </div>
                  </div>
                </div>
              )}

              {/* Ideen-Impuls vom Coach */}
              {ideaMsg && (
                <div className="card fade-in" style={{
                  background: 'var(--amber-light)',
                  border: '1px solid var(--amber)',
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#92600A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Coach · Impuls aus deinen Ideen
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#78501A', lineHeight: 1.55 }}>
                    {ideaMsg}
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function ReflectionField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
        {label}
      </label>
      <textarea
        className="input-field"
        placeholder={placeholder}
        rows={3}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ resize: 'none', lineHeight: 1.55 }}
      />
    </div>
  )
}

function TaskItem({ task, onToggle, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: 22, height: 22, borderRadius: 6,
          border: task.done ? 'none' : '2px solid var(--border)',
          background: task.done ? 'var(--green)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.15s', color: 'white', fontSize: '0.7rem',
        }}
      >
        {task.done ? '✓' : ''}
      </button>
      <span style={{
        flex: 1, fontSize: '0.9rem',
        color: task.done ? 'var(--text-muted)' : 'var(--text)',
        textDecoration: task.done ? 'line-through' : 'none',
        transition: 'all 0.15s', lineHeight: 1.4,
      }}>
        {task.label}
      </span>
      <button
        onClick={onRemove}
        style={{ color: 'var(--text-light)', fontSize: '1rem', padding: '0 4px', flexShrink: 0 }}
      >×</button>
    </div>
  )
}
