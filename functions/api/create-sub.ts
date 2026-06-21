const PROXY = "https://arcana-proxy.lejzerv.workers.dev";

export async function onRequest({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.text();

  const upstream = await fetch(`${PROXY}/v1/pay/create-sub`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await upstream.text();

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
