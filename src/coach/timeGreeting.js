export function getTimeGreeting() {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 10) return 'Hey, wie geht es dir heute?'
  if (hour >= 10 && hour < 12) return 'Hey, wie lief dein Vormittag?'
  if (hour >= 12 && hour < 15) return 'Halber Tag ist rum — wie sieht es bei dir aus?'
  if (hour >= 15 && hour < 18) return 'Wie war dein Nachmittag?'
  if (hour >= 18 && hour < 22) return 'Jetzt ist ein guter Moment zu reflektieren. Wie war dein Tag heute?'

  return null
}
