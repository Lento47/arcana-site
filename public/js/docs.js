// public/js/docs.js
// Progressive enhancement for /docs:
//   1. Inject a "copy" button on every <pre data-lang> in the content.
//   2. Highlight the active sidebar link as the user scrolls.
//   3. Toggle the sidebar accordion on mobile (<960px).
//   4. Build a right-rail TOC from h2/h3 in the content area.
//   5. Pre-mark the sidebar link matching location.hash on first paint.

(() => {
  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

  // --- 1. Copy buttons on code blocks ---
  function attachCopyButtons() {
    const blocks = $$(".docs-content pre")
    for (const pre of blocks) {
      if (pre.querySelector(".docs-code-copy")) continue
      const code = pre.querySelector("code")
      if (!code) continue

      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "docs-code-copy"
      btn.setAttribute("aria-label", "Copy code to clipboard")
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span>Copy</span>
      `

      btn.addEventListener("click", async () => {
        const label = btn.querySelector("span")
        const original = label.textContent
        let ok = false
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(code.textContent)
            ok = true
          } else {
            const sel = window.getSelection()
            const range = document.createRange()
            range.selectNodeContents(code)
            sel.removeAllRanges()
            sel.addRange(range)
            ok = document.execCommand && document.execCommand("copy")
            sel.removeAllRanges()
          }
        } catch {
          ok = false
        }
        btn.classList.add("is-copied")
        label.textContent = ok ? "Copied" : "Select & copy"
        setTimeout(() => {
          btn.classList.remove("is-copied")
          label.textContent = original
        }, 1400)
      })

      pre.appendChild(btn)
    }
  }

  // --- 2. Sidebar active-section highlighting ---
  function setupSidebarObserver() {
    const sections = $$(".docs-content h2[id], .docs-content h3[id]")
    if (!sections.length) return

    const linkByHash = new Map()
    for (const a of $$(".docs-sidebar-link")) {
      const hash = a.getAttribute("href") || ""
      if (hash.startsWith("#")) linkByHash.set(hash.slice(1), a)
    }

    const setActive = (id) => {
      for (const a of $$(".docs-sidebar-link")) a.classList.remove("is-active")
      const target = linkByHash.get(id)
      if (target) target.classList.add("is-active")
    }

    // Pre-mark the hash on first paint, before observer fires.
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1))
      if (linkByHash.has(id)) setActive(id)
    }

    // Track the section closest to the top of the viewport.
    const visible = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio)
          else visible.delete(e.target.id)
        }
        if (visible.size === 0) return
        // Pick the topmost visible section.
        const ordered = sections.filter((s) => visible.has(s.id))
        if (ordered.length) {
          ordered.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
          setActive(ordered[0].id)
        }
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: [0, 0.2, 0.5, 1] }
    )
    for (const s of sections) io.observe(s)
  }

  // --- 3. Mobile sidebar accordion ---
  function setupSidebarToggle() {
    const sidebar = $("#docs-sidebar")
    const toggle = sidebar && sidebar.querySelector(".docs-sidebar-toggle")
    if (!sidebar || !toggle) return

    const sync = () => {
      const isMobile = window.matchMedia("(max-width: 960px)").matches
      if (!isMobile) {
        sidebar.classList.remove("is-open")
        toggle.setAttribute("aria-expanded", "false")
        return
      }
      toggle.setAttribute("aria-expanded", sidebar.classList.contains("is-open") ? "true" : "false")
    }

    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("is-open")
      sync()
    })
    window.addEventListener("resize", sync, { passive: true })
    sync()
  }

  // --- 4. Right-rail TOC (desktop ≥1280px) ---
  function buildToc() {
    const toc = $("#docs-toc")
    if (!toc) return
    const headings = $$(".docs-content h2[id], .docs-content h3[id]")
    if (!headings.length) return

    for (const h of headings) {
      const a = document.createElement("a")
      a.href = `#${h.id}`
      a.dataset.depth = h.tagName === "H3" ? "3" : "2"
      a.textContent = h.textContent.replace(/#$/, "").trim()
      toc.appendChild(a)
    }

    const tocLinks = $$("a", toc)
    const linkByHash = new Map()
    for (const a of tocLinks) linkByHash.set(a.getAttribute("href").slice(1), a)

    const setActive = (id) => {
      for (const a of tocLinks) a.classList.remove("is-active")
      const target = linkByHash.get(id)
      if (target) target.classList.add("is-active")
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActive(visible[0].target.id)
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: [0, 0.2] }
    )
    for (const h of headings) io.observe(h)
  }

  // --- 5. Anchor link injection on h2/h3/h4 ---
  function injectAnchors() {
    for (const h of $$(".docs-content h2[id], .docs-content h3[id], .docs-content h4[id]")) {
      if (h.querySelector(".docs-anchor")) continue
      const a = document.createElement("a")
      a.href = `#${h.id}`
      a.className = "docs-anchor"
      a.setAttribute("aria-label", "Direct link")
      a.textContent = "#"
      h.appendChild(a)
    }
  }

  // --- 6. Sidebar links: close mobile accordion on click ---
  function setupLinkClose() {
    for (const a of $$(".docs-sidebar-link")) {
      a.addEventListener("click", () => {
        const sidebar = $("#docs-sidebar")
        if (sidebar && window.matchMedia("(max-width: 960px)").matches) {
          sidebar.classList.remove("is-open")
          const toggle = sidebar.querySelector(".docs-sidebar-toggle")
          if (toggle) toggle.setAttribute("aria-expanded", "false")
        }
      })
    }
  }

  const init = () => {
    attachCopyButtons()
    injectAnchors()
    setupSidebarObserver()
    setupSidebarToggle()
    buildToc()
    setupLinkClose()
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
