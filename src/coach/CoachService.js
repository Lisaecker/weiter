import { buildSystemPrompt } from './systemPrompt.js'

function getBerlinDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
}

function parse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback }
  catch { return fallback }
}

export function buildContext() {
  const profile = parse('userProfile', {})
  const energyLog = parse('energyLog', {})
  const taskLog = parse('taskLog', {})
  const jobs = parse('jobs', [])
  const growthFields = parse('growthFields', [])
  const ideas = parse('ideas', [])

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

  return {
    situationLabel: profile.situationLabel,
    feelingLabel: profile.feelingLabel,
    answers: profile.answers || [],
    questions: profile.questions || [],
    energyHistory,
    todayTasks,
    jobs,
    growthFields,
    ideas,
  }
}

export async function askCoach(userMessage) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Kein API Key konfiguriert')

  const context = buildContext()
  const systemPrompt = buildSystemPrompt(context)

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
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API Fehler ${res.status}`)
  }

  const data = await res.json()
  return data.content[0]?.text || ''
}
