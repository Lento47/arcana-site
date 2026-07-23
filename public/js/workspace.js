// Arcana Workspace — shared auth shell
(function(){'use strict';
var P='https://proxy-arcana.otnelhq.com',sb=window.__ARCANA_SB__;
if(!sb){location.replace('/auth');return}
var e=function(id){return document.getElementById(id)};

// Sidebar elements
var emailEl=e('ws-email'),avatarEl=e('ws-avatar'),sidEl=e('ws-session-id'),sideTierEl=e('ws-side-tier');
var sideUsageEl=e('ws-side-usage'),sideUsageFillEl=e('ws-side-usage-fill');

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
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function timeAgo(iso){if(!iso)return'';var d=new Date(iso);var sec=Math.floor((Date.now()-d)/1000);if(sec<60)return'just now';if(sec<3600)return Math.floor(sec/60)+'m ago';if(sec<86400)return Math.floor(sec/3600)+'h ago';return Math.floor(sec/86400)+'d ago'}
window.__ARCANA_WORKSPACE__={pf:pf,proxyFetch:proxyFetch,sb:sb,user:null,session:null,initSidebar:initSidebar,esc:esc,timeAgo:timeAgo};

// --- Logo Probe: auto-detect logo color and apply correct filter ---
function initLogoProbe(){
  var logo=document.querySelector('.side-head img');
  if(!logo)return;
  var STORAGE_KEY='arcana-logo-color:'+logo.getAttribute('src');
  function applyLogoFilter(isDark){
    document.documentElement.classList.toggle('logo-is-dark',isDark);
    var s=document.createElement('style');
    var darkCSS=isDark?'.logo-is-dark .side-head img{filter:invert(1)}.logo-is-dark .side-head img:hover{filter:invert(1) drop-shadow(0 0 6px rgba(179,140,255,.5))}':'';
    var lightCSS=isDark?'':'[data-theme=light] .side-head img{filter:invert(1)}[data-theme=light] .side-head img:hover{filter:invert(1) drop-shadow(0 0 6px rgba(139,79,212,.4))}';
    s.textContent=darkCSS+lightCSS;
    document.head.appendChild(s);
  }
  var cached=localStorage.getItem(STORAGE_KEY);
  if(cached==='dark'||cached==='light'){applyLogoFilter(cached==='dark');return}
  function probe(){
    if(!logo.complete||logo.naturalWidth===0)return;
    try{
      var canvas=document.createElement('canvas');
      var ctx=canvas.getContext('2d');
      canvas.width=logo.naturalWidth;
      canvas.height=logo.naturalHeight;
      ctx.drawImage(logo,0,0);
      var w=canvas.width,h=canvas.height;
      var step=Math.max(1,Math.floor(Math.min(w,h)/8));
      var data=ctx.getImageData(0,0,w,h).data;
      var totalBrightness=0,opaquePixels=0;
      for(var y=0;y<h;y+=step){
        for(var x=0;x<w;x+=step){
          var i=(y*w+x)*4;
          if(data[i+3]>128){totalBrightness+=(data[i]+data[i+1]+data[i+2])/3;opaquePixels++}
        }
      }
      if(opaquePixels===0)return;
      var avgBrightness=totalBrightness/opaquePixels;
      var isDark=avgBrightness<128;
      try{localStorage.setItem(STORAGE_KEY,isDark?'dark':'light')}catch(e){}
      applyLogoFilter(isDark);
    }catch(e){/* cross-origin or canvas failure — leave default */}
  }
  if(logo.complete)probe();
  else logo.addEventListener('load',probe);
}

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

// Fetch account tier + usage from proxy, show badge with daily-limit tooltip
function loadSidebarTier(){
  if(!sideTierEl)return;
  var s=window.__ARCANA_WORKSPACE__.session;
  if(!s)return;

  // Fetch health first — badge shows on its own
  pf('/v1/health',s.access_token).then(function(hd){
    var tier=hd&&hd.tier?hd.tier.charAt(0).toUpperCase()+hd.tier.slice(1):'';
    if(!tier)return;
    sideTierEl.textContent=tier;
    sideTierEl.title=tier;
    sideTierEl.classList.remove('is-hidden');

    // Enrich tooltip with usage data (fire-and-forget)
    pf('/v1/usage',s.access_token).then(function(ud){
      if(!ud)return;
      var used=ud.requests||ud.count||0;
      var limit=ud.limit;
      var tip=tier;
      // Update sidebar usage bar (only when a numeric limit exists)
      if(sideUsageEl&&sideUsageFillEl){
        var hasLimit=typeof limit==='number'&&Number.isFinite(limit)&&limit>0;
        if(hasLimit){
          var pct=Math.min(100,Math.round(used/limit*100));
          sideUsageFillEl.style.width=pct+'%';
          sideUsageFillEl.style.background=pct>95?'var(--color-error)':pct>80?'var(--color-warning)':'var(--color-primary)';
          sideUsageEl.classList.remove('is-hidden');
        }else{
          sideUsageEl.classList.add('is-hidden');
        }
      }

      if(typeof limit==='number'&&Number.isFinite(limit)){
        var rem=Math.max(0,limit-used);
        tip+=' \u00B7 '+used.toLocaleString()+'/'+limit.toLocaleString()+' today \u00B7 '+rem.toLocaleString()+' remaining';
      }else if(hd&&hd.tier==='enterprise'){
        tip+=' \u00B7 Unlimited';
      }else{
        tip+=' \u00B7 Daily limit unavailable';
      }
      sideTierEl.title=tip;
    })['catch'](function(){});
  })['catch'](function(){});
}

// Init
initLogoProbe();
sb.auth.getSession().then(function(r){
  if(!r.data.session){location.replace('/auth');return}
  var s=r.data.session;
  window.__ARCANA_WORKSPACE__.session=s;
  window.__ARCANA_WORKSPACE__.user=s.user;
  initSidebar(s);
  loadSidebarTier();
  window.dispatchEvent(new CustomEvent('arcana:workspace-ready',{detail:s}));
});
sb.auth.onAuthStateChange(function(ev,s){
  if(ev==='SIGNED_OUT')location.replace('/');
  if(ev==='TOKEN_REFRESHED'&&s){
    window.__ARCANA_WORKSPACE__.session=s;
    window.__ARCANA_WORKSPACE__.user=s.user;
    initSidebar(s);
    loadSidebarTier();
    window.dispatchEvent(new CustomEvent('arcana:workspace-ready',{detail:s}));
  }
});
})();
