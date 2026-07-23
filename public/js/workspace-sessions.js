// Arcana Workspace — Sessions page
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws)return;
var e=function(id){return document.getElementById(id)};
var tableEl=e('s-table'),skelEl=e('s-skeleton'),emptyEl=e('s-empty'),pageEl=e('s-page');
var prevBtn=e('s-prev'),nextBtn=e('s-next'),pagEl=e('s-pagination');
var searchEl=e('s-search'),filterStatusEl=e('s-filter-status');
var countEl=e('s-count');
var loadMoreEl=e('s-load-more'),loadMoreBtn=e('s-load-btn');

var allSessions=[],filtered=[],page=0,perPage=12;
var detailCache={};
var allLoaded=false,loadingMore=false;

var esc=ws.esc,timeAgo=ws.timeAgo;

var STATUS_DESC={
  completed:'Finished normally',
  failed:'Error occurred',
  streamed:'Streamed over SSE',
  pending:'Waiting for completion'
};
function statusDesc(st){return STATUS_DESC[st]||'Status: '+st}

function fmtTokens(s){return ((s.tokensIn||0)+(s.tokensOut||0)).toLocaleString()}
function fmtCost(s){
  if(s.costCredits==null)return'—';
  // costCredits is stored as credits (100 credits = $1)
  var dollars=Number(s.costCredits)/100;
  if(dollars<0.01&&Number(s.costCredits)>0)return'<$0.01';
  return'$'+dollars.toFixed(2);
}
function statusClass(st){
  if(st==='completed'||st==='streamed')return'ok';
  if(st==='failed')return'err';
  return'unknown';
}
function preview(s){
  var t=s.firstMessage||s.summary||'';
  if(!t||t==='(generated)'||t==='(no preview)')return'';
  return t;
}

function showContent(vis){
  if(skelEl)skelEl.classList.toggle('is-hidden',vis);
  if(tableEl)tableEl.classList.toggle('is-hidden',!vis);
  if(pagEl)pagEl.classList.toggle('is-hidden',!(vis&&filtered.length>perPage));
  // Show load more button only when there may be more data
  if(loadMoreEl)loadMoreEl.classList.toggle('is-hidden',!vis||allLoaded);
}

function applyFilters(){
  var q=(searchEl?searchEl.value:'').toLowerCase().trim();
  var st=filterStatusEl?filterStatusEl.value:'';
  filtered=allSessions.filter(function(s){
    if(st&&s.status!==st)return false;
    if(!q)return true;
    var hay=[s.model,s.provider,s.id,s.status,preview(s)].join(' ').toLowerCase();
    return hay.indexOf(q)!==-1;
  });
  page=0;
  renderPage();
}

function renderPage(){
  var start=page*perPage,end=Math.min(start+perPage,filtered.length);
  var pageSessions=filtered.slice(start,end);
  var pages=Math.max(1,Math.ceil(filtered.length/perPage)||1);
  if(pageEl)pageEl.textContent='Page '+(page+1)+' of '+pages;
  if(countEl)countEl.textContent=filtered.length+(filtered.length===1?' session':' sessions')+(filtered.length!==allSessions.length?' (filtered)':'');

  if(prevBtn)prevBtn.disabled=page===0;
  if(nextBtn)nextBtn.disabled=end>=filtered.length;

  if(!tableEl)return;
  if(pageSessions.length===0){
    tableEl.classList.add('is-hidden');
    if(emptyEl){
      emptyEl.classList.remove('is-hidden');
      emptyEl.innerHTML=allSessions.length===0
        ?'No sessions for <b>this web account</b> yet.<br><br>'
          +'Sessions are recorded when this signed-in user hits Arcana Proxy.<br>'
          +'CLI data under a different license id (e.g. an old <code>enterprise</code> key) will not show here.<br><br>'
          +'Fix: run <code>arcana console login</code> (device login with the same email as the site), then use the CLI so sessions land on your Supabase user id.'
        :'No sessions match your filters.';
    }
    if(pagEl)pagEl.classList.add('is-hidden');
    return;
  }
  if(emptyEl)emptyEl.classList.add('is-hidden');
  tableEl.classList.remove('is-hidden');
  if(pagEl)pagEl.classList.toggle('is-hidden',!(filtered.length>perPage));

  var html=pageSessions.map(function(s,i){
    var idx=start+i;
    var pv=preview(s);
    var st=s.status||'—';
    return '<div class="session-row" data-idx="'+idx+'" data-id="'+esc(s.id||'')+'" onclick="toggleSession('+idx+')">'+
      '<div class="sr-main">'+
        '<span class="sr-model">'+esc(s.model||'—')+'</span>'+
        (pv?'<span class="sr-preview">'+esc(pv)+'</span>':'')+
      '</div>'+
      '<span class="sr-tokens" title="tokens in+out">'+fmtTokens(s)+'</span>'+
      '<span class="sr-cost">'+fmtCost(s)+'</span>'+
      '<span class="sr-time" title="'+esc(s.createdAt||'')+'">'+timeAgo(s.createdAt)+'</span>'+
      '<span class="sr-status '+statusClass(st)+'" title="'+esc(statusDesc(st))+'">'+esc(st)+'</span>'+
      '<button type="button" class="sr-expand" aria-label="Expand">+</button>'+
      '<div class="sr-detail" id="sd-'+idx+'">'+
        '<div class="sr-detail-grid" id="sdg-'+idx+'">'+
          '<div><span class="label">Model</span>'+esc(s.model||'—')+'</div>'+
          '<div><span class="label">Provider</span>'+esc(s.provider||'—')+'</div>'+
          '<div><span class="label">Tokens In</span>'+(s.tokensIn||0).toLocaleString()+'</div>'+
          '<div><span class="label">Tokens Out</span>'+(s.tokensOut||0).toLocaleString()+'</div>'+
          '<div><span class="label">Cost</span>'+fmtCost(s)+' <span class="hint-inline">('+Math.round(s.costCredits||0)+' cr)</span></div>'+
          '<div><span class="label">Duration</span>'+(s.durationMs?Math.round(s.durationMs/1000)+'s':'—')+'</div>'+
          '<div><span class="label">Messages</span>'+(s.messageCount!=null?s.messageCount:'—')+'</div>'+
          '<div><span class="label">Status</span>'+esc(st)+'</div>'+
          '<div class="span-2"><span class="label">Session ID</span><code class="mono-id">'+esc(s.id||'—')+'</code></div>'+
          (pv?'<div class="span-2"><span class="label">Preview</span><div class="sr-preview-full">'+esc(pv)+'</div></div>':'')+
        '</div>'+
        '<div class="sr-detail-loading is-hidden" id="sdl-'+idx+'">Loading detail…</div>'+
      '</div>'+
    '</div>';
  }).join('');
  tableEl.innerHTML=html;
}

window.toggleSession=function(idx){
  var detail=document.getElementById('sd-'+idx);
  if(!detail)return;
  var row=detail.closest('.session-row');
  if(!row)return;
  var opening=!row.classList.contains('expanded');
  // collapse others for clarity
  if(opening&&tableEl){
    tableEl.querySelectorAll('.session-row.expanded').forEach(function(r){r.classList.remove('expanded')});
  }
  row.classList.toggle('expanded',opening);
  if(opening)loadDetail(idx,row.getAttribute('data-id'));
};

function loadDetail(idx,id){
  if(!id||!ws.session)return;
  if(detailCache[id]){applyDetail(idx,detailCache[id]);return}
  var loadEl=document.getElementById('sdl-'+idx);
  if(loadEl)loadEl.classList.remove('is-hidden');
  ws.pf('/v1/sessions/'+encodeURIComponent(id),ws.session.access_token).then(function(d){
    if(d)detailCache[id]=d;
    if(loadEl)loadEl.classList.add('is-hidden');
    if(d)applyDetail(idx,d);
  })['catch'](function(){
    if(loadEl){loadEl.textContent='Could not load session detail.';loadEl.classList.remove('is-hidden')}
  });
}

function applyDetail(idx,d){
  var grid=document.getElementById('sdg-'+idx);
  if(!grid||!d)return;
  // Merge richer fields if present
  var s=filtered[idx]||{};
  var pv=d.firstMessage||d.summary||preview(s);
  if(pv==='(generated)'||pv==='(no preview)')pv='';
  var html=
    '<div><span class="label">Model</span>'+esc(d.model||s.model||'—')+'</div>'+
    '<div><span class="label">Provider</span>'+esc(d.provider||s.provider||'—')+'</div>'+
    '<div><span class="label">Tokens In</span>'+(d.tokensIn||0).toLocaleString()+'</div>'+
    '<div><span class="label">Tokens Out</span>'+(d.tokensOut||0).toLocaleString()+'</div>'+
    '<div><span class="label">Cost</span>'+fmtCost(d)+' <span class="hint-inline">('+Math.round(d.costCredits||0)+' cr)</span></div>'+
    '<div><span class="label">Duration</span>'+(d.durationMs?Math.round(d.durationMs/1000)+'s':'—')+'</div>'+
    '<div><span class="label">Messages</span>'+(d.messageCount!=null?d.messageCount:'—')+'</div>'+
    '<div><span class="label">Status</span>'+esc(d.status||'—')+'</div>'+
    '<div class="span-2"><span class="label">Session ID</span><code class="mono-id">'+esc(d.id||'—')+'</code></div>'+
    (d.createdAt?'<div class="span-2"><span class="label">Created</span>'+esc(new Date(d.createdAt).toLocaleString())+'</div>':'')+
    (pv?'<div class="span-2"><span class="label">Preview</span><div class="sr-preview-full">'+esc(pv)+'</div></div>':'');
  grid.innerHTML=html;
}

// --- Status breakdown chart ---
var chartEl=e('s-status-chart'),barEl=e('sc-bar'),legendEl=e('sc-legend');

function renderStatusChart(){
  if(!chartEl||!barEl||!legendEl)return;
  if(!allSessions||allSessions.length===0){chartEl.classList.add('is-hidden');return}

  // Count by status
  var counts={};
  var order=[];  // track display order: completed, streamed, failed, then rest
  allSessions.forEach(function(s){
    var st=s.status||'—';
    if(!counts[st]){counts[st]=0;order.push(st)}
    counts[st]++;
  });

  // Sort: completed/streamed/failed first, then rest
  var priority={completed:0,streamed:1,failed:2};
  order.sort(function(a,b){
    var pa=priority[a]!==undefined?priority[a]:9;
    var pb=priority[b]!==undefined?priority[b]:9;
    return pa-pb||counts[b]-counts[a];
  });

  var total=allSessions.length;

  // Stacked bar
  var barHtml=order.map(function(st){
    var pct=Math.round(counts[st]/total*100);
    var cat=statusClass(st);
    var color=cat==='ok'?'rgba(140,255,191,.85)':cat==='err'?'rgba(255,107,107,.85)':'rgba(255,211,110,.7)';
    return '<span class="sc-seg" style="width:'+pct+'%;background:'+color+'" title="'+esc(STATUS_DESC[st]||st)+': '+counts[st]+' ('+pct+'%)"></span>';
  }).join('');
  barEl.innerHTML=barHtml;

  // Legend
  var legHtml=order.map(function(st){
    var pct=Math.round(counts[st]/total*100);
    var cls=statusClass(st);
    var color=cls==='ok'?'var(--color-success)':cls==='err'?'var(--color-error)':'var(--color-warning)';
    return '<button type="button" class="sc-item" data-status="'+esc(st)+'" title="Filter by '+esc(st)+'">'+
      '<span class="sc-dot" style="background:'+color+'"></span>'+
      '<span class="sc-label">'+esc(st)+'</span>'+
      '<span class="sc-count">'+counts[st]+'</span>'+
      '<span class="sc-pct">('+pct+'%)</span>'+
    '</button>';
  }).join('');
  legendEl.innerHTML=legHtml;

  // Click legend items to filter
  legendEl.querySelectorAll('.sc-item').forEach(function(btn){
    btn.addEventListener('click',function(){
      var st=this.getAttribute('data-status');
      if(filterStatusEl){
        filterStatusEl.value=st;
        applyFilters();
      }
    });
  });

  chartEl.classList.remove('is-hidden');
}

// --- Load more: fetch sessions older than the oldest loaded ---
function loadMore(){
  if(loadingMore||allLoaded||!ws.session)return;
  loadingMore=true;
  if(loadMoreBtn){loadMoreBtn.textContent='Loading…';loadMoreBtn.disabled=true}

  // Use the oldest session's createdAt as a cursor to paginate backwards
  var before='';
  for(var i=allSessions.length-1;i>=0;i--){
    if(allSessions[i].createdAt){before=allSessions[i].createdAt;break}
  }
  if(!before){loadingMore=false;if(loadMoreEl)loadMoreEl.classList.add('is-hidden');return}

  var path='/v1/sessions?limit=200&before='+encodeURIComponent(before);
  ws.pf(path,ws.session.access_token).then(function(data){
    var newSessions=data&&data.sessions?data.sessions:[];
    loadingMore=false;
    if(loadMoreBtn){loadMoreBtn.textContent='Load more';loadMoreBtn.disabled=false}

    if(newSessions.length===0){
      allLoaded=true;
      if(loadMoreEl)loadMoreEl.classList.add('is-hidden');
      return;
    }

    // Append, avoiding duplicates by session id
    var existingIds={};
    allSessions.forEach(function(s){if(s.id)existingIds[s.id]=true});
    var added=0;
    newSessions.forEach(function(s){
      if(s.id&&!existingIds[s.id]){
        existingIds[s.id]=true;
        allSessions.push(s);
        added++;
      }
    });

    // If we got fewer than requested, assume no more (or none new)
    if(newSessions.length<200||added===0){
      allLoaded=true;
      if(loadMoreEl)loadMoreEl.classList.add('is-hidden');
    }

    // Re-render everything with the full dataset
    renderStatusChart();
    var prevPage=page;
    applyFilters();
    // Stay on same client-side page after loading more
    page=prevPage;
    renderPage();
  })['catch'](function(){
    loadingMore=false;
    if(loadMoreBtn){loadMoreBtn.textContent='Load more';loadMoreBtn.disabled=false}
  });
}

if(loadMoreBtn)loadMoreBtn.addEventListener('click',loadMore);

if(searchEl)searchEl.addEventListener('input',applyFilters);
if(filterStatusEl)filterStatusEl.addEventListener('change',applyFilters);
if(prevBtn)prevBtn.addEventListener('click',function(){if(page>0){page--;renderPage()}});
if(nextBtn)nextBtn.addEventListener('click',function(){if((page+1)*perPage<filtered.length){page++;renderPage()}});

function init(s){
  showContent(false);
  ws.pf('/v1/sessions?limit=200',s.access_token).then(function(data){
    allSessions=data&&data.sessions?data.sessions:[];
    // Log unique statuses to help debug what the proxy actually returns
    var counts={};
    (allSessions||[]).forEach(function(ses){counts[ses.status]=(counts[ses.status]||0)+1});
    console.log('[Sessions] Loaded '+allSessions.length+' sessions. Statuses:',counts);
    if(allSessions.length)console.log('[Sessions] Sample:',allSessions.slice(0,3));
    renderStatusChart();
    applyFilters();
    allLoaded=allSessions.length<200;
    showContent(true);
  })['catch'](function(){
    if(skelEl)skelEl.classList.add('is-hidden');
    if(emptyEl){emptyEl.textContent='Failed to load sessions.';emptyEl.classList.remove('is-hidden');}
  });
}

window.addEventListener('arcana:workspace-ready',function(ev){init(ev.detail)});
if(ws.session)init(ws.session);
})();
