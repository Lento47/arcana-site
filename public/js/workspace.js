// Arcana Workspace
(function(){'use strict';
var P='https://proxy.arcana.otnelhq.com',sb=window.__ARCANA_SB__;
if(!sb){location.replace('/auth');return}
var e=function(id){return document.getElementById(id)};
var emailEl=e('ws-email'),avatarEl=e('ws-avatar'),balanceEl=e('ws-balance'),balanceSubEl=e('ws-balance-sub'),balanceBar=e('ws-balance-bar'),creditsEl=e('ws-credits'),creditsBar=e('ws-credits-bar'),usageEl=e('ws-usage'),usageSubEl=e('ws-usage-sub'),usageBar=e('ws-usage-bar'),statsEl=e('ws-stats'),skelEl=e('ws-skeleton');
function show(s){if(skelEl)skelEl.style.display=s?'none':'';if(statsEl)statsEl.style.display=s?'':'none'}
async function pf(path,token){var r=await fetch(P+path,{headers:{Authorization:'Bearer '+token}});if(r.status===401){var ref=await sb.auth.refreshSession();if(ref.data.session){r=await fetch(P+path,{headers:{Authorization:'Bearer '+ref.data.session.access_token}});if(r.ok)return r.json()}await sb.auth.signOut();location.replace('/auth');return null}if(!r.ok)throw Error('Proxy '+r.status);return r.json()}
async function init(s){
  if(emailEl)emailEl.textContent=s.user.email||'';if(avatarEl)avatarEl.textContent=(s.user.email||'?')[0].toUpperCase();
  try{var results=await Promise.allSettled([pf('/v1/balance',s.access_token),pf('/v1/usage',s.access_token)]);var bd=results[0].status==='fulfilled'?results[0].value:null;var ud=results[1].status==='fulfilled'?results[1].value:null;
  var d=bd?bd.dollars||'0.00':'—',c=bd?bd.credits||0:0;
  if(balanceEl)balanceEl.textContent=bd?'$'+d:'—';if(balanceSubEl)balanceSubEl.textContent=bd?Math.round(c).toLocaleString()+' credits':'unavailable';if(balanceBar)balanceBar.style.width=bd?Math.min(100,(parseFloat(d)/50)*100)+'%':'0%';
  if(creditsEl)creditsEl.textContent=bd?c.toLocaleString():'—';if(creditsBar)creditsBar.style.width=bd?Math.min(100,(c/5000)*100)+'%':'0%';
  var u=ud?ud.requests||ud.count||0:0;if(usageEl)usageEl.textContent=ud?u.toLocaleString():'—';if(usageSubEl)usageSubEl.textContent=ud?'of 50 today':'unavailable';if(usageBar){var pct=Math.min(100,Math.round(u/50*100));usageBar.style.width=(ud?pct:0)+'%';usageBar.style.background=pct>95?'var(--red)':pct>80?'var(--amber)':'var(--brand)'}
  }catch(e){}
  show(true)
}
e('btn-signout').addEventListener('click',async function(){await sb.auth.signOut();location.replace('/')});
var sidebar=e('sidebar'),overlay=e('sidebar-overlay');function close(){sidebar.classList.remove('open')}
e('mobile-menu-btn').addEventListener('click',function(){sidebar.classList.toggle('open')});if(overlay)overlay.addEventListener('click',close);document.addEventListener('keydown',function(ev){if(ev.key==='Escape')close()});
window.addEventListener('arcana:signed-out',function(){location.replace('/')});
sb.auth.getSession().then(function(r){if(!r.data.session){location.replace('/auth');return}init(r.data.session)});
sb.auth.onAuthStateChange(function(ev,s){if(ev==='SIGNED_OUT')location.replace('/');if(ev==='TOKEN_REFRESHED'&&s)init(s)});
})();
