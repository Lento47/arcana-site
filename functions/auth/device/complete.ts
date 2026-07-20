// functions/auth/device/complete.ts
// POST /auth/device/complete — called by the verification page after Supabase sign-in.
// Body: { user_code, supabaseUserId, email }
// Calls the proxy's /v1/admin/licenses to mint a fresh license key, writes it
// back to the device entry so the CLI poll at /auth/device/token can return it.

const PROXY = "https://proxy-arcana.otnelhq.com"
const COMPLETE_RL_TTL = 300

export async function onRequest({ request, env }: { request: Request; env: any }): Promise<Response> {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    if (!env?.ARCANA_PROXY || typeof env.ARCANA_PROXY.get !== "function") {
      return jsonError(500, "missing_kv_binding", "ARCANA_PROXY KV namespace is not bound to this Pages project")
    }

    const body = await request.json().catch(() => ({})) as any
    const userCode = String(body?.user_code ?? "").trim()
    const supabaseUserId = String(body?.supabaseUserId ?? "").trim()
    const email = String(body?.email ?? "").trim().toLowerCase()

    if (!userCode || !supabaseUserId || !email) {
      return jsonError(400, "missing_fields", "user_code, supabaseUserId, and email are required")
    }

    // user_code format: ABCD-1234
    if (!/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(userCode)) {
      return jsonError(400, "invalid_user_code", "user_code must be ABCD-1234 format")
    }

    // Rate-limit per user_code: 5 attempts per 5 min. Prevents brute-forcing
    // a leaked user_code to hijack a device flow.
    const rlKey = `complete_rl:${userCode}`
    const rlRaw = await env.ARCANA_PROXY.get(rlKey)
    const rlCount = rlRaw ? parseInt(rlRaw, 10) || 0 : 0
    if (rlCount >= 5) {
      return jsonError(429, "rate_limited", "Too many completion attempts for this code")
    }

    const entryRaw = await env.ARCANA_PROXY.get(`device:${userCode}`)
    if (!entryRaw) {
      return jsonError(404, "device_not_found", "Device code not found or expired")
    }
    const entry = JSON.parse(entryRaw) as {
      device_code: string
      supabase_user_id: string | null
      license_key: string | null
      created_at: number
    }

    // Already completed (re-entry on the verification page). Return the existing
    // key so the user sees the same "Approved" state without re-minting.
    if (entry.license_key) {
      return new Response(JSON.stringify({ ok: true, alreadyCompleted: true }), {
        status: 200,
        headers: { "Content-Type": "application/json;charset=utf-8", "X-Content-Type-Options": "nosniff" },
      })
    }

    // Mint via the proxy. Site secret ARCANA_PROXY_ADMIN_KEY must match one of
    // the proxy's ARCANA_ADMIN_KEY / ARCANA_ADMIN_KEYS values (short secrets).
    const adminKey = String(env.ARCANA_PROXY_ADMIN_KEY ?? "").trim()
    if (!adminKey) {
      return jsonError(500, "site_misconfigured", "ARCANA_PROXY_ADMIN_KEY is not set")
    }
    // Guard: a JWT/service-role accidentally pasted as the admin secret is ~900–1100
    // bytes. That is the smoking gun for CF KV error "length of 999" (license: + 991).
    const adminKeyBytes = new TextEncoder().encode(adminKey).length
    if (adminKeyBytes > 200) {
      console.error(
        `[device/complete] ARCANA_PROXY_ADMIN_KEY is ${adminKeyBytes} bytes — expected a short admin secret, not a JWT`,
      )
      return jsonError(
        500,
        "site_misconfigured",
        `ARCANA_PROXY_ADMIN_KEY looks too long (${adminKeyBytes} bytes). Use the same short admin secret as the proxy, not a Supabase JWT/service_role key.`,
      )
    }

    let upstream: Response
    try {
      upstream = await fetch(`${PROXY}/v1/admin/licenses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseUserId, email, plan: "pro" }),
        signal: AbortSignal.timeout(10000),
      })
    } catch {
      return jsonError(503, "upstream_unreachable", "Could not reach the proxy")
    }

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "")
      if (text.includes("key length limit") || text.includes("414")) {
        return jsonError(
          502,
          "upstream_kv_key",
          "Proxy hit a KV key length limit (usually license:<~991-byte bearer>). Check that ARCANA_PROXY_ADMIN_KEY matches a short proxy admin key, then redeploy proxy with admin routes bypassing getUser.",
        )
      }
      return jsonError(upstream.status, "upstream_error", `Proxy returned ${upstream.status}: ${text.slice(0, 200)}`)
    }

    const minted = await upstream.json() as { licenseKey?: string; tier?: string; createdAt?: number }
    if (!minted.licenseKey) {
      return jsonError(502, "upstream_malformed", "Proxy did not return a licenseKey")
    }

    // Write the license_key back to the device entry so the CLI poll can return it.
    await env.ARCANA_PROXY.put(`device:${userCode}`, JSON.stringify({
      ...entry,
      supabase_user_id: supabaseUserId,
      license_key: minted.licenseKey,
      completed_at: Date.now(),
    }), { expirationTtl: 600 })
    await env.ARCANA_PROXY.put(rlKey, String(rlCount + 1), { expirationTtl: COMPLETE_RL_TTL })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json;charset=utf-8", "X-Content-Type-Options": "nosniff" },
    })
  } catch (e) {
    return jsonError(500, "internal_error", e instanceof Error ? e.message : String(e))
  }
}

function jsonError(status: number, error: string, description: string): Response {
  return new Response(JSON.stringify({ error, error_description: description }), {
    status,
    headers: { "Content-Type": "application/json;charset=utf-8", "X-Content-Type-Options": "nosniff" },
  })
}
