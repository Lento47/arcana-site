// Arcana Workspace — Dashboard page
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws){return}
var e=function(id){return document.getElementById(id)};
var balanceEl=e('ws-balance'),balanceSubEl=e('ws-balance-sub'),balanceBar=e('ws-balance-bar');
var creditsEl=e('ws-credits'),creditsBar=e('ws-credits-bar');
var usageEl=e('ws-usage'),usageSubEl=e('ws-usage-sub'),usageBar=e('ws-usage-bar');
var statsEl=e('ws-stats'),skelEl=e('ws-skeleton');
var sparklineEl=e('ws-sparkline'),modelUsageEl=e('ws-model-usage'),recentEl=e('ws-recent-sessions');

function showContent(vis){
  if(skelEl)skelEl.classList.toggle('is-hidden',vis);
  if(statsEl)statsEl.classList.toggle('is-hidden',!vis);
}

function renderSparkline(sessions){
  if(!sparklineEl||!sessions||sessions.length<2)return;
  var dayMap={};
  sessions.forEach(function(s){var d=s.createdAt.slice(0,10);dayMap[d]=(dayMap[d]||0)+s.costCredits});
  var days=Object.keys(dayMap).sort().slice(-7);
  var vals=days.map(function(d){return dayMap[d]});
  var max=Math.max.apply(null,vals)||1;
  var w=200,h=40,px=w/(vals.length-1||1);
  var pts=vals.map(function(v,i){return[Math.round(i*px),Math.round(h-(v/max)*h)]});
  var d='M'+pts.map(function(p,i){return(i===0?'L':'L')+p[0]+','+p[1]}).join('').replace(/^L/,'M');
  var area='M0,'+h+d+'L'+pts[pts.length-1][0]+','+h+'Z';
  sparklineEl.innerHTML='<path d="'+d+'" class="line"/><path d="'+area+'" class="area"/>';
}

function renderModelBreakdown(sessions){
  if(!modelUsageEl||!sessions||sessions.length===0){if(modelUsageEl)modelUsageEl.innerHTML='<div class="empty-state empty-state-padded">No sessions yet.</div>';return}
  var counts={};
  sessions.forEach(function(s){var m=s.model||'unknown';counts[m]=(counts[m]||0)+1});
  var total=Object.values(counts).reduce(function(a,b){return a+b},0);
  var sorted=Object.entries(counts).sort(function(a,b){return b[1]-a[1]}).slice(0,5);
  var html=sorted.map(function(m){var pct=Math.round(m[1]/total*100);return '<div class="usage-bar-row"><span class="usage-bar-label">'+esc(m[0])+'</span><div class="usage-bar-track"><div class="usage-bar-fill" style="width:'+pct+'%"></div></div><span class="usage-bar-pct">'+pct+'%</span></div>'}).join('');
  modelUsageEl.innerHTML=html;
}

function renderRecent(sessions){
  if(!recentEl)return;
  if(!sessions||sessions.length===0){
    recentEl.innerHTML='<div class="empty-state">No sessions for this web account yet. Open <a href="/workspace/sessions" style="color:var(--color-primary)">Sessions</a> for details.</div>';
    return
  }
  var list=sessions.slice(0,5);
  var html=list.map(function(s){
    var tokens=((s.tokensIn||0)+(s.tokensOut||0)).toLocaleString();
    var dollars=s.costCredits!=null?(Number(s.costCredits)/100).toFixed(2):'0.00';
    var label=s.firstMessage?esc(String(s.firstMessage).slice(0,80)):esc(s.model||'');
    return '<div class="session-row" onclick="location.href=\'/workspace/sessions\'" style="cursor:pointer;margin-bottom:2px"><div class="sr-main"><span class="sr-model">'+esc(s.model||'')+'</span>'+(s.firstMessage?'<span class="sr-preview">'+label+'</span>':'')+'</div><span class="sr-tokens">'+tokens+'</span><span class="sr-cost">$'+dollars+'</span><span class="sr-time">'+timeAgo(s.createdAt)+'</span><span class="sr-expand">→</span></div>';
  }).join('');
  recentEl.innerHTML='<div class="session-table">'+html+'</div>';
}

var esc=ws.esc,timeAgo=ws.timeAgo;

function init(s){
  showContent(false);
  // Fetch balance, usage, sessions
  Promise.allSettled([
    ws.pf('/v1/balance',s.access_token),
    ws.pf('/v1/usage',s.access_token),
    ws.pf('/v1/sessions?limit=50',s.access_token)
  ]).then(function(results){
    var bd=results[0].status==='fulfilled'?results[0].value:null;
    var ud=results[1].status==='fulfilled'?results[1].value:null;
    var sd=results[2].status==='fulfilled'?results[2].value:null;
    var sessions=sd&&sd.sessions?sd.sessions:null;

    // Balance card
    var d=bd?bd.dollars||'0.00':'—',c=bd?bd.credits||0:0;
    if(balanceEl)balanceEl.textContent=bd?'$'+d:'—';
    if(balanceSubEl)balanceSubEl.textContent=bd?Math.round(c).toLocaleString()+' credits':'unavailable';
    if(balanceBar)balanceBar.style.width=bd?Math.min(100,(parseFloat(d)/50)*100)+'%':'0%';
    if(creditsEl)creditsEl.textContent=bd?c.toLocaleString():'—';
    if(creditsBar)creditsBar.style.width=bd?Math.min(100,(c/5000)*100)+'%':'0%';

    // Usage card
    var u=ud?ud.requests||ud.count||0:0;
    if(usageEl)usageEl.textContent=ud?u.toLocaleString():'—';
    if(usageSubEl)usageSubEl.textContent=ud?'of '+(ud.limit||50)+' today':'unavailable';
    if(usageBar){var pct=Math.min(100,Math.round(u/50*100));usageBar.style.width=(ud?pct:0)+'%';usageBar.style.background=pct>95?'var(--color-error)':pct>80?'var(--color-warning)':'var(--color-primary)'}

    // Sparkline + model breakdown + recent sessions
    renderSparkline(sessions);
    renderModelBreakdown(sessions);
    renderRecent(sessions);

    showContent(true);
  })['catch'](function(){showContent(true)});
}

window.addEventListener('arcana:workspace-ready',function(ev){init(ev.detail)});
// Fallback if already ready
if(window.__ARCANA_WORKSPACE__&&window.__ARCANA_WORKSPACE__.session)init(window.__ARCANA_WORKSPACE__.session);
})();
