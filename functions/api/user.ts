// GET /api/user — identity for the CLI device-flow after token exchange.
// Authorization: Bearer <license key | admin | JWT>
// Response: { id: string, email: string }
//
// The engine's Account.poll() requires this after /auth/device/token succeeds.
// Without it, Cloudflare Pages serves the marketing SPA HTML and the CLI dies
// with "Failed to decode response".

const PROXY = "https://proxy.arcana.otnelhq.com"

export async function onRequest({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405)
  }

  const auth = request.headers.get("Authorization") || ""
  if (!auth.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401)
  }

  let upstream: Response
  try {
    // /v1/health is auth-gated and returns { user, tier } derived from the bearer.
    upstream = await fetch(`${PROXY}/v1/health`, {
      method: "GET",
      headers: { Authorization: auth, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return json({ error: "upstream_unreachable" }, 503)
  }

  if (upstream.status === 401) {
    return json({ error: "unauthorized" }, 401)
  }
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "")
    return json({ error: "upstream_error", message: text.slice(0, 200) }, upstream.status >= 500 ? 502 : upstream.status)
  }

  const body = (await upstream.json().catch(() => ({}))) as {
    user?: string
    tier?: string
    status?: string
  }

  const identity = String(body.user ?? "").trim()
  if (!identity) {
    return json({ error: "no_identity", message: "Proxy health did not return a user id" }, 502)
  }

  // Device-flow licenses store email as license.id. Admin is "Admin".
  // Prefer a real-looking email; otherwise synthesize a stable local id.
  const email = identity.includes("@") ? identity.toLowerCase() : `${identity.toLowerCase().replace(/[^a-z0-9._-]+/g, "_")}@arcana.local`
  const id = identity.includes("@") ? identity.toLowerCase() : identity

  return json({ id, email }, 200)
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  })
}
