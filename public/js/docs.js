// public/js/docs.js
// Progressive enhancement for /docs:
//   1. Inject a "copy" button on every <pre data-lang> in the content.
//   2. Highlight the active sidebar link as the user scrolls.
//   3. Toggle the sidebar accordion on mobile (<960px).
//   4. Build a right-rail TOC from h2/h3 in the content area.
//   5. Pre-mark the sidebar link matching location.hash on first paint.
//   6. Search bar with keyboard shortcut (/), arrow-key navigation, and scroll-close.

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

  // --- 2. Left sidebar: highlight chapter for the heading in view ---
  function setupSidebarObserver() {
    const headings = $$(".docs-content h2[id], .docs-content h3[id]")
    if (!headings.length) return

    const chapterIds = []
    const linkByHash = new Map()
    for (const a of $$(".docs-sidebar-link")) {
      const hash = a.getAttribute("href") || ""
      if (hash.startsWith("#")) {
        const id = hash.slice(1)
        linkByHash.set(id, a)
        chapterIds.push(id)
      }
    }
    if (!chapterIds.length) return

    const chapterForHeading = new Map()
    let currentChapter = chapterIds[0]
    for (const h of headings) {
      if (linkByHash.has(h.id)) currentChapter = h.id
      chapterForHeading.set(h.id, currentChapter)
    }

    const setActive = (chapterId) => {
      for (const a of $$(".docs-sidebar-link")) a.classList.remove("is-active")
      const target = linkByHash.get(chapterId)
      if (target) target.classList.add("is-active")
    }

    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1))
      setActive(chapterForHeading.get(id) || (linkByHash.has(id) ? id : chapterIds[0]))
    }

    const visible = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top)
          else visible.delete(e.target.id)
        }
        if (visible.size === 0) return
        const ordered = headings.filter((h) => visible.has(h.id))
        if (!ordered.length) return
        ordered.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
        const chapter = chapterForHeading.get(ordered[0].id)
        if (chapter) setActive(chapter)
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: [0, 0.15, 0.4, 1] },
    )
    for (const h of headings) io.observe(h)
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

  // --- 4. Right-rail: on-this-page only (all h2/h3) ---
  function buildToc() {
    const toc = $("#docs-toc")
    if (!toc) return
    for (const child of Array.from(toc.children)) {
      if (!child.classList.contains("docs-toc-label")) child.remove()
    }
    const headings = $$(".docs-content h2[id], .docs-content h3[id]")
    if (!headings.length) return

    for (const h of headings) {
      const a = document.createElement("a")
      a.href = `#${h.id}`
      a.dataset.depth = h.tagName === "H3" ? "3" : "2"
      a.textContent = (h.childNodes[0]?.textContent || h.textContent || "")
        .replace(/#$/, "")
        .trim()
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

  // --- 7. Search functionality with keyboard navigation ---
  function setupSearch() {
    const form = $(".docs-search")
    const input = $("#docs-search-input")
    const resultsEl = $("#docs-search-results")
    if (!form || !input || !resultsEl) return

    // Prevent form submission (no inline onsubmit)
    form.addEventListener("submit", (e) => e.preventDefault())

    // Set ARIA attributes on results container
    resultsEl.setAttribute("role", "listbox")
    resultsEl.setAttribute("aria-label", "Search results")

    // Build search index from sidebar links + content headings
    const searchIndex = []

    // Sidebar links (cross-page)
    for (const a of $$(".docs-sidebar-link")) {
      const href = a.getAttribute("href") || ""
      const text = a.textContent.trim()
      if (text && href) {
        let section = ""
        const sectionEl = a.closest(".docs-sidebar-section")
        if (sectionEl) {
          const label = sectionEl.querySelector(".docs-sidebar-label")
          if (label) section = label.textContent.trim()
        }
        searchIndex.push({ title: text, href, section, type: "page" })
      }
    }

    // Content headings (same-page)
    for (const h of $$(".docs-content h2[id], .docs-content h3[id]")) {
      const text = (h.childNodes[0]?.textContent || h.textContent || "").replace(/#$/, "").trim()
      if (text) {
        searchIndex.push({ title: text, href: `#${h.id}`, section: "This page", type: "heading" })
      }
    }

    // Deduplicate by href
    const seen = new Set()
    const deduped = searchIndex.filter((item) => {
      if (seen.has(item.href)) return false
      seen.add(item.href)
      return true
    })

    let activeIndex = -1

    function highlightMatch(text, query) {
      if (!query) return text
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      return text.replace(regex, "<mark>$1</mark>")
    }

    function updateActiveResult(index) {
      const results = $$(".docs-search-result", resultsEl)
      // Remove previous active
      results.forEach((r, i) => {
        if (i === activeIndex) {
          r.classList.remove("is-active")
          r.removeAttribute("aria-selected")
        }
      })
      // Set new active
      activeIndex = index
      if (index >= 0 && results[index]) {
        results[index].classList.add("is-active")
        results[index].setAttribute("aria-selected", "true")
        results[index].scrollIntoView({ block: "nearest" })
        // Update input aria-activedescendant
        input.setAttribute("aria-activedescendant", results[index].id)
      } else {
        input.removeAttribute("aria-activedescendant")
      }
    }

    let resultCounter = 0
    function showResults(results, query) {
      activeIndex = -1
      resultCounter = 0
      if (!results.length) {
        resultsEl.innerHTML = `<div class="docs-search-empty" role="option">No results for "${query}"</div>`
        resultsEl.classList.add("is-open")
        input.setAttribute("aria-expanded", "true")
        return
      }
      resultsEl.innerHTML = results
        .map(
          (r) =>
            `<a class="docs-search-result" id="search-result-${resultCounter++}" href="${r.href}" role="option" aria-selected="false">
              <span class="docs-search-result-title">${highlightMatch(r.title, query)}</span>
              <span class="docs-search-result-section">${r.section || ""}</span>
            </a>`
        )
        .join("")
      resultsEl.classList.add("is-open")
      input.setAttribute("aria-expanded", "true")
    }

    function closeResults() {
      resultsEl.classList.remove("is-open")
      input.removeAttribute("aria-expanded")
      input.removeAttribute("aria-activedescendant")
      activeIndex = -1
    }

    let debounceTimer
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const query = input.value.trim().toLowerCase()
        if (query.length < 2) {
          closeResults()
          return
        }
        const results = deduped.filter((r) =>
          r.title.toLowerCase().includes(query)
        )
        showResults(results, query)
      }, 150)
    })

    // Single keyboard handler — handles all keys
    document.addEventListener("keydown", (e) => {
      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA"
      const isOpen = resultsEl.classList.contains("is-open")

      // Escape: close search results
      if (e.key === "Escape" && isOpen) {
        e.preventDefault()
        closeResults()
        if (isInput) input.blur()
        return
      }

      // Global shortcut: / or Cmd+K to open search
      if (!isInput && (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey)))) {
        e.preventDefault()
        input.focus()
        return
      }

      // Arrow key + Enter navigation in search results
      if (isInput && isOpen) {
        const results = $$(".docs-search-result", resultsEl)
        if (!results.length) return

        if (e.key === "ArrowDown") {
          e.preventDefault()
          updateActiveResult(Math.min(activeIndex + 1, results.length - 1))
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          updateActiveResult(Math.max(activeIndex - 1, 0))
        } else if (e.key === "Enter" && activeIndex >= 0) {
          e.preventDefault()
          window.location.href = results[activeIndex].getAttribute("href")
        }
      }
    })

    // Close results on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".docs-search")) {
        closeResults()
      }
    })

    // Close results on scroll (throttled with RAF)
    let scrollRaf
    window.addEventListener("scroll", () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null
        if (resultsEl.classList.contains("is-open")) {
          closeResults()
        }
      })
    }, { passive: true })
  }

  // --- 8. Platform-aware shortcut badge ---
  function setupShortcutBadge() {
    const kbd = $(".docs-search-kbd")
    if (!kbd) return
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    kbd.textContent = isMac ? "\u2318K" : "Ctrl K"
  }

  const init = () => {
    attachCopyButtons()
    injectAnchors()
    setupSidebarObserver()
    setupSidebarToggle()
    buildToc()
    setupLinkClose()
    setupSearch()
    setupShortcutBadge()
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
