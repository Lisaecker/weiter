const tabs = [
  { id: 'heute', label: 'Heute', icon: '◎' },
  { id: 'wachstum', label: 'Wachstum', icon: '↑' },
  { id: 'verlauf', label: 'Verlauf', icon: '☀︎' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      height: 'var(--tab-height)',
      background: 'rgba(250,250,247,0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '8px 4px',
              transition: 'all 0.15s',
              color: isActive ? 'var(--green)' : 'var(--text-light)',
            }}
          >
            <span style={{
              fontSize: '1.2rem',
              lineHeight: 1,
              transform: isActive ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.15s',
            }}>
              {tab.icon}
            </span>
            <span style={{
              fontSize: '0.6rem',
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: 24,
                height: 2,
                background: 'var(--green)',
                borderRadius: '2px 2px 0 0',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
