const SERVICES = [
  { name: "AI Proxy", url: "https://proxy.arcana.otnelhq.com/v1/health" },
  { name: "License Server", url: "https://api.arcana.otnelhq.com/api/health" },
  { name: "Website", url: "https://arcana.otnelhq.com" },
  { name: "R2 Releases", url: "https://releases.otnelhq.com" },
] as const

async function check(url: string, requireOk = true): Promise<{ status: string; latency: number }> {
  const start = Date.now()
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const healthy = requireOk ? res.ok : res.status < 500
    return { status: healthy ? "up" : "down", latency: Date.now() - start }
  } catch {
    return { status: "down", latency: Date.now() - start }
  }
}

export async function onRequest(): Promise<Response> {
  const checks = await Promise.all(SERVICES.map((s) => {
    const requireOk = s.name !== "Website"  // Website: any reachable is OK; health endpoints: need 2xx
    return check(s.url, requireOk)
  }))
  const data = {
    lastChecked: new Date().toISOString(),
    services: SERVICES.map((s, i) => ({ name: s.name, ...checks[i] })),
    summary: checks.every((c) => c.status === "up") ? "operational" : "issues",
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache, no-store, must-revalidate", "Access-Control-Allow-Origin": "https://arcana.otnelhq.com", "X-Content-Type-Options": "nosniff" },
  })
}
