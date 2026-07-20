/**
 * Pages middleware: serve the Arcana auth surface HTML at /auth paths on
 * arcana.otnelhq.com while leaving the primary marketing site untouched.
 *
 * Critical: this ONLY rewrites browser GETs to the auth page itself. Any
 * /auth/* path with a file extension, or any POST, is a Pages Function or
 * static asset and must pass through to context.next(). Otherwise the
 * middleware serves index.html in place of /auth/device/code (a Function)
 * and the engine's device-flow login fails with "Failed to decode response".
 */
export async function onRequest(context) {
  const url = new URL(context.request.url)

  const isAuthHost =
    url.hostname === "arcana.otnelhq.com" || url.hostname === "arcana-staging.otnelhq.com"
  const isAuthPath = url.pathname === "/auth" || url.pathname.startsWith("/auth/")
  if (!isAuthHost || !isAuthPath) return context.next()

  // Only intercept bare HTML page requests.
  // Pass through:
  //   - any non-GET (POST/etc. — these are Functions: /auth/device/code etc.)
  //   - any path with a file extension (/auth/device/index.html, .css, .js, .svg)
  //   - anything outside the device-page tree (Functions, API routes)
  const isPageGet =
    context.request.method === "GET" &&
    !url.pathname.includes(".") &&
    (url.pathname === "/auth" || url.pathname === "/auth/" ||
     url.pathname === "/auth/device" || url.pathname === "/auth/device/")

  if (!isPageGet) return context.next()

  const target = url.pathname.startsWith("/auth/device")
    ? "/auth/device/index.html"
    : "/auth/index.html"
  const assetUrl = new URL(target, url.origin)
  return context.env.ASSETS.fetch(assetUrl)
}
