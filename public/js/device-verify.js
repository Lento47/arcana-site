// public/js/device-verify.js
//
// CLI sign-in page (/auth/device?code=XXXX-XXXX).
//   1. Validate the user code (RFC 8628 4-char × 2, confusable-free).
//   2. Render the seal: code, copy, throttled countdown.
//   3. On Supabase sign-in, POST { user_code, supabaseUserId, email } to
//      /auth/device/complete. The CLI is polling /auth/device/token separately.
//   4. State machine drives visibility via [data-state] on <main.page>.
//      This file is the only place that touches state. CSS owns visibility.

"use strict"

const DEVICE_TTL_SECONDS = 600
const SB_LOAD_TIMEOUT_MS = 8000
const COMPLETE_RETRIES = 3
const COMPLETE_BACKOFF_MS = [400, 800, 1600]
const CODE_REGEX = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/
const COPY_RESET_MS = 1200
const EXPIRY_ANNOUNCE_THRESHOLDS = [600, 300, 120, 60, 30, 10, 0]

let state = "loading"
let userCode = ""
let sbClient = null  // avoid name collision with supabase.js's `let sb` in shared script scope
let expiresAt = 0
let expiryIntervalId = 0
let copyTimeoutId = 0
let lastAnnouncedSecond = -1
let sbResolved = false
let sbResolve, sbReject
const sbReady = new Promise((res, rej) => { sbResolve = res; sbReject = rej })

// — DOM cache —
let pageEl, codeEl, expiryEl, expiryNumEl, expirySuffixEl,
    copyBtn, copyLabel, formEl, emailEl, passwordEl, passwordErrorEl,
    submitBtn, cancelLink, closeTabLink, retryLink,
    bannerErrTitle, bannerErrMessage, bannerAuthTitle, bannerAuthMessage,
    bannerWarnTitle, bannerWarnMessage

function cacheDom() {
  pageEl = document.getElementById("page")
  codeEl = document.getElementById("code")
  expiryEl = document.getElementById("expiry")
  expiryNumEl = document.getElementById("expiry-num")
  expirySuffixEl = document.getElementById("expiry-suffix")
  copyBtn = document.getElementById("copy")
  copyLabel = document.getElementById("copy-label")
  formEl = document.getElementById("form")
  emailEl = document.getElementById("email")
  passwordEl = document.getElementById("password")
  passwordErrorEl = document.getElementById("password-error")
  submitBtn = document.getElementById("submit")
  cancelLink = document.getElementById("cancel")
  closeTabLink = document.getElementById("close-tab")
  retryLink = document.getElementById("retry")
  bannerErrTitle = document.getElementById("banner-err-title")
  bannerErrMessage = document.getElementById("banner-err-message")
  bannerAuthTitle = document.getElementById("banner-auth-title")
  bannerAuthMessage = document.getElementById("banner-auth-message")
  bannerWarnTitle = document.getElementById("banner-warn-title")
  bannerWarnMessage = document.getElementById("banner-warn-message")
}

// — State machine —

const HEADLINES = {
  "loading":        "Your terminal is <em>waiting.</em>",
  "ready":          "Your terminal is <em>waiting.</em>",
  "pending-auto":   "Completing sign-in",
  "success":        "Approved",
  "error-invalid":  "Invalid sign-in link",
  "error-auth":     "Sign-in failed",
  "error-expired":  "Code expired",
  "error-network":  "Sign-in unavailable",
  "error-claimed":  "Code already used",
}

const SUBLINES = {
  "loading":       "Confirm this code to send a token back to your terminal.",
  "ready":         "Confirm this code to send a token back to your terminal.",
  "pending-auto":  "Resuming your session and routing the token to your terminal.",
  "success":       "Your terminal received its access token. You can close this tab.",
  "error-invalid": "This link is missing a valid code. Run `arcana sign-in` in your terminal to start over.",
  "error-auth":    "Check your credentials and try again.",
  "error-expired": "Codes expire after ten minutes. Run `arcana sign-in` in your terminal to start over.",
  "error-network": "Check your network and try again.",
  "error-claimed": "This code was already used. Run `arcana sign-in` in your terminal to start over.",
}

function enterState(next) {
  if (state === next) return
  state = next
  if (pageEl) pageEl.dataset.state = next
  if (pageEl) pageEl.setAttribute("aria-busy", next === "loading" || next === "pending-auto" ? "true" : "false")

  const headline = document.getElementById("headline")
  if (headline) headline.innerHTML = HEADLINES[next] || HEADLINES.loading
  const sub = document.querySelector(".subline")
  if (sub) sub.textContent = SUBLINES[next] || SUBLINES.loading

  // Stop the countdown when we leave a state that needs it
  if (next !== "ready" && next !== "pending-auto" && expiryIntervalId) {
    clearInterval(expiryIntervalId)
    expiryIntervalId = 0
  }

  // Per-state banner copy. The error/warn banners share DOM elements, so each
  // state that uses them must set its own title + message — otherwise the
  // previous state's text leaks through.
  if (next === "error-expired" && bannerErrTitle && bannerErrMessage) {
    bannerErrTitle.textContent = "Code expired"
    bannerErrMessage.innerHTML = "Codes expire after ten minutes. Run <code style=\"font-family: var(--mono); font-size: 11px;\">arcana sign-in</code> in your terminal to start over."
  }
  if (next === "error-invalid" && bannerErrTitle && bannerErrMessage) {
    bannerErrTitle.textContent = "Invalid sign-in link"
    bannerErrMessage.innerHTML = "This link is missing a valid code. Run <code style=\"font-family: var(--mono); font-size: 11px;\">arcana sign-in</code> in your terminal to start over."
  }

  window.dispatchEvent(new CustomEvent("arcana:device:state", { detail: { state: next } }))
}

// — Init —

function init() {
  cacheDom()

  // Static listeners
  if (copyBtn) copyBtn.addEventListener("click", onCopy)
  if (formEl) formEl.addEventListener("submit", onSubmit)
  if (cancelLink) cancelLink.addEventListener("click", onCancel)
  if (closeTabLink) closeTabLink.addEventListener("click", onCancel)
  if (retryLink) retryLink.addEventListener("click", onRetry)
  const revealBtn = document.getElementById("reveal")
  if (revealBtn) {
    revealBtn.addEventListener("click", () => {
      const t = document.getElementById(revealBtn.getAttribute("data-target"))
      if (!t) return
      const show = t.type === "password"
      t.type = show ? "text" : "password"
      revealBtn.textContent = show ? "hide" : "show"
    })
  }
  for (const [id, provider] of [["oauth-github", "github"], ["oauth-google", "google"]]) {
    const btn = document.getElementById(id)
    if (!btn) continue
    btn.addEventListener("click", () => onOAuth(provider))
  }

  // supabase.js dispatches arcana:auth-offline if the SDK never appeared
  window.addEventListener("arcana:auth-offline", () => {
    if (!sbResolved) { sbResolved = true; sbReject(new Error("Supabase unavailable")) }
  })

  // Parse + validate
  const params = new URLSearchParams(location.search)
  userCode = (params.get("code") || "").trim()
  if (!CODE_REGEX.test(userCode)) {
    setCode("---- - ----")
    enterState("error-invalid")
    return
  }

  setCode(userCode)
  document.title = "Approve sign-in · Arcana"

  Promise.race([
    sbReady,
    new Promise((_, rej) => setTimeout(() => {
      if (!sbResolved) { sbResolved = true; rej(new Error("Supabase load timeout")) }
    }, SB_LOAD_TIMEOUT_MS)),
  ])
    .then((client) => {
      sbClient = client
      enterState("ready")
      attemptAutoComplete()
    })
    .catch(() => enterState("error-network"))
}

function setCode(c) {
  if (codeEl) codeEl.textContent = c
}

function startCountdown() {
  if (expiryIntervalId) clearInterval(expiryIntervalId)
  expiresAt = Date.now() + DEVICE_TTL_SECONDS * 1000
  lastAnnouncedSecond = -1
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

  let dataState = "ok"
  let suffix = "remaining"
  if (totalSeconds <= 0) { dataState = "expired"; suffix = "· expired" }
  else if (totalSeconds <= 10) { dataState = "expiring"; suffix = "· expiring" }
  expiryEl.dataset.state = dataState
  if (expirySuffixEl) expirySuffixEl.textContent = suffix

  const shouldAnnounce = EXPIRY_ANNOUNCE_THRESHOLDS.includes(totalSeconds)
  if (shouldAnnounce && totalSeconds !== lastAnnouncedSecond) {
    lastAnnouncedSecond = totalSeconds
    expiryEl.setAttribute("aria-live", "off")
    void expiryEl.offsetWidth
    expiryEl.setAttribute("aria-live", "polite")
  }

  if (totalSeconds <= 0) {
    clearInterval(expiryIntervalId)
    expiryIntervalId = 0
    if (state === "ready") enterState("error-expired")
  }
}

// — Supabase bridge —

function bindSbReady() {
  if (window.__ARCANA_SB__ && !sbResolved) {
    sbResolved = true
    sbResolve(window.__ARCANA_SB__)
    return true
  }
  return false
}

const sbPoll = setInterval(() => { if (bindSbReady()) clearInterval(sbPoll) }, 50)

// — Form —

async function onSubmit(e) {
  e.preventDefault()
  if (!sbClient) { enterState("error-network"); return }
  const email = emailEl.value.trim()
  const password = passwordEl.value
  if (!email || !password) {
    passwordErrorEl.textContent = "Email and password are required."
    passwordErrorEl.hidden = false
    return
  }
  passwordErrorEl.hidden = true
  try {
    const { data, error } = await sbClient.auth.signInWithPassword({ email, password })
    if (error) {
      bannerAuthTitle.textContent = "Sign-in failed"
      bannerAuthMessage.textContent = error.message || "Check your credentials and try again."
      enterState("error-auth")
      return
    }
    if (data?.session) await postComplete(data.session)
  } catch (err) {
    bannerAuthTitle.textContent = "Sign-in error"
    bannerAuthMessage.textContent = err?.message || "Unexpected error during sign-in."
    enterState("error-auth")
  }
}

async function onOAuth(provider) {
  if (!sbClient) { enterState("error-network"); return }
  try {
    const { error } = await sbClient.auth.signInWithOAuth({ provider, options: { redirectTo: location.href } })
    if (error) {
      bannerAuthTitle.textContent = "Sign-in failed"
      bannerAuthMessage.textContent = error.message || "Unexpected error."
      enterState("error-auth")
    }
  } catch {
    enterState("error-network")
  }
}

async function attemptAutoComplete() {
  if (!sbClient) return
  try {
    const { data } = await sbClient.auth.getSession()
    if (data?.session) {
      enterState("pending-auto")
      await postComplete(data.session)
    } else {
      startCountdown()
    }
  } catch {
    startCountdown()
  }
}

// — /auth/device/complete —

async function postComplete(session) {
  const user = session?.user
  if (!user || !user.id || !user.email) {
    bannerAuthTitle.textContent = "Sign-in incomplete"
    bannerAuthMessage.textContent = "We could not read your account details."
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
      if (res.status === 409) { enterState("error-claimed"); return }
      if (res.status >= 500) {
        lastErr = new Error(`Server ${res.status}`)
        if (attempt < COMPLETE_RETRIES - 1) await delay(COMPLETE_BACKOFF_MS[attempt])
        continue
      }
      if (!res.ok) {
        let desc = `Server returned ${res.status}`
        try { const j = await res.json(); if (j?.error_description || j?.error) desc = j.error_description || j.error } catch {}
        bannerAuthTitle.textContent = "Approval failed"
        bannerAuthMessage.textContent = desc
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
  console.error("device-verify: complete failed after retries", lastErr)
  enterState("error-network")
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }

// — Copy —

async function onCopy(e) {
  e.preventDefault()
  if (copyTimeoutId) { clearTimeout(copyTimeoutId); copyTimeoutId = 0 }
  let ok = false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(userCode)
      ok = true
    } else {
      ok = legacyCopy(userCode)
    }
  } catch { ok = legacyCopy(userCode) }

  if (ok) {
    copyBtn.classList.add("copied"); copyBtn.classList.remove("failed")
    copyLabel.textContent = "copied"
  } else {
    copyBtn.classList.add("failed"); copyBtn.classList.remove("copied")
    copyLabel.textContent = "press ⌘C"
  }
  copyTimeoutId = setTimeout(() => {
    copyBtn.classList.remove("copied", "failed")
    copyLabel.textContent = "copy"
    copyTimeoutId = 0
  }, COPY_RESET_MS)
}

function legacyCopy(text) {
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "absolute"; ta.style.left = "-9999px"
    document.body.appendChild(ta); ta.select()
    const ok = document.execCommand && document.execCommand("copy")
    document.body.removeChild(ta)
    return !!ok
  } catch { return false }
}

// — Cancel + retry —

function onCancel(e) {
  e.preventDefault()
  // The cancel link is visible during ready/error states; the close-tab link
  // lives inside the success banner (hidden until success). Give the user
  // visible feedback in the link they actually clicked.
  try { window.close() } catch {}
  if (cancelLink) {
    cancelLink.textContent = "Press ⌘W to close this tab"
  } else if (closeTabLink) {
    closeTabLink.textContent = "Press ⌘W to close this tab"
  }
}

function onRetry(e) {
  e.preventDefault()
  location.reload()
}

// — Lifecycle —

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
