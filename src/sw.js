import { precacheAndRoute } from 'workbox-precaching'

// Workbox injiziert hier die Precache-Liste
precacheAndRoute(self.__WB_MANIFEST)

// ── Push-Notifications ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const berlinHour = parseInt(
    new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
  )

  const isEvening = berlinHour >= 18

  const notification = isEvening
    ? { title: 'Weiter. 🌙', body: 'Wie war dein Tag? Nimm dir 3 Minuten für deinen Rückblick.' }
    : { title: 'Weiter. 🌱', body: 'Guten Morgen — wie ist deine Energie heute?' }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'weiter-daily',
      renotify: true,
      data: { url: '/' },
    })
  )
})

// ── Notification-Klick → App öffnen ──────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow('/')
    })
  )
})
