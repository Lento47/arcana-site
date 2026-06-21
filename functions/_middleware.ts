/**
 * Pages middleware: serve the Arcana auth surface at /auth paths on
 * arcana.otnelhq.com while leaving the primary marketing site untouched.
 */
export async function onRequest(context: any): Promise<Response> {
  const url = new URL(context.request.url)

  if (
    (url.hostname === "arcana.otnelhq.com" || url.hostname === "arcana-staging.otnelhq.com") &&
    url.pathname.startsWith("/auth")
  ) {
    // Fetch the static auth page asset and pass through the original request
    // so headers like Accept-Language are preserved where useful.
    const assetRequest = new Request("/auth/index.html", context.request)
    return context.env.ASSETS.fetch(assetRequest)
  }

  return context.next()
}
