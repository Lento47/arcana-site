// Arcana Workspace — shared auth shell
(function(){'use strict';
var P='https://proxy-arcana.otnelhq.com',sb=window.__ARCANA_SB__;
if(!sb){location.replace('/auth');return}
var e=function(id){return document.getElementById(id)};

// Sidebar elements
var emailEl=e('ws-email'),avatarEl=e('ws-avatar'),sidEl=e('ws-session-id');

function proxyErr(status,text){
  var msg='Proxy '+status;
  if(!text)return msg;
  try{
    var j=JSON.parse(text);
    var detail=j.message||j.error?.message||(typeof j.error==='string'?j.error:null);
    if(detail)msg+': '+String(detail).slice(0,180);
    else msg+=': '+text.slice(0,120);
  }catch(_){msg+=': '+String(text).slice(0,120)}
  return msg;
}

// Proxy fetch with auto-refresh on 401
async function pf(path,token){
  var r;
  try{
    r=await fetch(P+path,{headers:{Authorization:'Bearer '+token}});
  }catch(e){
    throw Error('Network error reaching proxy (CSP or offline). '+String(e&&e.message||e));
  }
  if(r.status===401){
    var ref=await sb.auth.refreshSession();
    if(ref.data.session){
      r=await fetch(P+path,{headers:{Authorization:'Bearer '+ref.data.session.access_token}});
      if(r.ok)return r.json();
    }
    await sb.auth.signOut();location.replace('/auth');return null;
  }
  if(!r.ok){
    var errText='';try{errText=await r.text()}catch(_){}
    throw Error(proxyErr(r.status,errText));
  }
  return r.json();
}

async function proxyFetch(path,opts){
  var t=opts?.token||null;
  if(!t){
    var s=(await sb.auth.getSession()).data.session;
    if(!s){location.replace('/auth');return null}
    t=s.access_token;
  }
  var method=opts?.method||'GET';
  var r;
  try{
    r=await fetch(P+path,{
      method:method,
      headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},
      body:opts?.body?JSON.stringify(opts.body):undefined
    });
  }catch(e){
    throw Error('Network error reaching proxy (CSP or offline). '+String(e&&e.message||e));
  }
  if(r.status===401){
    var ref=await sb.auth.refreshSession();
    if(ref.data.session){
      r=await fetch(P+path,{
        method:method,
        headers:{Authorization:'Bearer '+ref.data.session.access_token,'Content-Type':'application/json'},
        body:opts?.body?JSON.stringify(opts.body):undefined
      });
      if(r.ok)return r.json();
    }
    await sb.auth.signOut();location.replace('/auth');return null;
  }
  if(!r.ok){
    var errText='';try{errText=await r.text()}catch(_){}
    throw Error(proxyErr(r.status,errText));
  }
  // DELETE may return empty; still try json
  if(r.status===204)return{ok:true};
  var text=await r.text();
  if(!text)return{ok:true};
  try{return JSON.parse(text)}catch(_){return{ok:true,raw:text}}
}

function initSidebar(s){
  if(emailEl)emailEl.textContent=s.user.email||'';
  if(avatarEl)avatarEl.textContent=(s.user.email||'?')[0].toUpperCase();
  if(sidEl)sidEl.textContent='arc-'+s.user.id.slice(0,8);
}

// Expose shared utilities
window.__ARCANA_WORKSPACE__={pf:pf,proxyFetch:proxyFetch,sb:sb,user:null,session:null,initSidebar:initSidebar};

// Signout
e('btn-signout').addEventListener('click',async function(){await sb.auth.signOut();location.replace('/')});

// Mobile menu
var sidebar=e('sidebar'),overlay=e('sidebar-overlay');
function closeSidebar(){if(sidebar)sidebar.classList.remove('open')}
e('mobile-menu-btn').addEventListener('click',function(){if(sidebar)sidebar.classList.toggle('open')});
if(overlay)overlay.addEventListener('click',closeSidebar);
document.addEventListener('keydown',function(ev){if(ev.key==='Escape')closeSidebar()});

// Auth events
window.addEventListener('arcana:signed-out',function(){location.replace('/')});

// Init
sb.auth.getSession().then(function(r){
  if(!r.data.session){location.replace('/auth');return}
  var s=r.data.session;
  window.__ARCANA_WORKSPACE__.session=s;
  window.__ARCANA_WORKSPACE__.user=s.user;
  initSidebar(s);
  window.dispatchEvent(new CustomEvent('arcana:workspace-ready',{detail:s}));
});
sb.auth.onAuthStateChange(function(ev,s){
  if(ev==='SIGNED_OUT')location.replace('/');
  if(ev==='TOKEN_REFRESHED'&&s){
    window.__ARCANA_WORKSPACE__.session=s;
    window.__ARCANA_WORKSPACE__.user=s.user;
    initSidebar(s);
    window.dispatchEvent(new CustomEvent('arcana:workspace-ready',{detail:s}));
  }
});
})();
