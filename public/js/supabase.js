// Arcana × Supabase — auth client (anon key only, safe for browser)
// Supabase used exclusively for authentication. No data, no tables, no RLS.
const SUPABASE_URL = "https://ndaejikkbckaeygtruwl.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_kvD3JQvemwuQWoNtQG7Pfg_vBgpM9IE"

// @ts-ignore — loaded via CDN <script> before this file
const sb = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

if (!sb) {
  console.error("Arcana: Supabase SDK not loaded. Auth disabled.")
  // Let the page know immediately so it can show a banner on load
  window.addEventListener('DOMContentLoaded', () => {
    window.dispatchEvent(new CustomEvent('arcana:auth-offline'))
  })
}

// Expose for inline scripts
window.__ARCANA_SB__ = sb

// On page load, check for existing session
if (sb) {
  sb.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      window.dispatchEvent(new CustomEvent('arcana:session', { detail: session }))
    }
  })

  // Listen for auth state changes (sign in, sign out, token refresh)
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      window.dispatchEvent(new CustomEvent('arcana:signed-in', { detail: session }))
    } else if (event === 'SIGNED_OUT') {
      window.dispatchEvent(new CustomEvent('arcana:signed-out'))
    }
  })
}
