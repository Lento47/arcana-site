// public/js/device-verify.js
//
// Wires the /auth/device page to:
//   1. Read the user_code from ?code= and validate it (RFC 8628 4-char × 2, confusable-free).
//   2. Populate the seal (code, copy button, throttled countdown) and surface UI state.
//   3. On Supabase sign-in (password, OAuth), POST { user_code, supabaseUserId, email } to
//      /auth/device/complete. The CLI is polling /auth/device/token separately; once
//      complete writes a license_key to KV, the CLI receives its access_token.
//   4. Handle every failure mode with a single, named state: invalid code, expired,
//      network unavailable, already-claimed by another user, session-restored auto-complete.
//
// Design constraints: this file is the single source of truth for what is visible.
// The CSS in auth.css maps [data-state] on #device-states to a visibility tree, so
// enterState() never touches element.style or querySelectorAll loops.

"use strict"

// —————————————————————————————————————— Constants ——————————————————————————————————————

const DEVICE_TTL_SECONDS = 600
const SB_LOAD_TIMEOUT_MS = 8000
const COMPLETE_RETRIES = 3
const COMPLETE_BACKOFF_MS = [400, 800, 1600]
const CODE_REGEX = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/
const COPY_RESET_MS = 1200
// Throttle aria-live updates to these thresholds; everything in between does not
// announce because the screen reader would be overwhelmed by per-second ticks.
const EXPIRY_ANNOUNCE_THRESHOLDS = [600, 300, 120, 60, 30, 10, 0]

// —————————————————————————————————————— Module state ——————————————————————————————————————

let state = "loading"
let userCode = ""
let sb = null
let expiresAt = 0
let expiryIntervalId = 0
let copyTimeoutId = 0
let lastAnnouncedSecond = -1
let sbResolved = false
let sbResolve
let sbReject
const sbReady = new Promise((res, rej) => { sbResolve = res; sbReject = rej })

// —————————————————————————————————————— DOM cache ——————————————————————————————————————

let mainEl, statesEl, codeEl, expiryEl, expiryNumEl, expirySuffixEl, copyBtn, copyLabel, copyIcon, checkIcon, cancelLink, closeTabLink, retryLink, atmoCodeEl

function cacheDom() {
  mainEl = document.getElementById("main")
  statesEl = document.getElementById("device-states")
  codeEl = document.getElementById("device-seal-code")
  expiryEl = document.getElementById("device-seal-expiry")
  expiryNumEl = document.getElementById("expiry-num")
  expirySuffixEl = document.getElementById("expiry-suffix")
  copyBtn = document.getElementById("device-seal-copy")
  copyLabel = document.getElementById("device-seal-copy-label")
  copyIcon = document.getElementById("copy-icon")
  checkIcon = document.getElementById("check-icon")
  cancelLink = document.getElementById("cancel-link")
  closeTabLink = document.getElementById("close-tab-link")
  retryLink = document.getElementById("retry-link")
  atmoCodeEl = document.getElementById("atmo-code")
}

// —————————————————————————————————————— State machine ——————————————————————————————————————

const STATE_TITLES = {
  "loading": ["Approve this device", "Sign in to send a token to your terminal."],
  "ready": ["Approve this device", "Sign in to send a token to your terminal."],
  "pending-auto": ["Completing sign-in", "Resuming your session and routing the token to your terminal."],
  "success": ["Approved", "Your terminal received its access token. You can close this tab."],
  "error-invalid": ["Invalid sign-in link", "This link is missing a valid code. Run `arcana sign-in` in your terminal to start over."],
  "error-auth": ["Sign-in failed", "Check your credentials and try again."],
  "error-expired": ["Code expired", "Codes expire after ten minutes. Run `arcana sign-in` in your terminal to start over."],
  "error-network": ["Sign-in unavailable", "Check your network and try again."],
  "error-claimed": ["Code already used", "This code was already used. Run `arcana sign-in` in your terminal to start over."],
}

function enterState(next) {
  if (state === next) return
  state = next
  if (statesEl) statesEl.dataset.state = next

  // aria-busy: true while loading or auto-completing; false on terminal states
  if (mainEl) mainEl.setAttribute("aria-busy", next === "loading" || next === "pending-auto" ? "true" : "false")

  // Update card header copy for terminal states
  const [title, desc] = STATE_TITLES[next] || STATE_TITLES.loading
  const titleEl = document.getElementById("card-title")
  const descEl = document.getElementById("card-desc")
  if (titleEl) titleEl.textContent = title
  if (descEl) descEl.textContent = desc

  // Banner text for error/success states
  if (next === "error-invalid" || next === "error-expired") {
    setText("banner-error-title", next === "error-expired" ? "Code expired" : "Invalid sign-in link")
    setText("banner-error-message", next === "error-expired"
      ? "Codes expire after ten minutes. Run `arcana sign-in` in your terminal to start over."
      : "This link is missing a valid code. Run `arcana sign-in` in your terminal to start over.")
  } else if (next === "error-auth") {
    // Caller is responsible for setting the banner-error-* text before calling enterState.
  } else if (next === "error-network" || next === "error-claimed") {
    setText("banner-warning-title", next === "error-claimed" ? "Code already used" : "Sign-in unavailable")
    setText("banner-warning-message", next === "error-claimed"
      ? "This code was already used. Run `arcana sign-in` in your terminal to start over."
      : "Check your network and try again.")
  } else if (next === "success") {
    setText("banner-success-message", "Your terminal received its access token. You can close this tab.")
  }

  // Stop the countdown when we leave a state that needs it
  if (next !== "ready" && next !== "pending-auto" && expiryIntervalId) {
    clearInterval(expiryIntervalId)
    expiryIntervalId = 0
  }

  // Emit for any other page scripts (debugging, tests)
  window.dispatchEvent(new CustomEvent("arcana:device:state", { detail: { state: next } }))
}

function setText(id, text) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

// —————————————————————————————————————— Init ——————————————————————————————————————

function init() {
  cacheDom()

  // Wire static listeners once
  if (cancelLink) cancelLink.addEventListener("click", onCancel)
  if (closeTabLink) closeTabLink.addEventListener("click", onCancel)
  if (retryLink) retryLink.addEventListener("click", onRetry)
  if (copyBtn) copyBtn.addEventListener("click", onCopy)
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = document.getElementById(btn.getAttribute("data-target"))
      if (t) t.type = t.type === "password" ? "text" : "password"
    })
  })

  // Listen to supabase.js's offline signal — fires if the SDK never appeared
  window.addEventListener("arcana:auth-offline", () => {
    if (!sbResolved) {
      sbResolved = true
      sbReject(new Error("Supabase client unavailable"))
    }
  })

  // Parse + validate the code
  const params = new URLSearchParams(location.search)
  userCode = (params.get("code") || "").trim()
  if (!CODE_REGEX.test(userCode)) {
    // Don't populate the seal with the bad code (it could be a partial attempt or junk).
    populateSeal("---- - ----", { skipCountdown: true })
    enterState("error-invalid")
    return
  }

  populateSeal(userCode)

  // Wait for Supabase client with a hard timeout
  Promise.race([
    sbReady,
    new Promise((_, rej) => setTimeout(() => {
      if (!sbResolved) {
        sbResolved = true
        rej(new Error("Supabase load timeout"))
      }
    }, SB_LOAD_TIMEOUT_MS)),
  ])
    .then((client) => {
      sb = client
      enterState("ready")
      bindForm()
      attemptAutoComplete()
    })
    .catch(() => {
      enterState("error-network")
    })
}

function populateSeal(code, opts = {}) {
  if (codeEl) codeEl.textContent = code
  if (atmoCodeEl) atmoCodeEl.textContent = code
  // document.title intentionally omits the code — it's visible enough in the seal.
  document.title = "Approve sign-in · Arcana"
  if (opts.skipCountdown) return
  expiresAt = Date.now() + DEVICE_TTL_SECONDS * 1000
  lastAnnouncedSecond = -1
  startCountdown()
}

function startCountdown() {
  if (expiryIntervalId) clearInterval(expiryIntervalId)
  tickExpiry()
  expiryIntervalId = setInterval(tickExpiry, 1000)
}

function tickExpiry() {
  if (!expiryEl || !expiryNumEl) return
  const remainingMs = Math.max(0, expiresAt - Date.now())
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
  const ss = String(totalSeconds % 60).padStart(2, "0")
  expiryNumEl.textContent = `${mm}:${ss}`

  let stateAttr = ""
  let suffix = "left"
  if (totalSeconds <= 0) {
    suffix = "· expired"
    stateAttr = "expiring"
  } else if (totalSeconds <= 10) {
    suffix = "· expiring"
    stateAttr = "expiring"
  }
  expiryEl.dataset.state = stateAttr
  if (expirySuffixEl) expirySuffixEl.textContent = suffix

  // Only announce at threshold crossings; the textContent change above is silent.
  const shouldAnnounce = EXPIRY_ANNOUNCE_THRESHOLDS.includes(totalSeconds)
  if (shouldAnnounce && totalSeconds !== lastAnnouncedSecond) {
    lastAnnouncedSecond = totalSeconds
    // Re-set the wrapper to force the aria-live region to re-announce.
    expiryEl.setAttribute("aria-live", "off")
    // Force reflow so the next assignment is treated as a new value.
    void expiryEl.offsetWidth
    expiryEl.setAttribute("aria-live", "polite")
  }

  if (totalSeconds <= 0) {
    clearInterval(expiryIntervalId)
    expiryIntervalId = 0
    // Only enter the expired state if we're still in a state that shows the seal
    if (state === "ready") enterState("error-expired")
  }
}

// —————————————————————————————————————— Supabase ——————————————————————————————————————

function bindSbReady() {
  if (window.__ARCANA_SB__ && !sbResolved) {
    sbResolved = true
    sbResolve(window.__ARCANA_SB__)
    return true
  }
  return false
}

// supabase.js (deferred) defines window.__ARCANA_SB__. Poll briefly to bridge the
// defer-order gap. The timeout above guarantees we never hang.
const sbPoll = setInterval(() => {
  if (bindSbReady()) clearInterval(sbPoll)
}, 50)

// —————————————————————————————————————— Form wiring ——————————————————————————————————————

function bindForm() {
  const form = document.getElementById("form-signin")
  if (!form) return
  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    if (!sb) {
      enterState("error-network")
      return
    }
    const email = document.getElementById("signin-email").value.trim()
    const password = document.getElementById("signin-password").value
    const errEl = document.getElementById("signin-password-error")
    if (!email || !password) {
      if (errEl) {
        errEl.textContent = "Email and password are required."
        errEl.classList.remove("hidden")
      }
      return
    }
    if (errEl) errEl.classList.add("hidden")
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) {
        setText("banner-error-title", "Sign-in failed")
        setText("banner-error-message", error.message || "Check your credentials and try again.")
        enterState("error-auth")
        return
      }
      if (data?.session) await postComplete(data.session)
    } catch (err) {
      setText("banner-error-title", "Sign-in error")
      setText("banner-error-message", err?.message || "Unexpected error during sign-in.")
      enterState("error-auth")
    }
  })

  for (const [id, provider] of [["oauth-github", "github"], ["oauth-google", "google"]]) {
    const btn = document.getElementById(id)
    if (!btn) continue
    btn.addEventListener("click", async () => {
      if (!sb) {
        enterState("error-network")
        return
      }
      try {
        const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.href } })
        if (error) {
          setText("banner-error-title", "Sign-in failed")
          setText("banner-error-message", error.message || "Unexpected error.")
          enterState("error-auth")
        }
      } catch (err) {
        enterState("error-network")
      }
    })
  }
}

async function attemptAutoComplete() {
  if (!sb) return
  try {
    const { data } = await sb.auth.getSession()
    if (data?.session) {
      enterState("pending-auto")
      await postComplete(data.session)
    }
  } catch {
    /* fall through to the form */
  }
}

// —————————————————————————————————————— /auth/device/complete ——————————————————————————————————————

async function postComplete(session) {
  const user = session?.user
  if (!user || !user.id || !user.email) {
    setText("banner-error-title", "Sign-in incomplete")
    setText("banner-error-message", "We could not read your account details.")
    enterState("error-auth")
    return
  }

  const body = JSON.stringify({
    user_code: userCode,
    supabaseUserId: user.id,
    email: user.email,
  })

  let lastErr = null
  for (let attempt = 0; attempt < COMPLETE_RETRIES; attempt++) {
    try {
      const res = await fetch("/auth/device/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })

      if (res.status === 409) {
        enterState("error-claimed")
        return
      }
      if (res.status >= 500) {
        lastErr = new Error(`Server ${res.status}`)
        if (attempt < COMPLETE_RETRIES - 1) await delay(COMPLETE_BACKOFF_MS[attempt])
        continue
      }
      if (!res.ok) {
        let desc = `Server returned ${res.status}`
        try { const j = await res.json(); if (j?.error_description || j?.error) desc = j.error_description || j.error } catch {}
        setText("banner-error-title", "Approval failed")
        setText("banner-error-message", desc)
        enterState("error-auth")
        return
      }
      enterState("success")
      return
    } catch (err) {
      lastErr = err
      if (attempt < COMPLETE_RETRIES - 1) await delay(COMPLETE_BACKOFF_MS[attempt])
    }
  }

  // Exhausted retries on network or 5xx
  console.error("device-verify: complete failed after retries", lastErr)
  enterState("error-network")
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }

// —————————————————————————————————————— Copy ——————————————————————————————————————

async function onCopy(e) {
  e.preventDefault()
  if (copyTimeoutId) {
    clearTimeout(copyTimeoutId)
    copyTimeoutId = 0
  }
  let ok = false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(userCode)
      ok = true
    } else {
      ok = legacyCopy(userCode)
    }
  } catch {
    ok = legacyCopy(userCode)
  }
  if (ok) {
    copyBtn.classList.add("copied")
    if (copyIcon) copyIcon.classList.add("hidden")
    if (checkIcon) checkIcon.classList.remove("hidden")
    if (copyLabel) copyLabel.textContent = "Copied"
  } else {
    copyBtn.classList.add("copied")
    if (copyLabel) copyLabel.textContent = "Press ⌘C"
  }
  copyTimeoutId = setTimeout(() => {
    copyBtn.classList.remove("copied")
    if (copyIcon) copyIcon.classList.remove("hidden")
    if (checkIcon) checkIcon.classList.add("hidden")
    if (copyLabel) copyLabel.textContent = "Copy"
    copyTimeoutId = 0
  }, COPY_RESET_MS)
}

function legacyCopy(text) {
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "absolute"
    ta.style.left = "-9999px"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand && document.execCommand("copy")
    document.body.removeChild(ta)
    return !!ok
  } catch {
    return false
  }
}

// —————————————————————————————————————— Cancel + retry ——————————————————————————————————————

function onCancel(e) {
  e.preventDefault()
  try { window.close() } catch {}
  // window.close() silently fails for non-script-opened tabs. Fall back to a message.
  setTimeout(() => {
    setText("banner-success-message", "This tab couldn't be closed automatically. Use your browser's tab controls (⌘W / Ctrl+W).")
  }, 100)
}

function onRetry(e) {
  e.preventDefault()
  // Reload is the simplest retry — re-runs init, re-fetches the SDK, re-validates the code.
  location.reload()
}

// —————————————————————————————————————— Lifecycle ——————————————————————————————————————

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}

window.addEventListener("beforeunload", () => {
  if (expiryIntervalId) clearInterval(expiryIntervalId)
  if (copyTimeoutId) clearTimeout(copyTimeoutId)
  clearInterval(sbPoll)
})
