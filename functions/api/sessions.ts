const PROXY = "https://proxy.arcana.otnelhq.com"

export async function onRequest({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 })

  const url = new URL(request.url)
  const target = `${PROXY}/v1/sessions${url.search}`
  const auth = request.headers.get("Authorization") || ""

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
