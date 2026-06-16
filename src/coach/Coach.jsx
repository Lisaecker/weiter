import { useState, useEffect, useRef } from 'react'
import { askCoach } from './CoachService.js'

export default function Coach({ userMessage, fallback = null, icon = '✦' }) {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetchedFor = useRef(null)

  useEffect(() => {
    if (!userMessage || fetchedFor.current === userMessage) return

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setMessage(fallback)
      return
    }

    fetchedFor.current = userMessage
    setLoading(true)

    askCoach(userMessage)
      .then(msg => {
        setMessage(msg)
        setLoading(false)
      })
      .catch(() => {
        setMessage(fallback)
        setLoading(false)
      })
  }, [userMessage, fallback])

  if (!loading && !message) return null

  return (
    <div
      className="fade-in"
      style={{
        background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        marginBottom: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', right: -20, top: -20,
        width: 100, height: 100,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 32, height: 32,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0, marginTop: 2,
        }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)', marginBottom: 6,
          }}>
            Coach
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', paddingTop: 2 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.5)',
                  animation: 'coachBounce 1.2s ease infinite',
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          ) : (
            <p style={{
              color: 'white', fontSize: '0.9rem',
              lineHeight: 1.6, margin: 0,
            }}>
              {message}
            </p>
          )}
        </div>
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
