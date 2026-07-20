// Arcana Workspace — Memory page (cloud facts via proxy /v1/memory)
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws)return;
var e=function(id){return document.getElementById(id)};
var listEl=e('m-list'),skelEl=e('m-skeleton'),emptyEl=e('m-empty'),countEl=e('m-count');
var searchEl=e('m-search'),msgEl=e('m-msg');
var keyEl=e('m-key'),valEl=e('m-value'),saveBtn=e('m-save'),refreshBtn=e('m-refresh');

var allFacts=[],filtered=[];

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function timeAgo(iso){if(!iso)return'';var d=new Date(iso);var sec=Math.floor((Date.now()-d)/1000);if(sec<60)return'just now';if(sec<3600)return Math.floor(sec/60)+'m ago';if(sec<86400)return Math.floor(sec/3600)+'h ago';return Math.floor(sec/86400)+'d ago'}
function confPct(c){return Math.round((Number(c)||0)*100)+'%'}

function showMsg(text,ok){
  if(!msgEl)return;
  msgEl.textContent=text||'';
  msgEl.className='msg '+(ok?'ok':'err');
  if(!text)msgEl.className='msg';
}

function applyFilters(){
  var q=(searchEl?searchEl.value:'').toLowerCase().trim();
  filtered=allFacts.filter(function(f){
    if(!q)return true;
    return (f.key||'').toLowerCase().indexOf(q)!==-1
      ||(f.value||'').toLowerCase().indexOf(q)!==-1
      ||(f.source||'').toLowerCase().indexOf(q)!==-1;
  });
  render();
}

function render(){
  if(countEl)countEl.textContent=filtered.length+(filtered.length===1?' fact':' facts')+(filtered.length!==allFacts.length?' (filtered)':'');
  if(!listEl)return;

  if(filtered.length===0){
    listEl.style.display='none';
    if(emptyEl){
      emptyEl.style.display='';
      emptyEl.innerHTML=allFacts.length===0
        ?'No memory facts for <b>this web account</b> yet.<br><br>'
          +'Cloud memory is keyed by your site login (Supabase user), not by an unrelated CLI license.<br><br>'
          +'1. Sign in here with the same email you use for device login<br>'
          +'2. <code>arcana console login</code> → same email<br>'
          +'3. <code>arcana memory compile</code> then <code>arcana memory push</code><br><br>'
          +'Or add a fact with the form below (stored under this web user).'
        :'No facts match your search.';
    }
    return;
  }
  if(emptyEl)emptyEl.style.display='none';
  listEl.style.display='';

  listEl.innerHTML=filtered.map(function(f,i){
    return '<article class="memory-card" data-key="'+esc(f.key)+'">'+
      '<div class="memory-card-head">'+
        '<code class="memory-key">'+esc(f.key)+'</code>'+
        '<div class="memory-meta">'+
          '<span class="memory-conf" title="confidence">'+confPct(f.confidence)+'</span>'+
          '<span class="memory-time" title="'+esc(f.updatedAt||'')+'">'+timeAgo(f.updatedAt)+'</span>'+
          '<button type="button" class="memory-del" data-idx="'+i+'" title="Delete">×</button>'+
        '</div>'+
      '</div>'+
      '<div class="memory-value">'+esc(f.value)+'</div>'+
      (f.source?'<div class="memory-source">source: '+esc(f.source)+'</div>':'')+
    '</article>';
  }).join('');

  listEl.querySelectorAll('.memory-del').forEach(function(btn){
    btn.addEventListener('click',function(ev){
      ev.stopPropagation();
      var idx=Number(btn.getAttribute('data-idx'));
      var fact=filtered[idx];
      if(fact)deleteFact(fact.key);
    });
  });
}

function token(){
  return ws.session&&ws.session.access_token;
}

function load(){
  if(skelEl)skelEl.style.display='';
  if(listEl)listEl.style.display='none';
  if(emptyEl)emptyEl.style.display='none';
  var t=token();
  if(!t)return;
  ws.pf('/v1/memory?limit=200',t).then(function(data){
    allFacts=data&&data.facts?data.facts:[];
    if(skelEl)skelEl.style.display='none';
    applyFilters();
    showMsg('',true);
  })['catch'](function(err){
    if(skelEl)skelEl.style.display='none';
    var msg=err&&err.message?String(err.message):'Failed to load memory from proxy.';
    if(/429|rate_limited/i.test(msg)){
      msg='Rate limited — wait a few seconds and refresh. Workspace reads no longer share the free LLM burst bucket after the latest proxy deploy.';
    }else if(/CSP|Failed to fetch|Network error/i.test(msg)){
      msg='Browser blocked the proxy URL (Content-Security-Policy). Hard-refresh the page after the latest site deploy, or open DevTools → Console for connect-src errors.';
    }else if(/401|unauthorized/i.test(msg)){
      msg='Session expired or proxy rejected the login token. Sign out and sign in again.';
    }else{
      msg='Failed to load memory from proxy. '+msg;
    }
    if(emptyEl){emptyEl.style.display='';emptyEl.textContent=msg;}
    showMsg(msg,false);
  });
}

function saveFact(){
  var key=(keyEl&&keyEl.value||'').trim();
  var value=(valEl&&valEl.value||'').trim();
  if(!key||!value){showMsg('Key and value are required.',false);return}
  if(key.length>120){showMsg('Key is too long (max 120).',false);return}
  var t=token();
  if(!t)return;
  if(saveBtn)saveBtn.disabled=true;
  showMsg('',true);
  ws.proxyFetch('/v1/memory',{
    method:'PUT',
    token:t,
    body:{facts:[{key:key,value:value,source:'web',confidence:1,updatedAt:new Date().toISOString()}]}
  }).then(function(res){
    if(saveBtn)saveBtn.disabled=false;
    if(!res){showMsg('Save failed.',false);return}
    showMsg('Saved · '+(res.merged||0)+' merged, total '+(res.total||0)+'.',true);
    if(keyEl)keyEl.value='';
    if(valEl)valEl.value='';
    load();
  })['catch'](function(err){
    if(saveBtn)saveBtn.disabled=false;
    showMsg('Save failed: '+(err&&err.message||'error'),false);
  });
}

function deleteFact(key){
  if(!key||!confirm('Delete fact “‘+key+’” from cloud memory?'))return;
  var t=token();
  if(!t)return;
  ws.proxyFetch('/v1/memory/'+encodeURIComponent(key),{method:'DELETE',token:t}).then(function(res){
    if(!res){showMsg('Delete failed.',false);return}
    showMsg('Deleted “'+key+'”.',true);
    load();
  })['catch'](function(err){
    showMsg('Delete failed: '+(err&&err.message||'error'),false);
  });
}

if(searchEl)searchEl.addEventListener('input',applyFilters);
if(saveBtn)saveBtn.addEventListener('click',saveFact);
if(refreshBtn)refreshBtn.addEventListener('click',function(){showMsg('',true);load()});
if(valEl)valEl.addEventListener('keydown',function(ev){
  if(ev.key==='Enter'&&(ev.metaKey||ev.ctrlKey)){ev.preventDefault();saveFact()}
});

function init(){load()}
window.addEventListener('arcana:workspace-ready',function(){init()});
if(ws.session)init();
})();
