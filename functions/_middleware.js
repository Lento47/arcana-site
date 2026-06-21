/**
 * Pages middleware: serve the Arcana auth surface at /auth paths on
 * arcana.otnelhq.com while leaving the primary marketing site untouched.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url)

  if (
    (url.hostname === "arcana.otnelhq.com" || url.hostname === "arcana-staging.otnelhq.com") &&
    url.pathname.startsWith("/auth")
  ) {
    const assetUrl = new URL("/auth/index.html", url.origin)
    return context.env.ASSETS.fetch(assetUrl)
  }

  return context.next()
}
