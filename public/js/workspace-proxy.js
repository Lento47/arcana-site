// Arcana Workspace — Proxy Config page
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws)return;
var e=function(id){return document.getElementById(id)};
var skelEl=e('p-skeleton'),contentEl=e('p-content'),emptyEl=e('p-empty');
var balanceEl=e('p-balance'),balanceBar=e('p-balance-bar');
var usedEl=e('p-used'),limitEl=e('p-limit'),remEl=e('p-remaining'),usageBar=e('p-usage-bar');
var tierEl=e('p-tier');

// Daily-limit display. The proxy is the source of truth for per-tier limits
// via /v1/usage. If the response includes a numeric `limit` field, use it.
// Otherwise, display "—" rather than a hardcoded client value.
// See docs/providers-free-usage-deploy.md "Known limits" for the proxy contract.
function getDailyLimit(usage, health) {
  if (usage && typeof usage.limit === "number" && Number.isFinite(usage.limit)) return usage.limit
  if (health && health.tier === "enterprise") return Infinity
  return null  // unknown — show "—", not a lie
}

function showContent(vis){
  if(skelEl)skelEl.classList.toggle('is-hidden',vis);
  if(contentEl)contentEl.classList.toggle('is-hidden',!vis);
  if(emptyEl)emptyEl.classList.add('is-hidden');
}
function showError(){
  if(skelEl)skelEl.classList.add('is-hidden');
  if(contentEl)contentEl.classList.add('is-hidden');
  if(emptyEl)emptyEl.classList.remove('is-hidden');
}

function init(s){
  showContent(false);

  Promise.allSettled([
    ws.pf('/v1/balance',s.access_token),
    ws.pf('/v1/usage',s.access_token),
    ws.pf('/v1/health',s.access_token)
  ]).then(function(results){
    var bd=results[0].status==='fulfilled'?results[0].value:null;
    var ud=results[1].status==='fulfilled'?results[1].value:null;
    var hd=results[2].status==='fulfilled'?results[2].value:null;

    // Balance
    var c=bd?bd.credits||0:0;
    if(balanceEl)balanceEl.textContent=bd?'$'+((c/100).toFixed(2)):'—';
    if(balanceBar)balanceBar.style.width=bd?Math.min(100,(c/5000)*100)+'%':'0%';

    // Daily usage — limit from server, not a hardcoded table.
    var used=ud?ud.requests||ud.count||0:0;
    var limit=getDailyLimit(ud, hd);
    var remaining=limit===Infinity?'∞':(limit===null?'—':Math.max(0,limit-used));

    if(usedEl)usedEl.textContent=used.toLocaleString();
    if(limitEl)limitEl.textContent=limit===Infinity?'Unlimited':(limit===null?'—':limit.toLocaleString());
    if(remEl)remEl.textContent=remaining;
    if(usageBar){
      var pct=limit===Infinity?0:(limit===null?0:Math.min(100,Math.round(used/limit*100)));
      usageBar.style.width=pct+'%';
      usageBar.style.background=pct>95?'var(--color-error)':pct>80?'var(--color-warning)':'var(--color-primary)';
    }

    // Tier
    if(tierEl)tierEl.textContent=(hd&&hd.tier)?hd.tier.charAt(0).toUpperCase()+hd.tier.slice(1):'—';

    showContent(true);
  })['catch'](function(){showError()});
}

var retryBtn=e('p-retry');
if(retryBtn)retryBtn.addEventListener('click',function(){
  if(ws.session)init(ws.session);
});
window.addEventListener('arcana:workspace-ready',function(ev){init(ev.detail)});
if(ws.session)init(ws.session);
})();
