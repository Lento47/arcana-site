const GITHUB_API = "https://api.github.com/repos/Lento47/arcana/releases?per_page=30"

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#08070B;--surface:#111018;--surface2:#171520;--line:#282638;--line2:#3A3650;--text:#F4F0FF;--muted:#A19AAD;--soft:#736C80;--accent:#B38CFF;--accent2:#8FE8FF;--green:#8CFFBF;--mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;--sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
html,body{background:var(--bg);color:var(--text);min-height:100vh}
body{font-family:var(--sans);-webkit-font-smoothing:antialiased;background:radial-gradient(circle at 50% -18%,rgba(179,140,255,.22),transparent 32rem),linear-gradient(180deg,#09070D,#08070B 42%,#060507)}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:64px 64px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.72),transparent 70%)}
a{color:var(--accent);text-decoration:none}
a:hover{color:var(--accent2)}
.wrap{width:min(780px,calc(100% - 36px));margin:0 auto}
.mono{font-family:var(--mono)}
header{border-bottom:1px solid rgba(40,38,56,.72);background:rgba(8,7,11,.76);backdrop-filter:blur(16px)}
.nav{height:68px;display:flex;justify-content:space-between;align-items:center;gap:24px}
.nav .brand{display:flex;align-items:center;gap:10px;font:800 13px/1 var(--mono);letter-spacing:.2em;color:var(--text)}
.brand span{color:var(--accent)}
nav{display:flex;align-items:center;gap:20px;font-size:13px;color:var(--muted)}
nav a{color:var(--muted)}
nav a:hover{color:var(--text)}
nav a.active{color:var(--accent2)}
.page{padding:48px 0 64px}
.kicker{color:var(--accent2);font:800 11px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px}
h1{font-size:clamp(30px,4vw,50px);line-height:1;letter-spacing:-.06em;margin-bottom:6px}
.sub{color:var(--muted);font-size:15px;line-height:1.55;margin-bottom:32px;max-width:520px}
.release{background:rgba(17,16,24,.88);border:1px solid var(--line);padding:22px 24px;margin-bottom:1px;position:relative;overflow:hidden}
.release:first-of-type{border-radius:6px 6px 0 0}
.release:last-of-type{border-radius:0 0 6px 6px}
.release:first-of-type:last-of-type{border-radius:6px}
.release:before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(179,140,255,.72),transparent);opacity:.45}
.release:first-of-type:before{opacity:1}
.rel-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px;flex-wrap:wrap}
.tag{font:700 15px/1 var(--mono);color:var(--text);letter-spacing:-.02em}
.date{font:650 11px/1 var(--mono);color:var(--soft);white-space:nowrap}
.body{color:var(--muted);font-size:14px;line-height:1.6;word-break:break-word}
.body p{margin-bottom:8px}
.body ul,.body ol{padding-left:20px;margin-bottom:8px}
.body li{margin-bottom:3px}
.body code{font-family:var(--mono);font-size:.82em;background:rgba(8,7,11,.6);padding:1px 6px;border-radius:3px;color:var(--accent2)}
.body pre{font-family:var(--mono);font-size:.78rem;background:#050408;border:1px solid var(--line);padding:12px 14px;border-radius:5px;overflow-x:auto;margin-bottom:10px;color:#D9F99D;line-height:1.45}
.body strong{color:var(--text);font-weight:620}
.body a{color:var(--accent)}
.body h2,.body h3{color:var(--text);font-size:1em;font-weight:650;margin:12px 0 4px}
.body hr{border:0;border-top:1px solid var(--line);margin:12px 0}
.empty{text-align:center;padding:64px 0;color:var(--soft);font-family:var(--mono);font-size:13px}
.err{text-align:center;padding:48px 0;color:var(--soft)}
.err .ico{font-size:40px;margin-bottom:8px}
footer{border-top:1px solid var(--line);padding:30px 0;color:var(--soft);font-size:13px}
.footer{display:flex;justify-content:space-between;gap:20px;align-items:center}
.links{display:flex;gap:14px}
.links a{color:var(--soft)}
.links a:hover{color:var(--text)}
.spin{display:inline-block;animation:spin 1.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:560px){
  .wrap{width:min(100% - 28px,780px)}
  nav{display:none}
  .release{padding:16px}
  .footer{align-items:flex-start;flex-direction:column}
}`

function markdownToHtml(md: string): string {
  if (!md) return ""
  let h = md
  // Escape HTML entities
  h = h.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  // Code blocks (``` ... ```)
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
  // Inline code
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>")
  // Bold
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  // Italic
  h = h.replace(/\*(.+?)\*/g, "<em>$1</em>")
  // Headers
  h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>")
  h = h.replace(/^## (.+)$/gm, "<h2>$1</h2>")
  // Horizontal rules
  h = h.replace(/^---$/gm, "<hr>")
  // Unordered lists — group consecutive items
  h = h.replace(/^- (.+)$/gm, "<li>$1</li>")
  h = h.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
  // Paragraphs (double newlines)
  h = h.replace(/\n\n+/g, "</p><p>")
  // Single newlines to <br> within paragraphs
  h = h.replace(/\n/g, "<br>")
  // Wrap in paragraph
  h = "<p>" + h + "</p>"
  // Clean empty paragraphs
  h = h.replace(/<p><\/p>/g, "")
  h = h.replace(/<p>(<ul>)/g, "$1")
  h = h.replace(/(<\/ul>)<\/p>/g, "$1")
  h = h.replace(/<p>(<pre>)/g, "$1")
  h = h.replace(/(<\/pre>)<\/p>/g, "$1")
  return h
}

interface Release {
  tag_name: string
  published_at: string
  body: string
  html_url: string
}

function render(releases: Release[] | null, error: string | null): string {
  let body = ""
  if (error) {
    body = `<div class="err"><div class="ico">⚠</div><div>${error}</div></div>`
  } else if (!releases || releases.length === 0) {
    body = `<div class="empty">No releases yet.</div>`
  } else {
    body = releases.map((r, i) => {
      const date = new Date(r.published_at).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      })
      const notes = markdownToHtml(r.body || "")
      return `<article class="release">
        <div class="rel-top">
          <a class="tag" href="${r.html_url}">${r.tag_name}</a>
          <span class="date">${date}</span>
        </div>
        <div class="body">${notes}</div>
      </article>`
    }).join("")
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Changelog — ARCANA</title>
<meta name="description" content="Release history and updates for Arcana — the terminal interface for AI keys.">
<style>${CSS}</style>
</head>
<body>
<header><div class="wrap nav">
  <a class="brand" href="/"><span>⛧</span> ARCANA</a>
  <nav>
    <a href="/">Home</a>
    <a class="active" href="/changelog">Changelog</a>
    <a href="/credits">Buy Credits</a>
    <a href="/status">Status</a>
  </nav>
</div></header>
<main class="wrap page">
  <div class="kicker">// releases</div>
  <h1>Changelog</h1>
  <p class="sub">Every arcana release. Binaries, fixes, features — published from the <a href="https://github.com/Lento47/arcana">GitHub repo</a> automatically.</p>
  ${body}
</main>
<footer><div class="wrap footer">
  <div><span style="color:var(--accent)">⛧</span> ARCANA · Terminal Interface For AI Keys</div>
  <div class="links">
    <a href="/">Home</a>
    <a href="/changelog">Changelog</a>
    <a href="/credits">Buy Credits</a>
    <a href="/status">Status</a>
  </div>
</div></footer>
</body></html>`
}

export async function onRequest(ctx: { request: Request }): Promise<Response> {
  let releases: Release[] | null = null
  let error: string | null = null

  try {
    const res = await fetch(GITHUB_API, {
      headers: {
        "User-Agent": "arcana-site/1.0",
        "Accept": "application/vnd.github+json",
      },
      // Cloudflare cache — revalidate every 5 min
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit)
    if (!res.ok) {
      if (res.status === 403) error = "GitHub rate limit reached. Check back in a few minutes."
      else error = `GitHub API returned ${res.status}. Try again later.`
    } else {
      releases = await res.json() as Release[]
    }
  } catch (e: any) {
    error = `Unable to load changelog. ${e.message || "Network error"}`
  }

  return new Response(render(releases, error), {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Content-Security-Policy": "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; img-src *",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  })
}
