// Arcana Workspace — Sessions page
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws)return;
var e=function(id){return document.getElementById(id)};
var tableEl=e('s-table'),skelEl=e('s-skeleton'),emptyEl=e('s-empty'),pageEl=e('s-page');
var prevBtn=e('s-prev'),nextBtn=e('s-next'),pagEl=e('s-pagination');
var searchEl=e('s-search'),filterStatusEl=e('s-filter-status');

var allSessions=[],filtered=[],page=0,perPage=10;

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function timeAgo(iso){if(!iso)return'';var d=new Date(iso);var sec=Math.floor((Date.now()-d)/1000);if(sec<60)return'just now';if(sec<3600)return Math.floor(sec/60)+'m ago';if(sec<86400)return Math.floor(sec/3600)+'h ago';return Math.floor(sec/86400)+'d ago'}

function showContent(vis){
  if(skelEl)skelEl.style.display=vis?'none':'';
  if(tableEl)tableEl.style.display=vis?'':'none';
  if(pagEl)pagEl.style.display=vis&&filtered.length>perPage?'':'none';
}

function applyFilters(){
  var q=(searchEl?searchEl.value:'').toLowerCase();
  var st=filterStatusEl?filterStatusEl.value:'';
  filtered=allSessions.filter(function(s){
    if(q&&s.model&&!s.model.toLowerCase().includes(q))return false;
    if(st&&s.status!==st)return false;
    return true;
  });
  page=0;
  renderPage();
}

function renderPage(){
  var start=page*perPage,end=Math.min(start+perPage,filtered.length);
  var pageSessions=filtered.slice(start,end);
  if(pageEl)pageEl.textContent='Page '+(page+1)+' of '+Math.max(1,Math.ceil(filtered.length/perPage));

  if(prevBtn)prevBtn.disabled=page===0;
  if(nextBtn)nextBtn.disabled=end>=filtered.length;

  if(!tableEl)return;
  if(pageSessions.length===0&&filtered.length===0){
    tableEl.style.display='none';
    if(emptyEl)emptyEl.style.display='';
    if(pagEl)pagEl.style.display='none';
    return;
  }
  if(emptyEl)emptyEl.style.display='none';
  tableEl.style.display='';

  var html=pageSessions.map(function(s,i){
    var idx=start+i;
    return '<div class="session-row" data-idx="'+idx+'" onclick="toggleSession('+idx+')">'+
      '<span class="sr-model">'+esc(s.model||'—')+'</span>'+
      '<span class="sr-tokens">'+(s.tokensIn+s.tokensOut||0).toLocaleString()+'</span>'+
      '<span class="sr-cost">'+(s.costCredits!==undefined?'$'+s.costCredits.toFixed(2):'—')+'</span>'+
      '<span class="sr-time">'+timeAgo(s.createdAt)+'</span>'+
      '<button class="sr-expand">+</button>'+
      '<div class="sr-detail" id="sd-'+idx+'">'+
        '<div class="sr-detail-grid">'+
          '<div><span class="label">Model</span>'+esc(s.model||'—')+'</div>'+
          '<div><span class="label">Provider</span>'+esc(s.provider||'—')+'</div>'+
          '<div><span class="label">Tokens In</span>'+(s.tokensIn||0).toLocaleString()+'</div>'+
          '<div><span class="label">Tokens Out</span>'+(s.tokensOut||0).toLocaleString()+'</div>'+
          '<div><span class="label">Cost</span>'+(s.costCredits!==undefined?s.costCredits.toFixed(2)+' credits':'—')+'</div>'+
          '<div><span class="label">Duration</span>'+(s.durationMs?Math.round(s.durationMs/1000)+'s':'—')+'</div>'+
          '<div><span class="label">Messages</span>'+(s.messageCount||'—')+'</div>'+
          '<div><span class="label">Status</span>'+esc(s.status||'—')+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');
  tableEl.innerHTML=html;
}

window.toggleSession=function(idx){
  var detail=document.getElementById('sd-'+idx);
  if(!detail)return;
  var row=detail.closest('.session-row');
  if(row)row.classList.toggle('expanded');
};

// Event listeners
if(searchEl)searchEl.addEventListener('input',applyFilters);
if(filterStatusEl)filterStatusEl.addEventListener('change',applyFilters);
if(prevBtn)prevBtn.addEventListener('click',function(){if(page>0){page--;renderPage()}});
if(nextBtn)nextBtn.addEventListener('click',function(){if((page+1)*perPage<filtered.length){page++;renderPage()}});

function init(s){
  ws.pf('/v1/sessions?limit=50',s.access_token).then(function(data){
    allSessions=data&&data.sessions?data.sessions:[];
    applyFilters();
  })['catch'](function(){
    if(skelEl)skelEl.style.display='none';
    if(emptyEl)emptyEl.textContent='Failed to load sessions.';emptyEl.style.display='';
  });
}

window.addEventListener('arcana:workspace-ready',function(ev){init(ev.detail)});
if(ws.session)init(ws.session);
})();
