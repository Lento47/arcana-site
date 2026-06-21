# Auth Subdomain / Path Routing

## Current routing

Auth flows are served under a **path-based route**, not a separate subdomain:

- Production: `https://arcana.otnelhq.com/auth/`
- Local dev: `http://localhost:4321/auth/`

## Why path-based routing

- Keeps all site traffic on a single origin (`arcana.otnelhq.com`).
- Avoids extra CORS/cookie complexity from `auth.otnelhq.com`.
- Simplifies Cloudflare Pages / Functions deployment (one project, one domain).

## Implementation notes

- `/auth/*` is handled by the application router (Astro + auth endpoints).
- Callbacks, login, logout, and account pages all live under `/auth/`.
- External OAuth providers must register the callback as `https://arcana.otnelhq.com/auth/callback`.
- Cookies are scoped to `arcana.otnelhq.com` (or `localhost`) with `SameSite=Lax` and `Secure` in production.

## Deprecated

The previous `https://auth.otnelhq.com` subdomain approach is no longer used. Any references to `auth.otnelhq.com` should be migrated to `arcana.otnelhq.com/auth/`.
