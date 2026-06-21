const CSS = `*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#08070B;--surface:#111018;--surface2:#18151F;--line:#282638;--text:#F4F0FF;--muted:#A19AAD;--soft:#736C80;--accent:#B38CFF;--green:#8CFFBF;--red:#FF6B6B;--amber:#FFD36E;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}
html,body{background:var(--bg);color:var(--text);min-height:100vh;font-family:var(--sans);-webkit-font-smoothing:antialiased}
body{background:radial-gradient(circle at 50% -8%,rgba(179,140,255,.1),transparent 26rem),linear-gradient(180deg,#09070D,#08070B 42%,#060507)}
.wrap{max-width:780px;margin:0 auto;padding:2.5rem 1.5rem 3rem}
header{display:flex;align-items:center;justify-content:space-between;padding-bottom:1.25rem;border-bottom:1px solid var(--line);margin-bottom:2rem}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.95rem;letter-spacing:-.01em;color:var(--text);text-decoration:none}
.brand img{width:22px;height:22px}
.header-right{display:flex;align-items:center;gap:12px;font-family:var(--mono);font-size:.65rem;color:var(--soft)}
.updated-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 7px rgba(140,255,191,.5);animation:livePulse 2s ease-in-out infinite}
@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.4}}

/* Overall */
.overall{text-align:center;margin-bottom:2rem}
.overall .state-icon{font-size:1.6rem;font-weight:700;display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:6px;font-family:var(--mono);font-size:.8rem;letter-spacing:.04em;text-transform:uppercase}
.overall.ok .state-icon{background:rgba(140,255,191,.08);color:var(--green);border:1px solid rgba(140,255,191,.18)}
.overall.issues .state-icon{background:rgba(255,107,107,.08);color:var(--red);border:1px solid rgba(255,107,107,.18)}
.overall h1{font-size:1.1rem;font-weight:600;margin-top:.6rem;letter-spacing:-.01em}
.overall .last-updated{font-size:.7rem;color:var(--soft);margin-top:.3rem;font-family:var(--mono)}

/* Metrics */
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:2rem}
.metric{background:rgba(17,16,24,.7);border:1px solid var(--line);border-radius:8px;padding:16px;text-align:center}
.metric .val{font-family:var(--mono);font-size:1.3rem;font-weight:700;letter-spacing:-.03em}
.metric .lbl{font-size:.65rem;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono)}
.metric.green .val{color:var(--green)}.metric.amber .val{color:var(--amber)}.metric.red .val{color:var(--red)}

/* Services */
.section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.section-header h2{font-size:.7rem;font-family:var(--mono);color:var(--soft);text-transform:uppercase;letter-spacing:.1em;font-weight:600}
.section-header .count{font-family:var(--mono);font-size:.65rem;color:var(--muted)}
.services{display:grid;gap:6px;margin-bottom:1.5rem}
.svc{display:flex;align-items:center;gap:12px;background:rgba(17,16,24,.7);border:1px solid var(--line);border-radius:8px;padding:14px 18px;transition:border-color .3s,background .3s}
.svc:hover{border-color:rgba(179,140,255,.15)}
.svc.down{border-color:rgba(255,107,107,.22);background:rgba(255,107,107,.03)}
.svc-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;transition:background .3s}
.svc-dot.up{background:var(--green);box-shadow:0 0 8px rgba(140,255,191,.35)}
.svc-dot.down{background:var(--red);box-shadow:0 0 8px rgba(255,107,107,.35);animation:downPulse 1.5s ease-in-out infinite}
@keyframes downPulse{0%,100%{box-shadow:0 0 6px rgba(255,107,107,.3)}50%{box-shadow:0 0 14px rgba(255,107,107,.55)}}
.svc-info{flex:1;min-width:0}
.svc-name{font-size:.82rem;font-weight:500;color:var(--text);display:flex;align-items:center;gap:6px}
.svc-name .tag{font-size:.58rem;font-family:var(--mono);text-transform:uppercase;letter-spacing:.05em;padding:2px 6px;border-radius:3px;font-weight:600}
.tag.up{background:rgba(140,255,191,.1);color:var(--green)}.tag.down{background:rgba(255,107,107,.1);color:var(--red)}
.svc-detail{font-size:.65rem;color:var(--soft);margin-top:2px;font-family:var(--mono)}
.svc-latency{font-family:var(--mono);font-size:.72rem;color:var(--muted);text-align:right;min-width:48px}
.svc-latency.fast{color:var(--green)}.svc-latency.mid{color:var(--amber)}.svc-latency.slow{color:var(--red)}

/* Sparkline */
.spark{display:flex;gap:1.5px;align-items:flex-end;height:22px;min-width:80px}
.spark-bar{flex:1;min-width:2.5px;border-radius:1.5px;background:var(--green);opacity:.45}
.spark-bar.down-bg{background:var(--red);opacity:.55}

/* History link */
.history-link{text-align:center;margin-top:1rem}
.history-link a{font-family:var(--mono);font-size:.7rem;color:var(--muted);text-decoration:none;transition:color .2s}
.history-link a:hover{color:var(--text)}

footer{text-align:center;padding:2rem 0 0;color:var(--soft);font-size:.68rem;border-top:1px solid var(--line);margin-top:2rem}
footer a{color:var(--muted);text-decoration:none;transition:color .2s}
footer a:hover{color:var(--text)}

@media(max-width:560px){
  .wrap{padding:1.5rem 1rem}
  .metrics{grid-template-columns:1fr;gap:4px}
  .svc{padding:12px 14px;gap:8px}
  .spark{height:16px;min-width:60px}
}`

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCANA — System Status</title>
<meta name="description" content="Real-time operational status for Arcana infrastructure.">
<meta name="theme-color" content="#08070B"><meta name="robots" content="noindex">
<style>${CSS}</style></head>
<body>
<div class="wrap">
  <header>
    <a class="brand" href="/"><img src="/arcana.png" alt="" width="22" height="22"> Arcana System Status</a>
    <div class="header-right"><span class="updated-dot"></span> <span id="freshness">updating…</span></div>
  </header>

  <div class="overall" id="overall"><div class="state-icon">—</div><h1>Checking</h1><div class="last-updated">Connecting to status API…</div></div>

  <div class="metrics" id="metrics"></div>

  <div class="section-header"><h2>Services</h2><div class="count" id="svc-count"></div></div>
  <div class="services" id="services"></div>

  <div class="history-link"><a href="/changelog">View incident history →</a></div>
  <footer>
    <a href="/">Home</a> · <a href="/auth">Sign In</a> · <a href="/credits">Credits</a>
  </footer>
</div>
<script>
var HISTORY = [];
try { var raw = localStorage.getItem('arcana_status_v2'); if (raw) HISTORY = JSON.parse(raw); } catch(e) {}
function pushHistory(entry) { HISTORY.push(entry); if (HISTORY.length > 72) HISTORY.splice(0, HISTORY.length - 72); try { localStorage.setItem('arcana_status_v2', JSON.stringify(HISTORY)); } catch(e) {} }

function latencyLabel(ms) { return ms < 80 ? 'fast' : ms < 250 ? 'mid' : 'slow'; }

function render(d) {
  var now = new Date();
  var entry = { t: now.getUTCHours().toString().padStart(2,'0') + ':' + now.getUTCMinutes().toString().padStart(2,'0'), s: d.services.map(function(s){return s.status === 'up' ? 1 : 0}) };
  pushHistory(entry);

  var allUp = d.summary === 'operational';
  var upCount = d.services.filter(function(s){return s.status === 'up'}).length;
  var total = d.services.length;
  var avgLatency = Math.round(d.services.reduce(function(a,s){return a + s.latency}, 0) / total);
  var downList = d.services.filter(function(s){return s.status === 'down'});

  // Overall
  var o = document.getElementById('overall');
  o.className = 'overall ' + (allUp ? 'ok' : 'issues');
  o.innerHTML = allUp
    ? '<div class="state-icon">✓ Operational</div><h1>All systems running normally</h1><div class="last-updated"></div>'
    : '<div class="state-icon">⚠ Degraded</div><h1>' + downList.length + ' service' + (downList.length > 1 ? 's' : '') + ' affected</h1><div class="last-updated"></div>';

  // Metrics
  var m = document.getElementById('metrics');
  m.innerHTML =
    '<div class="metric ' + (allUp ? 'green' : 'red') + '"><div class="val">' + upCount + '/' + total + '</div><div class="lbl">Services Up</div></div>' +
    '<div class="metric"><div class="val">' + avgLatency + 'ms</div><div class="lbl">Avg Response</div></div>' +
    '<div class="metric ' + (allUp ? 'green' : 'amber') + '"><div class="val">' + Math.round(HISTORY.filter(function(h){return h.s.every(function(v){return v===1})}).length / Math.max(1, HISTORY.length) * 100) + '%</div><div class="lbl">Uptime (' + HISTORY.length + ' checks)</div></div>';

  document.getElementById('svc-count').textContent = upCount + ' of ' + total + ' operational';

  // Services
  var el = document.getElementById('services'); el.textContent = '';
  d.services.forEach(function(svc, i) {
    var down = svc.status === 'down';
    var div = document.createElement('div');
    div.className = 'svc' + (down ? ' down' : '');

    // Sparkline from history
    var spark = '<div class="spark">';
    for (var j = Math.max(0, HISTORY.length - 30); j < HISTORY.length; j++) {
      spark += '<div class="spark-bar' + (HISTORY[j].s[i] === 0 ? ' down-bg' : '') + '" title="' + HISTORY[j].t + ' UTC"></div>';
    }
    spark += '</div>';

    div.innerHTML =
      '<span class="svc-dot ' + svc.status + '"></span>' +
      '<div class="svc-info"><div class="svc-name">' + svc.name + ' <span class="tag ' + svc.status + '">' + (down ? 'Down' : 'Operational') + '</span></div>' +
      (down && svc.error ? '<div class="svc-detail">' + svc.error + '</div>' : '<div class="svc-detail">Responding normally</div>') +
      '</div>' +
      spark +
      '<span class="svc-latency ' + latencyLabel(svc.latency) + '">' + svc.latency + 'ms</span>';
    el.appendChild(div);
  });

  // Freshness
  var ago = Math.max(0, Math.floor((Date.now() - new Date(d.lastChecked).getTime()) / 1000));
  document.getElementById('freshness').textContent = 'Updated ' + ago + 's ago · every 60s';
  var lu = document.querySelector('.last-updated');
  if (lu) lu.textContent = 'Last checked: ' + d.lastChecked.replace('T', ' ').slice(0, 19) + ' UTC';
}

var failed = false;
async function load() {
  try {
    var r = await fetch('/api/status?t=' + Date.now());
    var d = await r.json();
    failed = false;
    render(d);
  } catch(e) {
    if (!failed) {
      document.getElementById('overall').innerHTML = '<div class="state-icon" style="color:var(--red);border-color:rgba(255,107,107,.18);background:rgba(255,107,107,.06)">✕ Unreachable</div><h1>Cannot reach status API</h1><div class="last-updated">Check your connection</div>';
      document.getElementById('freshness').textContent = 'Connection failed';
    }
    failed = true;
  }
}
load();
setInterval(load, 60000);
</script>
</body></html>`

export async function onRequest(): Promise<Response> {
  return new Response(PAGE, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  })
}
