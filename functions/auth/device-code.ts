// functions/auth/device-code.ts
// POST /auth/device/code — OAuth RFC 8628 device-flow code issuance.
// Body: { client_id: string }
// Response: { device_code, user_code, verification_uri_complete, expires_in, interval }
//
// Storage shape in ARCANA_PROXY KV:
//   device:<user_code>  -> { device_code, supabase_user_id, license_key, created_at, completed_at? }
//   device_id:<device_code> -> user_code (reverse index for the poll path)
// Both with expirationTtl 600s — the user has 10 minutes to sign in.
//
// Rate limit: by client IP, 10 codes per 10 min. The user_code is 8 chars from
// a 32-char confusable-free alphabet (~20 bits of entropy), which is enough
// when combined with the rate limit and the 10-min TTL.

const KV_RATE_TTL = 600
const USER_CODE_TTL = 600

// Confusable-free: no 0/O, 1/I/L. Crockford-ish.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function randomUserCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  let s = ""
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i]! % ALPHABET.length]
  return `${s.slice(0, 4)}-${s.slice(4, 8)}`
}

function clientIp(request: Request, context: { request: Request; env: any }): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  )
}

export async function onRequest({ request, env }: { request: Request; env: any }): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const body = await request.json().catch(() => ({})) as any
  const clientId = String(body?.client_id ?? "").trim()
  if (!clientId) {
    return new Response(JSON.stringify({ error: "missing_client_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json;charset=utf-8" },
    })
  }

  const ip = clientIp(request, { request, env })
  const rlKey = `device_rl:${ip}:${clientId}`
  const rlRaw = await env.ARCANA_PROXY.get(rlKey)
  const rlCount = rlRaw ? parseInt(rlRaw, 10) || 0 : 0
  if (rlCount >= 10) {
    return new Response(JSON.stringify({ error: "rate_limited", error_description: "Too many device codes from this IP" }), {
      status: 429,
      headers: { "Content-Type": "application/json;charset=utf-8", "Retry-After": "60" },
    })
  }

  const device_code = crypto.randomUUID()
  const user_code = randomUserCode()
  const now = Date.now()

  await env.ARCANA_PROXY.put(`device:${user_code}`, JSON.stringify({
    device_code,
    supabase_user_id: null,
    license_key: null,
    created_at: now,
  }), { expirationTtl: USER_CODE_TTL })
  await env.ARCANA_PROXY.put(`device_id:${device_code}`, user_code, { expirationTtl: USER_CODE_TTL })
  await env.ARCANA_PROXY.put(rlKey, String(rlCount + 1), { expirationTtl: KV_RATE_TTL })

  const origin = new URL(request.url).origin
  return new Response(JSON.stringify({
    device_code,
    user_code,
    verification_uri_complete: `${origin}/auth/device?code=${user_code}`,
    expires_in: 600,
    interval: 5,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json;charset=utf-8", "X-Content-Type-Options": "nosniff" },
  })
}
