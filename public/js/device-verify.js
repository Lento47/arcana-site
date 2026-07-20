// public/js/device-verify.js
// Wires the device-flow verification page (/auth/device?code=ABCD-1234) to:
//   1. Read the user_code from the URL.
//   2. On Supabase sign-in (password, OAuth, or magic link), POST
//      { user_code, supabaseUserId, email } to /auth/device/complete.
//   3. Show a success banner so the user knows to return to the terminal.
// The CLI is polling /auth/device/token separately; once the complete endpoint
// writes license_key back to KV, the CLI receives its access_token.

const params = new URLSearchParams(location.search)
const userCode = (params.get("code") || "").trim()
const codeValid = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(userCode)

const $ = (id) => document.getElementById(id)

function showOnly(id) {
  for (const el of document.querySelectorAll(".banner, .skeleton, .auth-mode")) {
    el.setAttribute("aria-hidden", "true")
    if (el.classList.contains("banner")) el.style.display = "none"
  }
  if (id === "skeleton") {
    $("skeleton").setAttribute("aria-hidden", "false")
    $("skeleton").style.display = ""
  } else if (id === "form") {
    $("mode-personal").setAttribute("aria-hidden", "false")
    $("mode-personal").style.display = ""
  } else {
    const el = $(id)
    if (el) {
      el.setAttribute("aria-hidden", "false")
      el.style.display = ""
    }
  }
}

function showError(title, message) {
  $("banner-error-title").textContent = title
  $("banner-error-message").textContent = message
  showOnly("banner-error")
}

function showSuccess(message) {
  if (message) $("banner-success-message").textContent = message
  showOnly("banner-success")
}

function showInfo(message) {
  if (message) $("banner-info-message").textContent = message
  showOnly("banner-info")
}

async function postComplete(session) {
  const user = session.user
  if (!user || !user.id || !user.email) {
    showError("Sign-in incomplete", "We could not read your account details.")
    return
  }
  showInfo("Completing device sign-in…")
  try {
    const res = await fetch("/auth/device/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_code: userCode,
        supabaseUserId: user.id,
        email: user.email,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const desc = body?.error_description || body?.error || `Server returned ${res.status}`
      showError("Approval failed", desc)
      return
    }
    showSuccess("Approved. You can close this tab and return to your terminal.")
  } catch (err) {
    showError("Network error", "Could not reach the approval endpoint.")
  }
}

function wireForm() {
  const form = $("form-signin")
  if (!form) return
  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    if (!window.__ARCANA_SB__) {
      showError("Sign-in unavailable", "Supabase client is not ready. Refresh and try again.")
      return
    }
    const email = $("signin-email").value.trim()
    const password = $("signin-password").value
    if (!email || !password) {
      $("signin-password-error").textContent = "Email and password are required."
      $("signin-password-error").classList.remove("hidden")
      return
    }
    $("signin-password-error").classList.add("hidden")
    showInfo("Signing in…")
    try {
      const { data, error } = await window.__ARCANA_SB__.auth.signInWithPassword({ email, password })
      if (error) {
        showError("Sign-in failed", error.message || "Check your credentials and try again.")
        return
      }
      if (data?.session) await postComplete(data.session)
    } catch (err) {
      showError("Sign-in error", err?.message || "Unexpected error during sign-in.")
    }
  })

  for (const [id, provider] of [["oauth-github", "github"], ["oauth-google", "google"]]) {
    const btn = $(id)
    if (!btn) continue
    btn.addEventListener("click", async () => {
      if (!window.__ARCANA_SB__) return
      showInfo(`Redirecting to ${provider}…`)
      try {
        const { error } = await window.__ARCANA_SB__.auth.signInWithOAuth({
          provider,
          options: { redirectTo: location.href },
        })
        if (error) showError("Sign-in failed", error.message)
      } catch (err) {
        showError("Sign-in error", err?.message || "Unexpected error.")
      }
    })
  }

  // Password reveal toggle (matches /auth pattern).
  for (const btn of document.querySelectorAll(".toggle-password")) {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.getAttribute("data-target"))
      if (!target) return
      target.type = target.type === "password" ? "text" : "password"
    })
  }
}

async function init() {
  if (!codeValid) {
    $("device-title").textContent = "Invalid sign-in link"
    $("device-subtitle").textContent = "This link is missing a valid code. Run the login command again from your terminal."
    showError("Invalid code", "The URL does not contain a valid device code.")
    return
  }

  // Reveal the form once Supabase is available.
  const waitForSb = () => new Promise((resolve) => {
    if (window.__ARCANA_SB__) return resolve(window.__ARCANA_SB__)
    const t = setInterval(() => {
      if (window.__ARCANA_SB__) {
        clearInterval(t)
        resolve(window.__ARCANA_SB__)
      }
    }, 50)
  })
  await waitForSb()
  showOnly("form")
  wireForm()

  // If the user is already signed in (e.g. session persisted from another tab),
  // auto-complete without forcing a re-entry.
  try {
    const { data } = await window.__ARCANA_SB__.auth.getSession()
    if (data?.session) {
      await postComplete(data.session)
    }
  } catch {
    /* no session, continue to form */
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
