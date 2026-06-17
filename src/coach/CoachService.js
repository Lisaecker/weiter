import { buildSystemPrompt } from './systemPrompt.js'

function getBerlinDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
}

function parse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}

function getDaysUntil(dateStr) {
  const today = new Date(getBerlinDate())
  const target = new Date(dateStr)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

export function buildContext() {
  const profile = parse('userProfile', {})
  const energyLog = parse('energyLog', {})
  const taskLog = parse('taskLog', {})
  const growthFields = parse('growthFields', [])
  const interviews = parse('interviews', [])

  const today = getBerlinDate()
  const todayTasks = taskLog[today] || []

  const energyHistory = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(d)
    const entry = energyLog[dateStr]
    if (entry) {
      energyHistory.push({
        date: new Intl.DateTimeFormat('de-DE', {
          weekday: 'short', day: 'numeric', month: 'numeric',
        }).format(d),
        level: entry?.level ?? entry,
      })
    }
  }

  // Interview-Kontext aufbereiten
  const upcomingInterviews = interviews
    .filter(iv => iv.status === 'upcoming')
    .map(iv => ({ ...iv, daysUntil: getDaysUntil(iv.date) }))
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const nextInterview = upcomingInterviews[0] || null

  const recentDoneInterview = interviews
    .filter(iv => iv.status === 'done')
    .map(iv => ({ ...iv, daysAgo: -getDaysUntil(iv.date) }))
    .filter(iv => iv.daysAgo >= 0 && iv.daysAgo <= 3)
    .sort((a, b) => a.daysAgo - b.daysAgo)[0] || null

  return {
    situationLabel: profile.situationLabel,
    feelingLabel: profile.feelingLabel,
    answers: profile.answers || [],
    questions: profile.questions || [],
    energyHistory,
    todayTasks,
    growthFields,
    nextInterview,
    recentDoneInterview,
    upcomingInterviews,
  }
}

async function callApi(systemPrompt, messages, maxTokens = 350) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Kein API Key konfiguriert')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API Fehler ${res.status}`)
  }

  const data = await res.json()
  return data.content[0]?.text || ''
}

// Einzel-Nachricht (für Coach-Komponente, Evening-Summary etc.)
export async function askCoach(userMessage) {
  const context = buildContext()
  const systemPrompt = buildSystemPrompt(context)
  return callApi(systemPrompt, [{ role: 'user', content: userMessage }])
}

// Multi-Turn Chat (für Heute-Screen)
export async function askCoachChat(messages) {
  const context = buildContext()
  const systemPrompt = buildSystemPrompt(context)
  return callApi(systemPrompt, messages, 250)
}
