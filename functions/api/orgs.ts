// GET /api/orgs — org list for the CLI after device-flow login.
// Authorization: Bearer <license key | admin | JWT>
// Response: Array<{ id: string, name: string }>
//
// Arcana personal accounts do not have multi-org yet. Return a single
// default org so the engine can set active_org_id, or [] if unauthenticated.
// Without this route, Pages serves HTML and Account.poll fails to decode.

const PROXY = "https://proxy-arcana.otnelhq.com"

export async function onRequest({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405)
  }

  const auth = request.headers.get("Authorization") || ""
  if (!auth.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401)
  }

  // Validate the bearer against the proxy (same gate as /api/user).
  let upstream: Response
  try {
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
    return json({ error: "upstream_error" }, upstream.status >= 500 ? 502 : upstream.status)
  }

  const body = (await upstream.json().catch(() => ({}))) as { user?: string; tier?: string }
  const identity = String(body.user ?? "personal").trim() || "personal"
  const orgId = identity.includes("@")
    ? `org_${identity.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 48)}`
    : `org_${identity.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 48)}`
  const name = identity.includes("@") ? identity.split("@")[0] || "Personal" : "Personal"

  // Engine accepts Org[] — at least one org keeps active_org_id usable.
  return new Response(
    JSON.stringify([{ id: orgId, name: `${name}'s workspace` }]),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    },
  )
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
