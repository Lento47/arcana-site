// Arcana Workspace — Settings page
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws)return;
var e=function(id){return document.getElementById(id)};
var nameEl=e('s-name'),emailEl=e('s-email'),themeEl=e('s-theme'),receiptsEl=e('s-receipts'),alertsEl=e('s-alerts'),saveBtn=e('s-save'),msgEl=e('s-msg');

function showMsg(text,type){
  if(!msgEl)return;
  msgEl.textContent=text;
  msgEl.className='msg'+(type?' '+type:'');
  msgEl.style.display=text?'block':'none';
  if(type==='ok')setTimeout(function(){showMsg('','')},3000);
}

function applyTheme(light){
  if(light)document.documentElement.setAttribute('data-theme','light');
  else document.documentElement.removeAttribute('data-theme');
}

// Load profile
function loadProfile(s){
  ws.pf('/v1/profile',s.access_token).then(function(profile){
    if(!profile)return;
    if(nameEl)nameEl.value=profile.displayName||'';
    if(emailEl)emailEl.value=s.user.email||'';
    var theme=profile.theme||'dark';
    if(themeEl)themeEl.checked=theme==='light';
    applyTheme(theme==='light');
    if(receiptsEl)receiptsEl.checked=profile.notifications?.emailReceipts!==false;
    if(alertsEl)alertsEl.checked=profile.notifications?.usageAlerts===true;
  })['catch'](function(){
    if(emailEl)emailEl.value=s.user.email||'';
  });
}

// Save profile
function saveProfile(s){
  if(saveBtn)saveBtn.disabled=true;
  var body={displayName:nameEl?nameEl.value:'',theme:themeEl&&themeEl.checked?'light':'dark',notifications:{emailReceipts:receiptsEl?receiptsEl.checked:true,usageAlerts:alertsEl?alertsEl.checked:false}};

  // Use Pages Function relay for PUT
  fetch('/api/profile',{method:'PUT',headers:{Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){
    if(r.ok)showMsg('Settings saved.','ok');
    else showMsg('Failed to save settings.','err');
  })['catch'](function(){showMsg('Network error.','err')})['finally'](function(){if(saveBtn)saveBtn.disabled=false});
}

// Theme toggle immediate apply
if(themeEl)themeEl.addEventListener('change',function(){
  applyTheme(themeEl.checked);
  // Save theme immediately
  var s=ws.session;
  if(s)ws.proxyFetch('/v1/profile',{method:'PUT',body:{theme:themeEl.checked?'light':'dark'},token:s.access_token})['catch'](function(){});
});

if(saveBtn)saveBtn.addEventListener('click',function(){
  var s=ws.session;
  if(s)saveProfile(s);else showMsg('Not authenticated.','err');
});

window.addEventListener('arcana:workspace-ready',function(ev){loadProfile(ev.detail)});
if(ws.session)loadProfile(ws.session);
})();
