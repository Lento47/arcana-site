// Arcana Workspace — Proxy Config page
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws)return;
var e=function(id){return document.getElementById(id)};
var skelEl=e('p-skeleton'),contentEl=e('p-content');
var balanceEl=e('p-balance'),balanceBar=e('p-balance-bar');
var usedEl=e('p-used'),limitEl=e('p-limit'),remEl=e('p-remaining'),usageBar=e('p-usage-bar');
var tierEl=e('p-tier');

var DAILY_LIMITS={free:50,trial:200,pro:2000,team:5000,enterprise:Infinity};

function showContent(vis){
  if(skelEl)skelEl.style.display=vis?'none':'';
  if(contentEl)contentEl.style.display=vis?'':'none';
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

    // Daily usage
    var used=ud?ud.requests||ud.count||0:0;
    var tier=hd?hd.tier||'free':'free';
    var limit=DAILY_LIMITS[tier]||50;
    var remaining=limit===Infinity?'∞':Math.max(0,limit-used);

    if(usedEl)usedEl.textContent=used.toLocaleString();
    if(limitEl)limitEl.textContent=limit===Infinity?'Unlimited':limit.toLocaleString();
    if(remEl)remEl.textContent=remaining;
    if(usageBar){
      var pct=limit===Infinity?0:Math.min(100,Math.round(used/limit*100));
      usageBar.style.width=pct+'%';
      usageBar.style.background=pct>95?'var(--color-error)':pct>80?'var(--color-warning)':'var(--color-primary)';
    }

    // Tier
    if(tierEl)tierEl.textContent=tier.charAt(0).toUpperCase()+tier.slice(1);

    showContent(true);
  })['catch'](function(){showContent(true)});
}

window.addEventListener('arcana:workspace-ready',function(ev){init(ev.detail)});
if(ws.session)init(ws.session);
})();
