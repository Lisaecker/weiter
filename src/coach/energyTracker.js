function getBerlinDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
}

const ENERGY_VALUES = { '😴': 1, '😕': 2, '😐': 3, '🙂': 4, '⚡': 5 }
const EMOJI_MAP = { 1: '😴', 2: '😕', 3: '😐', 4: '🙂', 5: '⚡' }

export function saveEnergyEntry(emoji) {
  const today = getBerlinDate()

  // Detaillierter Log mit Zeitstempel
  const key = `energy_${today}`
  let existing = []
  try { existing = JSON.parse(localStorage.getItem(key) || '[]') } catch { /* ignore */ }
  existing.push({ time: new Date().toISOString(), value: ENERGY_VALUES[emoji], emoji })
  localStorage.setItem(key, JSON.stringify(existing))

  // Tages-Durchschnitt berechnen
  const avg = existing.reduce((sum, e) => sum + e.value, 0) / existing.length
  const rounded = Math.round(avg)
  localStorage.setItem(`energy_avg_${today}`, JSON.stringify({
    date: today, average: avg, emoji: EMOJI_MAP[rounded], entries: existing.length,
  }))

  // Hauptformat für Verlauf + CoachService kompatibel halten
  const energyLog = JSON.parse(localStorage.getItem('energyLog') || '{}')
  energyLog[today] = { level: rounded }
  localStorage.setItem('energyLog', JSON.stringify(energyLog))
}

export function hasEnergyToday() {
  const today = getBerlinDate()
  try {
    const entries = JSON.parse(localStorage.getItem(`energy_${today}`) || '[]')
    return entries.length > 0
  } catch { return false }
}
