const PROXY = "https://arcana-proxy.lejzerv.workers.dev"

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#08070B;--line:#282638;--text:#F4F0FF;--muted:#A19AAD;--soft:#736C80;--accent:#B38CFF;--green:#8CFFBF;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
html,body{background:var(--bg);color:var(--text);min-height:100vh}
body{font-family:var(--sans);-webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% -10%,rgba(179,140,255,.22),transparent 30rem),linear-gradient(180deg,#09070D,#08070B 42%,#060507)}
.card{width:min(440px,calc(100% - 32px));background:rgba(17,16,24,.92);border:1px solid var(--line);border-radius:12px;padding:32px;text-align:center}
.logo{font-size:1rem;font-weight:600;letter-spacing:1px;margin-bottom:1.4rem}
.logo span{color:var(--accent)}
.icon{font-size:2.4rem;line-height:1;margin-bottom:.6rem}
h1{font-size:1.3rem;letter-spacing:-.02em;margin-bottom:.5rem}
.detail{color:var(--muted);font-size:.9rem;line-height:1.55;margin-bottom:.4rem}
.big{font-family:var(--mono);font-size:2rem;font-weight:800;letter-spacing:-.04em;margin:.4rem 0;color:var(--green)}
.muted{color:var(--soft);font-family:var(--mono);font-size:.78rem;margin-top:.3rem}
.btn{display:inline-block;margin-top:1.6rem;background:var(--accent);color:var(--bg);font:700 13px/1 var(--sans);padding:12px 22px;border-radius:8px;text-decoration:none}
.btn.ghost{background:transparent;color:var(--muted);border:1px solid var(--line);margin-left:8px}
.err .icon{color:#FF9B9B}`

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCANA — Credits</title><style>${CSS}</style></head>
<body>
<div class="card" id="card">
  <div class="logo"><span>⛧</span> ARCANA</div>
  <div class="icon" id="icon">◌</div>
  <h1 id="title">Confirming payment…</h1>
  <div class="detail" id="detail">Crediting your account, one moment.</div>
  <div id="extra"></div>
</div>
<script>
var PROXY = ${JSON.stringify(PROXY)};
var card = document.getElementById('card');
var icon = document.getElementById('icon');
var title = document.getElementById('title');
var detail = document.getElementById('detail');
var extra = document.getElementById('extra');

function token(){
  var p = new URLSearchParams(location.search);
  return p.get('token') || p.get('orderId');
}
function captureTokenParam(){
  var p = new URLSearchParams(location.search);
  return p.get('capture_token') || '';
}
function fail(text){
  card.className = 'card err';
  icon.textContent = '✕';
  title.textContent = 'Payment not completed';
  detail.textContent = text;
  extra.textContent = '';
  var a1 = document.createElement('a');
  a1.className = 'btn';
  a1.href = '/credits';
  a1.textContent = 'Try again';
  var a2 = document.createElement('a');
  a2.className = 'btn ghost';
  a2.href = '/';
  a2.textContent = 'Home';
  extra.appendChild(a1);
  extra.appendChild(a2);
}
function done(d){
  icon.textContent = '✓';
  title.textContent = d.alreadyCaptured ? 'Already credited' : 'Credits added';
  detail.textContent = 'Your Arcana proxy balance is topped up.';
  var added = '$' + ((d.creditsAdded || 0) / 100).toFixed(2);
  var bal = '$' + ((d.newBalance || 0) / 100).toFixed(2);
  extra.textContent = '';
  var big = document.createElement('div');
  big.className = 'big';
  big.textContent = '+' + added;
  var m = document.createElement('div');
  m.className = 'muted';
  m.textContent = 'New balance: ' + bal;
  var a1 = document.createElement('a');
  a1.className = 'btn';
  a1.href = '/';
  a1.textContent = 'Done';
  var a2 = document.createElement('a');
  a2.className = 'btn ghost';
  a2.href = '/credits';
  a2.textContent = 'Buy more';
  extra.appendChild(big);
  extra.appendChild(m);
  extra.appendChild(a1);
  extra.appendChild(a2);
}

(async function(){
  var t = token();
  var ct = captureTokenParam();
  if(!t){ return fail('Missing order reference. If you were charged, contact support.'); }
  try{
    var url = PROXY + '/v1/pay/capture-return?token=' + encodeURIComponent(t);
    if (ct) url += '&capture_token=' + encodeURIComponent(ct);
    var r = await fetch(url);
    var d = await r.json();
    if(d.success){ done(d); } else { fail(d.message || d.error || 'Capture failed.'); }
  }catch(e){ fail('Network error: ' + e.message); }
})();
</script>
</body></html>`

export async function onRequest(): Promise<Response> {
  return new Response(PAGE, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://arcana-proxy.lejzerv.workers.dev; frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  })
}
