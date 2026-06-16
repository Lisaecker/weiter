import { useState, useRef, useEffect } from 'react'

const SITUATIONS = [
  { id: 'job-weg',    label: 'Mein Job ist weg — ich starte neu' },
  { id: 'raus',       label: 'Ich bin noch drin — aber will raus' },
  { id: 'elternzeit', label: 'Ich komme zurück nach der Elternzeit' },
  { id: 'pause',      label: 'Ich starte neu nach einer Pause' },
  { id: 'erstmal',    label: 'Ich starte zum ersten Mal' },
]

const FEELINGS = [
  { value: 1, emoji: '😴', label: 'Erschöpft' },
  { value: 2, emoji: '😕', label: 'Unsicher' },
  { value: 3, emoji: '😐', label: 'Ok' },
  { value: 4, emoji: '🙂', label: 'Motiviert' },
  { value: 5, emoji: '⚡', label: 'Bereit' },
]

// Kontextbasierte Coach-Fragen [frage1, frage2]
const COACH_QUESTIONS = {
  'job-weg': {
    1: ["Wie lange bist du schon in dieser Situation?", "Hast du schon erste Schritte unternommen — oder stehst du noch ganz am Anfang?"],
    2: ["Was macht dir dabei am meisten Sorgen?", "Gibt es etwas, das du in dieser Phase auf keinen Fall verlieren willst?"],
    3: ["Was hat dich in deinem letzten Job am meisten erfüllt?", "Weißt du schon grob, in welche Richtung es gehen soll?"],
    4: ["Was hat dich zuletzt beruflich wirklich begeistert?", "Gibt es etwas, das du diesmal anders machen willst?"],
    5: ["Weißt du schon, wonach du suchst — oder ist das noch offen?", "Was soll in 6 Monaten anders sein als heute?"],
  },
  'raus': {
    1: ["Was erschöpft dich dort gerade am meisten?", "Gibt es etwas, das dich noch hält?"],
    2: ["Was macht dich unsicher beim Gedanken, zu gehen?", "Was bräuchtest du, um mutiger zu sein?"],
    3: ["Weißt du schon, wohin — oder geht es erst mal ums Loslassen?", "Wann wäre für dich der richtige Zeitpunkt?"],
    4: ["Was hält dich noch zurück?", "Hast du schon eine Vorstellung, wie es danach aussehen soll?"],
    5: ["Was ist dein nächster konkreter Schritt?", "Gibt es jemanden, dem du davon erzählt hast?"],
  },
  'elternzeit': {
    1: ["Wie lang warst du raus?", "Was beschäftigt dich beim Gedanken an den Wiedereinstieg am meisten?"],
    2: ["Machst du dir Sorgen, dass sich zu viel verändert hat?", "Wie war die Elternzeit für dich — kraftgebend oder eher zermürbend?"],
    3: ["Wie lang warst du raus?", "Gibt es etwas, das du diesmal anders haben möchtest als vorher?"],
    4: ["Wie lang warst du raus?", "Freust du dich auf etwas Bestimmtes beim Wiedereinstieg?"],
    5: ["Was hast du aus der Elternzeit mitgenommen, das dir jetzt hilft?", "Wann möchtest du wieder einsteigen?"],
  },
  'pause': {
    1: ["Was war das für eine Pause?", "Fühlst du dich schon wieder bereit — oder brauchst du noch Zeit?"],
    2: ["Woran liegt die Unsicherheit — an dir oder am Markt?", "Was bräuchtest du, um dich sicherer zu fühlen?"],
    3: ["Was nimmst du aus der Pause mit?", "Was soll jetzt anders sein als davor?"],
    4: ["Was hat die Pause dir gegeben?", "In welche Richtung zieht es dich jetzt?"],
    5: ["Was ist dein erster konkreter Schritt?", "Gibt es jemanden, der dich dabei begleitet?"],
  },
  'erstmal': {
    1: ["Was hat dich zu diesem Schritt gebracht?", "Was macht dir beim Start am meisten Sorgen?"],
    2: ["Was hat dich unsicher gemacht — gab es einen Auslöser?", "Was wäre ein kleiner Schritt, der sich gut anfühlen würde?"],
    3: ["Was hat dich zu diesem Schritt bewogen?", "Gibt es einen Bereich, der dich besonders interessiert?"],
    4: ["Was hat dich motiviert anzufangen?", "Weißt du schon, in welche Richtung es gehen soll?"],
    5: ["Was treibt dich an?", "Gibt es jemanden, von dem du dir Unterstützung erhoffst?"],
  },
}

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(1)
  const [situation, setSituation] = useState(null)
  const [feeling, setFeeling] = useState(null)
  const [chatStep, setChatStep] = useState(0) // 0 = noch nicht gestartet, 1 = frage1, 2 = frage2, 3 = fertig
  const [answers, setAnswers] = useState(['', ''])
  const [inputVal, setInputVal] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef(null)
  const chatEndRef = useRef(null)

  const questions = situation && feeling
    ? COACH_QUESTIONS[situation]?.[feeling] || ["Erzähl mir mehr dazu.", "Was wünschst du dir für die nächsten Wochen?"]
    : []

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const startChat = () => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages([{ from: 'coach', text: questions[0] }])
      setChatStep(1)
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 900)
  }

  const sendAnswer = () => {
    if (!inputVal.trim()) return
    const val = inputVal.trim()
    setInputVal('')

    if (chatStep === 1) {
      setAnswers(prev => [val, prev[1]])
      setMessages(prev => [...prev, { from: 'user', text: val }])
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, { from: 'coach', text: questions[1] }])
        setChatStep(2)
        setTimeout(() => inputRef.current?.focus(), 100)
      }, 1000)
    } else if (chatStep === 2) {
      setAnswers(prev => [prev[0], val])
      setMessages(prev => [...prev, { from: 'user', text: val }])
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, {
          from: 'coach',
          text: 'Danke — ich habe ein gutes Bild von dir. Lass uns loslegen. 🌱',
          final: true,
        }])
        setChatStep(3)
      }, 900)
    }
  }

  const finish = () => {
    const situationLabel = SITUATIONS.find(s => s.id === situation)?.label || ''
    const feelingObj = FEELINGS.find(f => f.value === feeling)
    onDone({
      situation,
      situationLabel,
      feeling,
      feelingEmoji: feelingObj?.emoji,
      feelingLabel: feelingObj?.label,
      answers,
      questions,
      completedAt: new Date().toISOString(),
    })
  }

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      padding: '0 0 40px',
    }}>

      {/* Progress dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        padding: '52px 0 32px',
      }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            width: s === step ? 24 : 8,
            height: 8,
            borderRadius: 100,
            background: s <= step ? 'var(--green)' : 'var(--border)',
            transition: 'all 0.35s ease',
          }} />
        ))}
      </div>

      {/* ── Schritt 1: Situation ── */}
      {step === 1 && (
        <div className="fade-in" style={{ flex: 1, padding: '0 24px' }}>
          <h1 style={{
            fontFamily: 'Lora, serif',
            fontSize: '1.55rem',
            lineHeight: 1.3,
            marginBottom: 8,
            color: 'var(--text)',
          }}>
            Was beschreibt deine Situation gerade am besten?
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.5 }}>
            Keine richtige oder falsche Antwort.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SITUATIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSituation(s.id)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${situation === s.id ? 'var(--green)' : 'var(--border)'}`,
                  background: situation === s.id ? 'var(--green-pale)' : 'var(--bg-card)',
                  color: situation === s.id ? 'var(--green)' : 'var(--text)',
                  fontSize: '0.95rem',
                  fontWeight: situation === s.id ? 600 : 400,
                  textAlign: 'left',
                  lineHeight: 1.4,
                  transition: 'all 0.15s',
                  boxShadow: 'var(--shadow)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={() => situation && setStep(2)}
            style={{
              marginTop: 32,
              opacity: situation ? 1 : 0.4,
              pointerEvents: situation ? 'auto' : 'none',
            }}
          >
            Weiter →
          </button>
        </div>
      )}

      {/* ── Schritt 2: Gefühl ── */}
      {step === 2 && (
        <div className="fade-in" style={{ flex: 1, padding: '0 24px' }}>
          <h1 style={{
            fontFamily: 'Lora, serif',
            fontSize: '1.55rem',
            lineHeight: 1.3,
            marginBottom: 8,
            color: 'var(--text)',
          }}>
            Wie fühlst du dich aktuell damit?
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.5 }}>
            Ehrlich ist am hilfreichsten.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEELINGS.map(f => (
              <button
                key={f.value}
                onClick={() => setFeeling(f.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 20px',
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${feeling === f.value ? 'var(--green)' : 'var(--border)'}`,
                  background: feeling === f.value ? 'var(--green-pale)' : 'var(--bg-card)',
                  color: feeling === f.value ? 'var(--green)' : 'var(--text)',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>{f.emoji}</span>
                <span style={{ fontSize: '1rem', fontWeight: feeling === f.value ? 600 : 400 }}>
                  {f.label}
                </span>
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={() => { if (feeling) { setStep(3); setTimeout(startChat, 400) } }}
            style={{
              marginTop: 32,
              opacity: feeling ? 1 : 0.4,
              pointerEvents: feeling ? 'auto' : 'none',
            }}
          >
            Weiter →
          </button>
        </div>
      )}

      {/* ── Schritt 3: Coach-Chat ── */}
      {step === 3 && (
        <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
          <h1 style={{
            fontFamily: 'Lora, serif',
            fontSize: '1.4rem',
            lineHeight: 1.3,
            marginBottom: 4,
            color: 'var(--text)',
          }}>
            Ich lerne dich kennen.
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            Zwei kurze Fragen — dann geht's los.
          </p>

          {/* Context-Chip */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.78rem', padding: '4px 12px', borderRadius: '100px',
              background: 'var(--green-pale)', color: 'var(--green)', fontWeight: 500,
            }}>
              {SITUATIONS.find(s => s.id === situation)?.label}
            </span>
            <span style={{
              fontSize: '0.78rem', padding: '4px 12px', borderRadius: '100px',
              background: 'var(--bg-card)', color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}>
              {FEELINGS.find(f => f.value === feeling)?.emoji} {FEELINGS.find(f => f.value === feeling)?.label}
            </span>
          </div>

          {/* Chat-Verlauf */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.from === 'coach' ? 'flex-start' : 'flex-end',
              }}>
                {msg.from === 'coach' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', color: 'white', flexShrink: 0,
                    marginRight: 8, marginTop: 2,
                  }}>✦</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.from === 'coach'
                    ? '4px 16px 16px 16px'
                    : '16px 4px 16px 16px',
                  background: msg.from === 'coach' ? 'var(--bg-card)' : 'var(--green)',
                  color: msg.from === 'coach' ? 'var(--text)' : 'white',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  boxShadow: 'var(--shadow)',
                  animation: 'fadeIn 0.25s ease',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', color: 'white',
                }}>✦</div>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '4px 16px 16px 16px',
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow)',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--text-light)',
                      animation: `bounce 1.2s ease infinite`,
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          {chatStep > 0 && chatStep < 3 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                className="input-field"
                placeholder="Deine Antwort …"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAnswer()}
                style={{ flex: 1 }}
              />
              <button
                onClick={sendAnswer}
                style={{
                  width: 44, height: 44,
                  background: inputVal.trim() ? 'var(--green)' : 'var(--border)',
                  color: 'white', borderRadius: 'var(--radius-sm)',
                  fontSize: '1.1rem', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >→</button>
            </div>
          )}

          {chatStep === 3 && (
            <button
              className="btn-primary"
              onClick={finish}
              style={{ marginTop: 8, fontSize: '1rem', padding: '14px 20px' }}
            >
              Los geht's 🌱
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
