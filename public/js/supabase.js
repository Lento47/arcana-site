// Arcana × Supabase — auth client (anon key only, safe for browser)
// Supabase used exclusively for authentication. No data, no tables, no RLS.
//
// IMPORTANT: do not use top-level `let sb` / `const sb` here. Classic scripts
// on the same page share one global lexical environment, so a second script
// that also declares `sb` throws: "Identifier 'sb' has already been declared"
// and aborts device auth. Expose only via window.__ARCANA_SB__.
;(function () {
  "use strict"

  var SUPABASE_URL = "https://ndaejikkbckaeygtruwl.supabase.co"
  var SUPABASE_ANON_KEY = "sb_publishable_kvD3JQvemwuQWoNtQG7Pfg_vBgpM9IE"
  var client = null

  if (typeof window.supabase === "undefined") {
    console.error("Arcana: window.supabase is undefined. CDN script may be blocked by CSP or failed to load.")
  } else if (typeof window.supabase.createClient !== "function") {
    console.error(
      "Arcana: window.supabase.createClient is not a function. SDK version mismatch? Type:",
      typeof window.supabase,
    )
  } else {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log("Arcana: Supabase client initialized. Auth ready.")
  }

  window.__ARCANA_SB__ = client

  if (!client) {
    window.addEventListener("DOMContentLoaded", function () {
      window.dispatchEvent(new CustomEvent("arcana:auth-offline"))
    })
    return
  }

  client.auth.getSession().then(function (result) {
    var session = result && result.data && result.data.session
    if (session) {
      window.dispatchEvent(new CustomEvent("arcana:session", { detail: session }))
    }
  })

  client.auth.onAuthStateChange(function (event, session) {
    if (event === "SIGNED_IN" && session) {
      window.dispatchEvent(new CustomEvent("arcana:signed-in", { detail: session }))
    } else if (event === "SIGNED_OUT") {
      window.dispatchEvent(new CustomEvent("arcana:signed-out"))
    }
  })
})()
