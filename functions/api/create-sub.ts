const PROXY = "https://proxy.arcana.otnelhq.com";

export async function onRequest({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${PROXY}/v1/pay/create-sub`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "https://arcana.otnelhq.com" },
      body,
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "upstream_unreachable", message: "Subscription service temporarily unavailable." }),
      { status: 503, headers: { "Content-Type": "application/json;charset=utf-8", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'", "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff" } }
    );
  }

  const data = await upstream.text();

  if (!upstream.ok) {
    let msg = data;
    try { const parsed = JSON.parse(data); msg = parsed.message || parsed.error || data; } catch {}
    return new Response(
      JSON.stringify({ error: "upstream_error", message: msg.slice(0, 300) }),
      { status: upstream.status, headers: { "Content-Type": "application/json;charset=utf-8", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'", "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff" } }
    );
  }

  return new Response(data, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
