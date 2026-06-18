function getBerlinDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
}

export function extractTrackingData(userMessage) {
  const msg = userMessage.toLowerCase()
  const data = { date: getBerlinDate(), bewerbungen: 0, interviews: 0, sport: false }

  const bewerbungMatch = msg.match(/(\d+)\s*(bewerbung|bewerbungen|beworben)/)
  if (bewerbungMatch) data.bewerbungen = parseInt(bewerbungMatch[1])
  if (msg.includes('bewerbung raus') || msg.includes('beworben')) data.bewerbungen = Math.max(data.bewerbungen, 1)

  const interviewMatch = msg.match(/(\d+)\s*(interview|gespräch|gespräche|call)/)
  if (interviewMatch) data.interviews = parseInt(interviewMatch[1])
  if (msg.includes('interview') || msg.includes('gespräch gehabt')) data.interviews = Math.max(data.interviews, 1)

  if (['sport', 'laufen', 'training', 'gym', 'schwimmen', 'joggen', 'workout'].some(w => msg.includes(w))) {
    data.sport = true
  }

  return data
}

export function saveTrackingData(newData) {
  const key = `tracking_${newData.date}`
  let existing = {}
  try { existing = JSON.parse(localStorage.getItem(key) || '{}') } catch { /* ignore */ }
  const merged = {
    date: newData.date,
    bewerbungen: (existing.bewerbungen || 0) + newData.bewerbungen,
    interviews: (existing.interviews || 0) + newData.interviews,
    sport: existing.sport || newData.sport,
  }
  localStorage.setItem(key, JSON.stringify(merged))
}
