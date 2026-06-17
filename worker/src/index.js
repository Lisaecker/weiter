// Weiter. Push Worker — sendet täglich Morgen- und Abend-Notifications

function base64urlToBuffer(b64u) {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  return Uint8Array.from(bin, c => c.charCodeAt(0)).buffer
}

function bufferToBase64url(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  bytes.forEach(b => bin += String.fromCharCode(b))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function toBase64url(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  let bin = ''
  bytes.forEach(b => bin += String.fromCharCode(b))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function signVapidJWT(privateKeyB64u, audience, subject) {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    base64urlToBuffer(privateKeyB64u),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60
  const header  = toBase64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = toBase64url(new TextEncoder().encode(JSON.stringify({ aud: audience, sub: subject, exp: expiry })))
  const signing = new TextEncoder().encode(`${header}.${payload}`)

  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, signing)
  return `${header}.${payload}.${bufferToBase64url(sig)}`
}

async function sendEmptyPush(subscription, env) {
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`

  const jwt = await signVapidJWT(env.VAPID_PRIVATE_KEY, audience, env.VAPID_SUBJECT)

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'TTL': '86400',
      'Urgency': 'normal',
      'Authorization': `vapid t=${jwt},k=${env.VAPID_PUBLIC_KEY}`,
    },
  })

  if (res.status === 410 || res.status === 404) {
    throw { expired: true }
  }
  return res
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  // ── HTTP: Subscription speichern ──────────────────────────────────────────
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/subscribe' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 })
    }

    const sub = await request.json()
    const id  = sub.keys?.p256dh?.slice(0, 22) || String(Date.now())
    await env.SUBSCRIPTIONS.put(id, JSON.stringify(sub))

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  },

  // ── Cron: täglich senden ─────────────────────────────────────────────────
  async scheduled(event, env) {
    const berlinHour = parseInt(
      new Intl.DateTimeFormat('de-DE', {
        timeZone: 'Europe/Berlin',
        hour: 'numeric',
        hour12: false,
      }).format(new Date())
    )

    // Nur zur vollen Stunde 8 und 20 senden
    if (berlinHour !== 8 && berlinHour !== 20) return

    const list = await env.SUBSCRIPTIONS.list()

    await Promise.allSettled(
      list.keys.map(async ({ name }) => {
        const raw = await env.SUBSCRIPTIONS.get(name)
        if (!raw) return
        const sub = JSON.parse(raw)
        try {
          await sendEmptyPush(sub, env)
        } catch (e) {
          if (e?.expired) await env.SUBSCRIPTIONS.delete(name)
        }
      })
    )
  },
}
