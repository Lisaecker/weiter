import { useState } from 'react'

export default function Coach({ message, icon = '✦', accent = false }) {
  const [expanded, setExpanded] = useState(true)

  if (!message) return null

  return (
    <div
      className="fade-in"
      style={{
        background: accent
          ? 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)'
          : 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        marginBottom: '16px',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Decorative circle */}
      <div style={{
        position: 'absolute',
        right: -20,
        top: -20,
        width: 100,
        height: 100,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
      }} />
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{
          width: 32,
          height: 32,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          flexShrink: 0,
          marginTop: 2,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: 4,
          }}>
            Coach
          </div>
          {expanded && (
            <p style={{
              color: 'white',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              fontFamily: "'Inter', sans-serif",
            }}>
              {message}
            </p>
          )}
          {!expanded && (
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
            }}>
              Tippe zum Lesen …
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
