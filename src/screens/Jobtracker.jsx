import { useState, useRef } from 'react'
import Coach from '../components/Coach.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { jobTrackerInsights } from '../data/coachMessages.js'

const STATUSES = [
  { id: 'beworben', label: 'Beworben', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'gespräch', label: 'Im Gespräch', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'final', label: 'Finalrunde', color: '#E8A838', bg: '#FFF3CD' },
  { id: 'absage', label: 'Absage', color: '#EF4444', bg: '#FEF2F2' },
]

const getStatus = (id) => STATUSES.find(s => s.id === id) || STATUSES[0]

export default function Jobtracker() {
  const [jobs, setJobs] = useLocalStorage('jobs', [])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ company: '', role: '', status: 'beworben', cvName: '', cvData: '' })
  const [filter, setFilter] = useState('all')
  const [openJob, setOpenJob] = useState(null)
  const fileRef = useRef(null)

  const addJob = () => {
    if (!form.company.trim()) return
    setJobs(prev => [{
      id: Date.now(),
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      cvName: form.cvName,
      cvData: form.cvData,
      date: new Date().toISOString().slice(0, 10),
      feedback: '',
      reflection: '',
    }, ...prev])
    setForm({ company: '', role: '', status: 'beworben', cvName: '', cvData: '' })
    setShowForm(false)
  }

  const updateJob = (id, patch) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j))
  }

  const deleteJob = (id) => {
    setJobs(prev => prev.filter(j => j.id !== id))
    if (openJob === id) setOpenJob(null)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm(p => ({ ...p, cvName: file.name, cvData: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)
  const counts = STATUSES.reduce((acc, s) => {
    acc[s.id] = jobs.filter(j => j.status === s.id).length
    return acc
  }, {})

  if (openJob !== null) {
    const job = jobs.find(j => j.id === openJob)
    if (job) return (
      <JobDetail
        job={job}
        onUpdate={(patch) => updateJob(job.id, patch)}
        onDelete={() => deleteJob(job.id)}
        onBack={() => setOpenJob(null)}
      />
    )
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem' }}>Jobtracker</h1>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setShowForm(s => !s)}
        >
          <span style={{ fontSize: '1.1rem' }}>{showForm ? '×' : '+'}</span>
          {showForm ? 'Abbrechen' : 'Job'}
        </button>
      </div>

      <Coach message={jobTrackerInsights(jobs)} icon="⌖" />

      {/* Statistik-Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {STATUSES.map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(filter === s.id ? 'all' : s.id)}
            style={{
              background: filter === s.id ? s.bg : 'var(--bg-card)',
              border: filter === s.id ? `2px solid ${s.color}` : '2px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 6px',
              boxShadow: 'var(--shadow)',
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{counts[s.id]}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Formular */}
      {showForm && (
        <div className="card slide-up" style={{ border: '1px solid var(--green)', marginBottom: 16 }}>
          <span className="label">Neuer Job</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              className="input-field"
              placeholder="Unternehmen *"
              value={form.company}
              onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
            />
            <input
              className="input-field"
              placeholder="Stelle / Rolle"
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            />

            {/* Status */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setForm(p => ({ ...p, status: s.id }))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '100px',
                    border: `1.5px solid ${form.status === s.id ? s.color : 'var(--border)'}`,
                    background: form.status === s.id ? s.bg : 'transparent',
                    color: form.status === s.id ? s.color : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Lebenslauf Upload */}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: form.cvName ? '1.5px solid var(--green)' : '1.5px dashed var(--border)',
                background: form.cvName ? 'var(--green-pale)' : 'transparent',
                color: form.cvName ? 'var(--green)' : 'var(--text-muted)',
                fontSize: '0.875rem',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>📄</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.cvName || 'Lebenslauf hochladen (PDF, Word)'}
              </span>
              {form.cvName && (
                <span
                  onClick={e => { e.stopPropagation(); setForm(p => ({ ...p, cvName: '', cvData: '' })) }}
                  style={{ fontSize: '1rem', color: 'var(--text-muted)' }}
                >
                  ×
                </span>
              )}
            </button>

            <button className="btn-primary" onClick={addJob}>Job speichern</button>
          </div>
        </div>
      )}

      {/* Job-Liste */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⌖</div>
          <p>Noch keine Jobs eingetragen.<br />Jede Bewerbung zählt.</p>
        </div>
      ) : (
        filtered.map(job => (
          <JobCard
            key={job.id}
            job={job}
            onStatusChange={(status) => updateJob(job.id, { status })}
            onOpen={() => setOpenJob(job.id)}
          />
        ))
      )}
    </div>
  )
}

function JobCard({ job, onStatusChange, onOpen }) {
  const [showStatus, setShowStatus] = useState(false)
  const s = getStatus(job.status)
  const hasNotes = job.feedback || job.reflection

  return (
    <div className="card fade-in" style={{ marginBottom: 10 }}>
      {/* Hauptzeile — Klick öffnet Detail */}
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
        onClick={onOpen}
      >
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: s.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: s.color,
          flexShrink: 0,
        }}>
          {job.company[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>{job.company}</div>
          {job.role && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>{job.role}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status-Badge — Tipp toggelt Quick-Wechsel */}
            <button
              onClick={e => { e.stopPropagation(); setShowStatus(v => !v) }}
              className="badge"
              style={{
                background: s.bg,
                color: s.color,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                border: showStatus ? `1.5px solid ${s.color}` : '1.5px solid transparent',
              }}
            >
              {s.label}
              <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▾</span>
            </button>
            {job.cvName && <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>📄 CV</span>}
            {hasNotes && <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>✏️ Notizen</span>}
          </div>
        </div>
        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginTop: 2 }}>›</span>
      </div>

      {/* Quick-Status-Wechsel */}
      {showStatus && (
        <div className="slide-up" style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}>
          {STATUSES.map(st => (
            <button
              key={st.id}
              onClick={() => { onStatusChange(st.id); setShowStatus(false) }}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                border: `1.5px solid ${job.status === st.id ? st.color : 'var(--border)'}`,
                background: job.status === st.id ? st.bg : 'transparent',
                color: job.status === st.id ? st.color : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: job.status === st.id ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {job.status === st.id ? '✓ ' : ''}{st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function JobDetail({ job, onUpdate, onDelete, onBack }) {
  const s = getStatus(job.status)
  const [feedback, setFeedback] = useState(job.feedback || '')
  const [reflection, setReflection] = useState(job.reflection || '')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  const save = () => {
    onUpdate({ feedback, reflection })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onUpdate({ cvName: file.name, cvData: ev.target.result })
    reader.readAsDataURL(file)
  }

  return (
    <div className="screen">
      {/* Back */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', marginBottom: 20, fontSize: '0.9rem', fontWeight: 500 }}
      >
        ‹ Zurück
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: s.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          fontWeight: 700,
          color: s.color,
          flexShrink: 0,
        }}>
          {job.company[0].toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '1.3rem', marginBottom: 2 }}>{job.company}</h1>
          {job.role && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 6 }}>{job.role}</p>}
          <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
        </div>
      </div>

      {/* Status ändern */}
      <div className="card" style={{ marginBottom: 12 }}>
        <span className="label">Status</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUSES.map(st => (
            <button
              key={st.id}
              onClick={() => onUpdate({ status: st.id })}
              style={{
                padding: '7px 14px',
                borderRadius: '100px',
                border: `1.5px solid ${job.status === st.id ? st.color : 'var(--border)'}`,
                background: job.status === st.id ? st.bg : 'transparent',
                color: job.status === st.id ? st.color : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: job.status === st.id ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lebenslauf */}
      <div className="card" style={{ marginBottom: 12 }}>
        <span className="label">Lebenslauf</span>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*" style={{ display: 'none' }} onChange={handleFile} />
        {job.cvName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.cvName}
              </div>
              {job.cvData && (
                <a
                  href={job.cvData}
                  download={job.cvName}
                  style={{ fontSize: '0.75rem', color: 'var(--green)', textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}
                >
                  Herunterladen
                </a>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6 }}
            >
              Ersetzen
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px dashed var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              width: '100%',
            }}
          >
            <span>📄</span> Lebenslauf hochladen (PDF, Word)
          </button>
        )}
      </div>

      {/* Feedback von Unternehmen */}
      <div className="card" style={{ marginBottom: 12 }}>
        <span className="label">Feedback vom Unternehmen</span>
        <textarea
          className="input-field"
          placeholder="Was hat das Unternehmen zurückgemeldet? Kritikpunkte, Lob, Begründung der Absage …"
          rows={4}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          style={{ resize: 'none', lineHeight: 1.55 }}
        />
      </div>

      {/* Selbstreflexion */}
      <div className="card" style={{ marginBottom: 16 }}>
        <span className="label">Selbstreflexion nach dem Interview</span>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginBottom: 10,
          padding: '10px 12px',
          background: 'var(--bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            💭 <em>Was lief gut? Was würdest du anders machen? Wie hat sich das Gespräch angefühlt?</em>
          </p>
        </div>
        <textarea
          className="input-field"
          placeholder="Meine Gedanken nach dem Gespräch …"
          rows={5}
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          style={{ resize: 'none', lineHeight: 1.55 }}
        />
      </div>

      {/* Speichern */}
      <button
        className="btn-primary"
        onClick={save}
        style={{
          background: saved ? 'var(--green-light)' : 'var(--green)',
          marginBottom: 12,
          transition: 'background 0.3s',
        }}
      >
        {saved ? '✓ Gespeichert' : 'Notizen speichern'}
      </button>

      {/* Löschen */}
      <button
        onClick={() => { if (window.confirm('Job wirklich löschen?')) onDelete() }}
        style={{ color: '#EF4444', fontSize: '0.85rem', width: '100%', padding: '10px', textAlign: 'center' }}
      >
        Job löschen
      </button>
    </div>
  )
}
