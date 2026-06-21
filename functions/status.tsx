const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{background:#0B0D12;color:#E7ECF3;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
.container{max-width:640px;margin:0 auto;padding:2rem 1.5rem}
header{display:flex;align-items:center;justify-content:space-between;padding:1rem 0;border-bottom:1px solid #1D2430}
.logo{font-size:1rem;font-weight:600;letter-spacing:1px}
.logo span{color:#8B5CF6}
.logo small{font-size:.7rem;color:#8A94A6;margin-left:8px;font-family:ui-monospace,SFMono-Regular,monospace}
.section-title{font-size:.75rem;font-family:ui-monospace,SFMono-Regular,monospace;color:#8A94A6;text-transform:uppercase;letter-spacing:1.5px;margin:1.5rem 0 1rem;border-bottom:1px solid #1D2430;padding-bottom:.5rem}
.service{background:#11151C;border:1px solid #1D2430;padding:12px 16px 10px;margin-bottom:1px}
.service:first-child{border-radius:4px 4px 0 0}
.service:last-child{border-radius:0 0 4px 4px}
.svc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.svc-left{display:flex;align-items:center;gap:10px}
.dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.dot.up{background:#10B981;box-shadow:0 0 6px rgba(16,185,129,.4)}
.dot.down{background:#EF4444;box-shadow:0 0 6px rgba(239,68,68,.4)}
.svc-name{font-size:.85rem;color:#E7ECF3}
.svc-latency{font-size:.75rem;color:#8A94A6;font-family:ui-monospace,SFMono-Regular,monospace}
.bar-row{display:flex;align-items:center;gap:3px}
.bar{flex:1 1 0;min-width:0;height:16px;border-radius:2px;cursor:pointer;position:relative;transition:opacity .15s}
.bar:hover{opacity:.7}
.bar.up{background:#10B981}
.bar.down{background:#EF4444}
.bar.nodata{background:#222834;cursor:default}
.bar.tooltip:hover .tip{display:block}
.tip{display:none;position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:#1D2430;color:#E7ECF3;padding:3px 7px;border-radius:3px;font-size:.6rem;white-space:nowrap;pointer-events:none;z-index:10;border:1px solid #282638}
.svc-meta{font-size:.65rem;font-family:ui-monospace,SFMono-Regular,monospace;color:#5B6380;margin-left:6px;white-space:nowrap;flex-shrink:0}
.svc-meta .pct{color:#8A94A6}
.svc-meta .downtime{color:#EF4444;margin-left:4px}
.summary{padding:12px 16px;background:#11151C;border:1px solid #1D2430;border-radius:4px;margin-top:1rem;text-align:center}
.summary .badge{display:inline-block;padding:4px 12px;border-radius:3px;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.5px;font-family:ui-monospace,SFMono-Regular,monospace}
.badge.ok{background:rgba(16,185,129,.15);color:#10B981;border:1px solid rgba(16,185,129,.3)}
.badge.issues{background:rgba(239,68,68,.15);color:#EF4444;border:1px solid rgba(239,68,68,.3)}
.summary .ago{font-size:.75rem;color:#8A94A6;margin-top:6px}
.timestamp{font-size:.7rem;color:#5B6380;text-align:center;margin-top:1rem;font-family:ui-monospace,SFMono-Regular,monospace}
footer{border-top:1px solid #1D2430;padding:1.5rem 0;margin-top:2rem;text-align:center}
footer div{font-size:.75rem;color:#5B6380}`

const MAX_HISTORY = 48

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ARCANA — System Status</title><style>${CSS}</style></head>
<body>
<div class="container">
  <header>
    <div class="logo"><span>⛧</span> ARCANA <small>&lt;decrypt the arcane /&gt;</small></div>
  </header>
  <div class="section-title">// system status</div>
  <div id="services"></div>
  <div class="timestamp" id="footer">Loading...</div>
  <footer><div>ARCANA Runtime Infrastructure</div></footer>
</div>
<script>
const STORAGE_KEY = 'arcana_status_history';
const MAX = ${MAX_HISTORY};
let history = [];

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) history = JSON.parse(raw);
} catch(e) {}

function bar(status, time) {
  var el = document.createElement('div');
  el.className = 'bar ' + status;
  el.title = time + ' UTC ' + status;
  var tip = document.createElement('div');
  tip.className = 'tip';
  tip.textContent = time + ' UTC ' + status;
  el.appendChild(tip);
  return el;
}

function render(d) {
  var now = new Date();
  var entry = { time: now.getUTCHours().toString().padStart(2,'0') + ':' + now.getUTCMinutes().toString().padStart(2,'0'), statuses: d.services.map(function(s){return s.status}) };
  history.push(entry);
  if (history.length > MAX) history.splice(0, history.length - MAX);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch(e) {}

  var servicesEl = document.getElementById('services');
  servicesEl.textContent = '';

  for (var i = 0; i < d.services.length; i++) {
    var svc = d.services[i];
    var uptime = 0, lastDown = '';
    for (var j = 0; j < history.length; j++) {
      if (history[j].statuses[i] === 'up') uptime++;
      else if (history[j].statuses[i] === 'down') lastDown = history[j].time;
    }
    var pct = history.length > 0 ? Math.round(uptime / history.length * 100) : 100;

    var service = document.createElement('div');
    service.className = 'service';

    var svcTop = document.createElement('div');
    svcTop.className = 'svc-top';
    var svcLeft = document.createElement('div');
    svcLeft.className = 'svc-left';
    var dot = document.createElement('span');
    dot.className = 'dot ' + svc.status;
    svcLeft.appendChild(dot);
    var nameEl = document.createElement('span');
    nameEl.className = 'svc-name';
    nameEl.textContent = svc.name;
    svcLeft.appendChild(nameEl);
    svcTop.appendChild(svcLeft);
    var latencyEl = document.createElement('span');
    latencyEl.className = 'svc-latency';
    latencyEl.textContent = svc.latency + 'ms';
    svcTop.appendChild(latencyEl);
    service.appendChild(svcTop);

    var barRow = document.createElement('div');
    barRow.className = 'bar-row';
    for (var p = history.length; p < MAX; p++) {
      var nodata = document.createElement('div');
      nodata.className = 'bar nodata';
      barRow.appendChild(nodata);
    }
    for (var j = 0; j < history.length; j++) {
      barRow.appendChild(bar(history[j].statuses[i], history[j].time));
    }
    var meta = document.createElement('span');
    meta.className = 'svc-meta';
    var pctSpan = document.createElement('span');
    pctSpan.className = 'pct';
    pctSpan.textContent = pct + '%';
    meta.appendChild(pctSpan);
    if (lastDown) {
      var downtimeSpan = document.createElement('span');
      downtimeSpan.className = 'downtime';
      downtimeSpan.textContent = '↑' + lastDown;
      meta.appendChild(downtimeSpan);
    }
    barRow.appendChild(meta);
    service.appendChild(barRow);
    servicesEl.appendChild(service);
  }

  var ago = Math.max(0, Math.floor((Date.now() - new Date(d.lastChecked).getTime()) / 1000));
  var summary = d.summary === 'operational' ? 'All systems operational' : 'Issues detected';
  var badge = d.summary === 'operational' ? 'ok' : 'issues';

  var summaryEl = document.createElement('div');
  summaryEl.className = 'summary';
  var badgeEl = document.createElement('div');
  badgeEl.className = 'badge ' + badge;
  badgeEl.textContent = summary;
  summaryEl.appendChild(badgeEl);
  var agoEl = document.createElement('div');
  agoEl.className = 'ago';
  agoEl.textContent = 'Last checked: ' + ago + 's ago';
  summaryEl.appendChild(agoEl);
  servicesEl.appendChild(summaryEl);

  document.getElementById('footer').textContent = d.lastChecked.replace('T', ' ').slice(0, 19) + ' UTC';
}

async function load() {
  try {
    var r = await fetch('/api/status?t=' + Date.now());
    var d = await r.json();
    render(d);
  } catch(e) {
    var servicesEl = document.getElementById('services');
    servicesEl.textContent = '';
    var errService = document.createElement('div');
    errService.className = 'service';
    var errName = document.createElement('span');
    errName.className = 'svc-name';
    errName.textContent = 'Failed to fetch status';
    errService.appendChild(errName);
    servicesEl.appendChild(errService);
    document.getElementById('footer').textContent = 'Unable to connect';
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
