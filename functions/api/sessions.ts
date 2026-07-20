const PROXY = "https://arcana-proxy.lejzerv.workers.dev"

export async function onRequest({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 })

  const auth = request.headers.get("Authorization") || ""
  if (!auth) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json;charset=utf-8", "X-Content-Type-Options": "nosniff" },
    })
  }

  const url = new URL(request.url)
  const target = `${PROXY}/v1/sessions${url.search}`

  let upstream: Response
  try {
    upstream = await fetch(target, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return new Response(JSON.stringify({ error: "upstream_unreachable" }), {
      status: 503,
      headers: { "Content-Type": "application/json;charset=utf-8", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'", "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff" },
    })
  }

  const data = await upstream.text()
  return new Response(data, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
