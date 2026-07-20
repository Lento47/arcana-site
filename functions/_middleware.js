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
    // /auth/device and its subpaths serve the device-flow verification page;
    // everything else under /auth reuses the standard auth card.
    const target = url.pathname.startsWith("/auth/device")
      ? "/auth/device/index.html"
      : "/auth/index.html"
    const assetUrl = new URL(target, url.origin)
    return context.env.ASSETS.fetch(assetUrl)
  }

  return context.next()
}
