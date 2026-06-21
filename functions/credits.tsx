const PROXY = "https://proxy.arcana.otnelhq.com"

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#08070B;--surface:#111018;--surface2:#171520;--line:#282638;--text:#F4F0FF;--muted:#A19AAD;--soft:#736C80;--accent:#B38CFF;--green:#8CFFBF;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
html,body{background:var(--bg);color:var(--text);min-height:100vh}
body{font-family:var(--sans);-webkit-font-smoothing:antialiased;background:radial-gradient(circle at 50% -18%,rgba(179,140,255,.22),transparent 32rem),linear-gradient(180deg,#09070D,#08070B 42%,#060507)}
.wrap{width:min(480px,calc(100% - 32px));margin:0 auto;padding:3rem 0}
.logo{font-size:1rem;font-weight:600;letter-spacing:1px;margin-bottom:.4rem}
.logo span{color:var(--accent)}
.kicker{font-family:var(--mono);font-size:.7rem;color:var(--soft);text-transform:uppercase;letter-spacing:1.5px}
h1{font-size:1.5rem;letter-spacing:-.02em;margin:.6rem 0 .3rem}
.sub{color:var(--muted);font-size:.9rem;line-height:1.5;margin-bottom:1.8rem}
.card{background:rgba(17,16,24,.9);border:1px solid var(--line);border-radius:10px;padding:22px}
label{display:block;font-size:.72rem;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--soft);margin:0 0 8px}
input[type=text],input[type=email]{width:100%;background:var(--bg);border:1px solid var(--line);border-radius:7px;color:var(--text);font-family:var(--mono);font-size:.85rem;padding:11px 13px;outline:none;transition:border-color .15s}
input[type=text]:focus,input[type=email]:focus{border-color:var(--accent)}
.amts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0 4px}
.amt{appearance:none;cursor:pointer;background:var(--surface2);border:1px solid var(--line);color:var(--muted);font:700 15px/1 var(--mono);padding:12px 0;border-radius:7px;transition:.15s}
.amt:hover{color:var(--text);border-color:var(--soft)}
.amt.active{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.row{margin-bottom:18px}
.hint{font-size:.7rem;color:var(--soft);margin-top:7px;line-height:1.5}
.btn{display:block;width:100%;text-align:center;cursor:pointer;background:var(--accent);color:var(--bg);border:0;font:700 14px/1 var(--sans);padding:14px;border-radius:8px;margin-top:4px;transition:.15s}
.btn:hover{filter:brightness(1.08)}
.btn:disabled{opacity:.5;cursor:default}
.msg{font-size:.8rem;margin-top:14px;padding:11px 13px;border-radius:7px;line-height:1.5;display:none}
.msg.err{display:block;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#FF9B9B}
.msg.ok{display:block;background:rgba(140,255,191,.1);border:1px solid rgba(140,255,191,.3);color:var(--green)}
.balance{font-family:var(--mono);font-size:.78rem;color:var(--muted);margin-top:14px;text-align:center}
.balance a{color:var(--accent);cursor:pointer;text-decoration:none}
.foot{text-align:center;color:var(--soft);font-size:.72rem;margin-top:1.6rem}
.foot a{color:var(--muted)}`

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCANA — Buy Credits</title><style>${CSS}</style></head>
<body>
<div class="wrap">
  <div class="logo"><span>⛧</span> ARCANA</div>
  <div class="kicker">// pay-as-you-go</div>
  <h1>Buy proxy credits</h1>
  <p class="sub">Top up your Arcana proxy balance. $1 = 100 credits. Spent only when you route models through the Arcana proxy — your own provider keys stay free.</p>
  <div class="card">
    <div class="row">
      <label for="email">Email address</label>
      <input type="email" id="email" placeholder="you@example.com" autocomplete="email" spellcheck="false">
      <div class="hint">The email tied to your Arcana subscription. Credits land on this account.</div>
    </div>
    <div class="row">
      <label for="key">Or Arcana license key (optional)</label>
      <input type="text" id="key" placeholder="ARCANA-PRO-..." autocomplete="off" spellcheck="false">
      <div class="hint">If you don't have a subscription email on file. The key from <code>arcana license activate</code>.</div>
    </div>
    <div class="row">
      <label>Amount (USD · min $5)</label>
      <div class="amts" id="amts">
        <button class="amt" data-amt="5">$5</button>
        <button class="amt active" data-amt="10">$10</button>
        <button class="amt" data-amt="25">$25</button>
        <button class="amt" data-amt="50">$50</button>
      </div>
      <input type="text" id="custom" placeholder="Custom amount" inputmode="decimal" style="margin-top:8px">
    </div>
    <button class="btn" id="pay">Continue to PayPal →</button>
    <div class="msg" id="msg"></div>
    <div class="balance"><a id="check">Check current balance</a> <span id="bal"></span></div>
  </div>
  <div class="foot"><a href="/">← Back to arcana.otnelhq.com</a></div>
</div>
<script>
var PROXY = ${JSON.stringify(PROXY)};
var amount = 10;
var amts = document.getElementById('amts');
var custom = document.getElementById('custom');
var emailEl = document.getElementById('email');
var keyEl = document.getElementById('key');
var msg = document.getElementById('msg');
var payBtn = document.getElementById('pay');

amts.addEventListener('click', function(e){
  var b = e.target.closest('.amt'); if(!b) return;
  custom.value = '';
  document.querySelectorAll('.amt').forEach(function(x){x.classList.remove('active')});
  b.classList.add('active');
  amount = Number(b.dataset.amt);
});
custom.addEventListener('input', function(){
  document.querySelectorAll('.amt').forEach(function(x){x.classList.remove('active')});
  amount = Number(custom.value);
});

function show(text, ok){ msg.className = 'msg ' + (ok ? 'ok' : 'err'); msg.textContent = text; }

payBtn.addEventListener('click', async function(){
  var email = emailEl.value.trim().toLowerCase();
  var key = keyEl.value.trim();
  if(!email && !key){ return show('Enter your email address or license key.', false); }
  if(!amount || amount < 5){ return show('Minimum is $5.', false); }
  payBtn.disabled = true; payBtn.textContent = 'Creating order...';
  try{
    var body = { amount: amount };
    if (email) body.email = email;
    else body.userId = key; // proxy resolves license keys via getUser(Authorization: Bearer <key>)
    var r = await fetch(PROXY + '/v1/pay/create-order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    var d = await r.json();
    if(d.approvalUrl){ window.location.href = d.approvalUrl; return; }
    show(d.message || d.error || 'Could not create order.', false);
  }catch(e){ show('Network error: ' + e.message, false); }
  payBtn.disabled = false; payBtn.textContent = 'Continue to PayPal →';
});

document.getElementById('check').addEventListener('click', async function(){
  var key = keyEl.value.trim();
  if(!key){ return show('Enter your Arcana license key to check balance.', false); }
  var bal = document.getElementById('bal');
  bal.textContent = '· checking...';
  try{
    var r = await fetch(PROXY + '/v1/balance', { headers:{ 'Authorization':'Bearer ' + key } });
    var d = await r.json();
    if (!r.ok) { bal.textContent = '· ' + (d.error || 'HTTP ' + r.status); }
    else if(d.dollars !== undefined){ bal.textContent = '· $' + d.dollars; }
    else { bal.textContent = '· ' + (d.error || 'unavailable'); }
  }catch(e){ bal.textContent = '· ' + (e.message || 'network error'); }
});
</script>
</body></html>`

export async function onRequest(): Promise<Response> {
  return new Response(PAGE, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://proxy.arcana.otnelhq.com; frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  })
}
