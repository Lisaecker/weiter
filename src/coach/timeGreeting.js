export function getTimeGreeting() {
  const hour = new Date().getHours()

  if (hour >= 6 && hour <= 10) return { text: 'Hey, wie geht es dir heute?', askEnergy: true }
  if (hour > 10 && hour <= 12) return { text: 'Hey, wie lief dein Vormittag?', askEnergy: true }
  if (hour > 12 && hour <= 15) return { text: 'Halber Tag ist rum — wie sieht es bei dir aus?', askEnergy: true }
  if (hour > 15 && hour <= 18) return { text: 'Wie war dein Nachmittag?', askEnergy: true }
  if (hour > 18 && hour <= 20) return { text: 'Jetzt ist ein guter Moment zu reflektieren. Wie war dein Tag heute?', askEnergy: true }

  return null
}
