const CSS = `*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#08070B;--surface:#111018;--surface2:#18151F;--line:#282638;--text:#F4F0FF;--muted:#A19AAD;--soft:#736C80;--accent:#B38CFF;--green:#8CFFBF;--red:#FF6B6B;--amber:#FFD36E;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}
html,body{background:var(--bg);color:var(--text);min-height:100vh;font-family:var(--sans);-webkit-font-smoothing:antialiased}
body{background:radial-gradient(circle at 50% -10%,rgba(179,140,255,.12),transparent 28rem),linear-gradient(180deg,#09070D,#08070B 42%,#060507)}
.wrap{max-width:720px;margin:0 auto;padding:3rem 1.5rem}
header{display:flex;align-items:center;justify-content:space-between;padding-bottom:1.25rem;border-bottom:1px solid var(--line);margin-bottom:2rem}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:1rem;letter-spacing:-.01em;color:var(--text);text-decoration:none}
.brand img{width:24px;height:24px}
.refresh-status{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:.65rem;color:var(--soft)}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px rgba(140,255,191,.5);animation:livePulse 2s ease-in-out infinite;flex-shrink:0}
@keyframes livePulse{0%,100%{opacity:1;box-shadow:0 0 6px rgba(140,255,191,.4)}50%{opacity:.5;box-shadow:0 0 12px rgba(140,255,191,.7)}}
.overall{text-align:center;margin-bottom:2.5rem;transition:color .4s}
.overall .icon{font-size:2.2rem;margin-bottom:.5rem;display:inline-block;transition:transform .3s}
.overall.ok .icon{animation:iconPop .4s ease-out}
@keyframes iconPop{0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
.overall h1{font-size:1.15rem;font-weight:600;letter-spacing:-.01em;margin-bottom:.3rem}
.overall .sub{font-size:.8rem;color:var(--muted);font-family:var(--mono);min-height:1.2em}
.overall.issues .icon{color:var(--red)}
.overall.ok .icon{color:var(--green)}
.grid{display:grid;gap:8px;margin-bottom:1.5rem}
.card{background:rgba(17,16,24,.82);border:1px solid var(--line);border-radius:10px;padding:14px 18px;transition:border-color .35s,background .35s,transform .2s}
.card:hover{transform:translateY(-1px)}
.card.down{border-color:rgba(255,107,107,.3);background:rgba(255,107,107,.045)}
.card.recovered{border-color:rgba(140,255,191,.3);background:rgba(140,255,191,.03)}
.card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.card-left{display:flex;align-items:center;gap:10px}
.status-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;transition:background .35s,box-shadow .35s}
.status-dot.up{background:var(--green);box-shadow:0 0 10px rgba(140,255,191,.45)}
.status-dot.down{background:var(--red);box-shadow:0 0 10px rgba(255,107,107,.45);animation:downPulse 1.5s ease-in-out infinite}
@keyframes downPulse{0%,100%{box-shadow:0 0 8px rgba(255,107,107,.35)}50%{box-shadow:0 0 16px rgba(255,107,107,.6)}}
.status-dot.recovered{background:var(--green);box-shadow:0 0 16px rgba(140,255,191,.7);animation:dotPulse .45s ease-out 4}
@keyframes dotPulse{0%{transform:scale(1)}50%{transform:scale(2)}100%{transform:scale(1)}}
.card-name{font-size:.88rem;font-weight:500;color:var(--text)}
.card-name small{font-size:.68rem;color:var(--green);margin-left:6px;font-weight:500}
.card-latency{font-family:var(--mono);font-size:.72rem;transition:color .3s}
.lat-fast{color:#8CFFBF}.lat-mid{color:var(--amber)}.lat-slow{color:var(--red)}
.card-error{font-family:var(--mono);font-size:.68rem;color:var(--red);margin:4px 0 0 23px;line-height:1.5;padding:3px 8px;background:rgba(255,107,107,.06);border-radius:4px;display:inline-block}
.card-stats{display:flex;align-items:center;gap:10px;margin-top:6px;padding-left:23px}
.mini-bars{display:flex;gap:2.5px;flex:1;align-items:flex-end;height:26px;padding:2px 0}
.mini-bar{flex:1;min-width:3px;border-radius:2px 2px 1px 1px;transition:opacity .2s,transform .2s;cursor:pointer;position:relative;opacity:.4;background:linear-gradient(to top,rgba(161,154,173,.15),rgba(161,154,173,.05))}
.mini-bar:hover{opacity:1;transform:scaleY(1.15)}
.mini-bar.up{background:linear-gradient(to top,rgba(140,255,191,.85),rgba(140,255,191,.3));opacity:1;box-shadow:0 0 3px rgba(140,255,191,.15)}
.mini-bar.down{background:linear-gradient(to top,rgba(255,107,107,.8),rgba(255,107,107,.25));opacity:1;box-shadow:0 0 3px rgba(255,107,107,.12)}
.mini-bar[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--surface2);color:var(--text);padding:2px 6px;border-radius:3px;font-size:.55rem;white-space:nowrap;pointer-events:none;z-index:10;border:1px solid var(--line);font-family:var(--mono)}
.uptime{font-family:var(--mono);font-size:.63rem;color:var(--muted);white-space:nowrap;min-width:60px;text-align:right}
.uptime strong{color:var(--text);font-weight:600}
.summary-row{display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 18px;background:rgba(17,16,24,.6);border:1px solid var(--line);border-radius:8px;text-align:center}
.summary-row .badge{font-family:var(--mono);font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;padding:4px 12px;border-radius:4px}
.badge.ok{background:rgba(140,255,191,.1);color:var(--green);border:1px solid rgba(140,255,191,.2)}
.badge.issues{background:rgba(255,107,107,.1);color:var(--red);border:1px solid rgba(255,107,107,.2)}
.summary-row .meta{font-size:.68rem;color:var(--soft);font-family:var(--mono)}
.timestamp{font-family:var(--mono);font-size:.63rem;color:var(--soft);text-align:center;margin-top:1rem}
footer{text-align:center;padding:2rem 0 1rem;color:var(--soft);font-size:.68rem;border-top:1px solid var(--line);margin-top:2rem}
footer a{color:var(--muted);text-decoration:none;transition:color .2s}
footer a:hover{color:var(--text)}
@media(max-width:520px){.wrap{padding:2rem 1rem}.card{padding:12px 14px}.mini-bars{height:20px;gap:2px}.card-stats{padding-left:21px}}`

const MAX_HISTORY = 48

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCANA — System Status</title>
<meta name="description" content="Real-time operational status for Arcana services.">
<meta name="theme-color" content="#08070B">
<meta name="robots" content="noindex">
<style>${CSS}</style></head>
<body>
<div class="wrap">
  <header>
    <a class="brand" href="/"><img src="/arcana.png" alt="" width="24" height="24"> ARCANA</a>
    <div class="refresh-status"><span class="live-dot"></span> <span id="countdown">next check in 60s</span></div>
  </header>
  <div class="overall" id="overall">
    <div class="icon">—</div>
    <h1>Checking services…</h1>
    <div class="sub">auto-refresh every 60s</div>
  </div>
  <div class="grid" id="services"></div>
  <div class="summary-row" id="summary"></div>
  <div class="timestamp" id="footer"></div>
  <footer>
    <a href="/">Home</a> · <a href="/changelog">Changelog</a> · <a href="/credits">Credits</a>
  </footer>
</div>
<script>
const STORAGE_KEY = 'arcana_status_history';
const MAX = ${MAX_HISTORY};
let history = [];

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) history = JSON.parse(raw);
} catch(e) {}

function miniBar(status, time) {
  var el = document.createElement('div');
  el.className = 'mini-bar ' + status;
  if (time) el.setAttribute('data-tip', time + ' UTC');
  return el;
}

function latencyClass(ms) { return ms < 80 ? 'lat-fast' : ms < 250 ? 'lat-mid' : 'lat-slow'; }
var countdownInterval;

function render(d) {
  var now = new Date();
  var entry = { time: now.getUTCHours().toString().padStart(2,'0') + ':' + now.getUTCMinutes().toString().padStart(2,'0'), statuses: d.services.map(function(s){return s.status}) };
  history.push(entry);
  if (history.length > MAX) history.splice(0, history.length - MAX);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch(e) {}

  var allUp = d.summary === 'operational';
  var overall = document.getElementById('overall');
  overall.className = 'overall ' + (allUp ? 'ok' : 'issues');
  overall.innerHTML = allUp
    ? '<div class="icon">✓</div><h1>All systems operational</h1><div class="sub">Every service is responding normally.</div>'
    : '<div class="icon">⚠</div><h1>Issues detected</h1><div class="sub">Some services are experiencing problems.</div>';

  var el = document.getElementById('services');
  el.textContent = '';

  for (var i = 0; i < d.services.length; i++) {
    var svc = d.services[i];
    var ups = 0, lastDown = '';
    for (var j = 0; j < history.length; j++) {
      if (history[j].statuses[i] === 'up') ups++;
      else if (history[j].statuses[i] === 'down') lastDown = history[j].time;
    }
    var pct = history.length > 0 ? Math.round(ups / history.length * 100) : 100;
    var wasDown = history.length > 0 && history[history.length - 1].statuses[i] === 'down';
    var recovered = wasDown && svc.status === 'up';

    var card = document.createElement('div');
    card.className = 'card' + (svc.status === 'down' ? ' down' : '') + (recovered ? ' recovered' : '');

    var top = document.createElement('div');
    top.className = 'card-top';
    var left = document.createElement('div');
    left.className = 'card-left';
    var dot = document.createElement('span');
    dot.className = 'status-dot ' + svc.status + (recovered ? ' recovered' : '');
    left.appendChild(dot);
    var name = document.createElement('span');
    name.className = 'card-name';
    name.innerHTML = svc.name + (recovered ? ' <small>recovered</small>' : '');
    left.appendChild(name);
    top.appendChild(left);
    var lat = document.createElement('span');
    lat.className = 'card-latency ' + latencyClass(svc.latency);
    lat.textContent = svc.latency + 'ms';
    top.appendChild(lat);
    card.appendChild(top);

    if (svc.status === 'down' && svc.error) {
      var err = document.createElement('div');
      err.className = 'card-error';
      err.textContent = svc.error;
      card.appendChild(err);
    }

    var stats = document.createElement('div');
    stats.className = 'card-stats';
    var bars = document.createElement('div');
    bars.className = 'mini-bars';
    for (var p = history.length; p < MAX; p++) {
      var nb = document.createElement('div');
      nb.className = 'mini-bar';
      bars.appendChild(nb);
    }
    for (var k = 0; k < history.length; k++) {
      bars.appendChild(miniBar(history[k].statuses[i], history[k].time));
    }
    stats.appendChild(bars);
    var upt = document.createElement('div');
    upt.className = 'uptime';
    upt.innerHTML = '<strong>' + pct + '%</strong> uptime';
    if (lastDown) upt.innerHTML += ' · ↓' + lastDown;
    stats.appendChild(upt);
    card.appendChild(stats);
    el.appendChild(card);
  }

  var ago = Math.max(0, Math.floor((Date.now() - new Date(d.lastChecked).getTime()) / 1000));
  var summary = document.getElementById('summary');
  summary.innerHTML = '<div class="badge ' + (allUp ? 'ok' : 'issues') + '">' + (allUp ? 'Operational' : 'Degraded') + '</div><div class="meta">Checked ' + ago + 's ago</div>';
  document.getElementById('footer').textContent = d.lastChecked.replace('T', ' ').slice(0, 19) + ' UTC';

  // Countdown timer
  var secs = 60;
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(function() {
    secs--;
    var el = document.getElementById('countdown');
    if (el) el.textContent = secs > 0 ? 'next check in ' + secs + 's' : 'checking…';
    if (secs <= 0) clearInterval(countdownInterval);
  }, 1000);
}

async function load() {
  try {
    var r = await fetch('/api/status?t=' + Date.now());
    var d = await r.json();
    render(d);
  } catch(e) {
    document.getElementById('overall').innerHTML = '<div class="icon" style="color:var(--red)">✕</div><h1>Cannot reach status API</h1><div class="sub">Check your connection and try again.</div>';
    document.getElementById('footer').textContent = 'Connection failed';
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
