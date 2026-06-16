// Coach-Nachrichten basierend auf Kontext
export const energyMessages = {
  1: [
    "Heute ist ein Tag zum Regenerieren — und das ist völlig in Ordnung. Dein Körper und Geist brauchen diese Pausen genauso wie die aktiven Phasen.",
    "Manchmal ist wenig Energie ein Signal. Was braucht gerade deine Aufmerksamkeit — nach innen?",
    "Ruhige Tage gehören zur Transformation dazu. Kleine Schritte zählen auch.",
  ],
  2: [
    "Du bist dabei, auch wenn es sich gerade schwer anfühlt. Was wäre heute ein winziger Schritt, der sich gut anfühlt?",
    "Etwas müde heute — ganz normal in intensiven Phasen. Gönn dir was, das dich ein bisschen auflädt.",
    "Zähe Tage sind oft die wertvollsten. Was möchtest du trotzdem anpacken?",
  ],
  3: [
    "Solider Tag. Du hast die Mitte — von hier kannst du in beide Richtungen.",
    "Gute Basis heute. Was ist die eine Sache, die du erledigen willst?",
    "Neutral ist okay. Was würde den Tag für dich rund machen?",
  ],
  4: [
    "Schön, du bist im Fluss! Jetzt wäre ein guter Moment für die Dinge, die Konzentration brauchen.",
    "Gute Energie heute — nutz sie für das, was wirklich wichtig ist.",
    "Du strahlst heute Klarheit aus. Was willst du damit anpacken?",
  ],
  5: [
    "🚀 Volle Power! Heute ist ein Tag für mutige Schritte — schreib die E-Mail, ruf an, zeig dich.",
    "Deine beste Energie des Tages. Mach das eine Ding, vor dem du dich schon zu lange drückst.",
    "Feuer! Was hast du schon zu lange aufgeschoben? Jetzt ist der Moment.",
  ],
}

export const jobTrackerInsights = (jobs) => {
  if (!jobs.length) return "Trag deinen ersten Job ein — auch Absagen sind wertvolle Daten. Du lernst bei jeder Bewerbung."

  const beworben = jobs.filter(j => j.status === 'beworben').length
  const gespräch = jobs.filter(j => j.status === 'gespräch').length
  const final = jobs.filter(j => j.status === 'final').length
  const absage = jobs.filter(j => j.status === 'absage').length

  if (final > 0) return `🔥 Du bist bei ${final} Job${final > 1 ? 's' : ''} in der Finalrunde! Das ist das Ergebnis deiner Arbeit. Bleib fokussiert und authentisch.`
  if (gespräch > 0 && beworben > 3) return `Du hast ${gespräch} aktive Gespräch${gespräch > 1 ? 'e' : ''} — das ist real. Dein Netz arbeitet für dich. ${beworben} weitere Bewerbungen zeigen, dass du aktiv bist.`
  if (absage > beworben && absage > 2) return `${absage} Absagen zeigen, dass du dich traust. Jede Absage bringt dich näher. Schau: Was lernst du daraus für die nächste Bewerbung?`
  if (beworben > 5) return `${beworben} Bewerbungen — du bist aktiv! Qualität schlägt Quantität. Gibt es 2-3, auf die du dich wirklich fokussieren willst?`
  return `${jobs.length} Job${jobs.length > 1 ? 's' : ''} im Tracker. Jeder Eintrag ist ein Schritt nach vorne.`
}

export const growthMessages = {
  'Selbstvertrauen': [
    "Steh heute einmal bewusst für deine Meinung — auch wenn es sich komisch anfühlt.",
    "Erinnere dich an einen Moment, in dem du stolz auf dich warst. Was hat das möglich gemacht?",
    "Selbstvertrauen wächst durch Beweise. Was hast du heute bewiesen?",
  ],
  'Auftreten': [
    "Nimm dir heute 2 Minuten für eine 'Power Pose' vor einem wichtigen Gespräch. Klingt komisch, hilft wirklich.",
    "Wie klingst du, wenn du über dich sprichst? Übe einen Satz, der sich stark anfühlt.",
    "Auftreten ist auch Energie. Wie möchtest du heute wahrgenommen werden?",
  ],
  'Netzwerken': [
    "Schreib heute einer Person eine kurze, echte Nachricht — ohne Hintergedanken.",
    "Netzwerken ist geben, nicht nehmen. Was kannst du gerade teilen?",
    "Wer hat dir früher geholfen? Melde dich bei jemandem — einfach so.",
  ],
  'default': [
    "Kleine tägliche Übungen verändern alles. Was ist dein Micro-Commitment für heute?",
    "Wachstum passiert zwischen den Komfortzonen. Wo bist du gerade?",
    "Jede Übung zählt — auch wenn sie sich klein anfühlt.",
  ],
}

export const progressSummaries = (days, totalJobs, ideas) => {
  const msgs = [
    `Du bist im Prozess — und der Prozess funktioniert. ${totalJobs > 0 ? `${totalJobs} Jobs im Tracker.` : ''} ${ideas > 0 ? `${ideas} Ideen gesammelt.` : ''}`,
    "Transformation ist kein Sprint. Du bist genau da, wo du sein sollst.",
    "Jeder Tag, an dem du aufmachst und weitermachst, ist ein Erfolg.",
  ]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

export const ideaCoachMessages = [
  "Deine Ideen zeigen, wer du wirklich bist — nicht nur was du kannst.",
  "Kraulen lernen, Lemon Tart perfektionieren — das klingt nach einem Leben, das sich lohnt.",
  "Die besten Karriereideen kommen oft aus dem Freizeitbereich. Was davon hat Potenzial?",
  "Halte diese Wünsche lebendig. Sie sind dein Kompass.",
]
