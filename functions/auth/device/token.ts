// functions/auth/device/token.ts
// POST /auth/device/token — OAuth RFC 8628 device-flow token poll.
// Body: { grant_type, device_code, client_id }
// Response: 200 { access_token, refresh_token, token_type, expires_in } on success.
//           400 { error, error_description } on error.
//           error ∈ { authorization_pending, slow_down, expired_token, access_denied }

const DEVICE_TTL_MS = 10 * 60 * 1000

export async function onRequest({ request, env }: { request: Request; env: any }): Promise<Response> {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    if (!env?.ARCANA_PROXY || typeof env.ARCANA_PROXY.get !== "function") {
      return errJson(500, "missing_kv_binding", "ARCANA_PROXY KV namespace is not bound to this Pages project")
    }

    const body = await request.json().catch(() => ({})) as any
    const grantType = String(body?.grant_type ?? "")
    const deviceCode = String(body?.device_code ?? "").trim()
    const clientId = String(body?.client_id ?? "").trim()

    if (grantType !== "urn:ietf:params:oauth:grant-type:device_code") {
      return errJson(400, "unsupported_grant_type", "Only device_code grant is supported")
    }
    if (!deviceCode) {
      return errJson(400, "invalid_request", "device_code is required")
    }
    if (!clientId) {
      return errJson(400, "invalid_request", "client_id is required")
    }

    // Reverse index: device_code -> user_code.
    const userCode = await env.ARCANA_PROXY.get(`device_id:${deviceCode}`)
    if (!userCode) {
      return errJson(400, "expired_token", "Device code not found or expired")
    }

    const entryRaw = await env.ARCANA_PROXY.get(`device:${userCode}`)
    if (!entryRaw) {
      return errJson(400, "expired_token", "Device code not found or expired")
    }
    const entry = JSON.parse(entryRaw) as {
      device_code: string
      supabase_user_id: string | null
      license_key: string | null
      created_at: number
      completed_at?: number
    }

    // Defense-in-depth: confirm the device_code round-trips through the entry.
    if (entry.device_code !== deviceCode) {
      return errJson(400, "invalid_grant", "Device code mismatch")
    }

    // TTL check (KV TTLs are best-effort; belt and suspenders).
    if (Date.now() - entry.created_at > DEVICE_TTL_MS) {
      return errJson(400, "expired_token", "Device code expired")
    }

    // Bound by the verification page -> /auth/device/complete (which calls the
    // proxy mint route and writes license_key back to this entry).
    if (!entry.license_key) {
      return errJson(400, "authorization_pending", "User has not yet authorized")
    }

    // Success. The access_token is the freshly minted license key; the engine
    // writes it to ~/.arcana/proxy_key and uses it as a bearer against the proxy.
    return new Response(JSON.stringify({
      access_token: entry.license_key,
      refresh_token: deviceCode,
      token_type: "Bearer",
      expires_in: 31536000,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json;charset=utf-8", "X-Content-Type-Options": "nosniff" },
    })
  } catch (e) {
    return errJson(500, "internal_error", e instanceof Error ? e.message : String(e))
  }
}

function errJson(status: number, error: string, description: string): Response {
  return new Response(JSON.stringify({ error, error_description: description }), {
    status,
    headers: { "Content-Type": "application/json;charset=utf-8", "X-Content-Type-Options": "nosniff" },
  })
}
