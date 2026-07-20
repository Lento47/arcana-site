// Arcana Workspace — Billing page
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws)return;
var e=function(id){return document.getElementById(id)};
var skelEl=e('b-skeleton'),contentEl=e('b-content');
var tierEl=e('b-tier'),statusEl=e('b-status'),renewalEl=e('b-renewal'),creditsEl=e('b-credits');
var txTable=e('b-transactions'),emptyEl=e('b-empty');

function showContent(vis){
  if(skelEl)skelEl.style.display=vis?'none':'';
  if(contentEl)contentEl.style.display=vis?'':'none';
}

function formatDate(iso){
  if(!iso)return'—';
  var d=new Date(iso);
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function init(s){
  showContent(false);

  Promise.allSettled([
    ws.pf('/v1/purchases',s.access_token),
    ws.pf('/v1/balance',s.access_token),
    ws.pf('/v1/health',s.access_token)
  ]).then(function(results){
    var pd=results[0].status==='fulfilled'?results[0].value:null;
    var bd=results[1].status==='fulfilled'?results[1].value:null;
    var hd=results[2].status==='fulfilled'?results[2].value:null;

    // Subscription info
    if(hd&&hd.tier){
      if(tierEl)tierEl.textContent=hd.tier.charAt(0).toUpperCase()+hd.tier.slice(1);
      if(statusEl)statusEl.textContent='Active';
      if(renewalEl)renewalEl.textContent='—';
    }
    if(bd&&creditsEl)creditsEl.textContent=Math.round(bd.credits||0).toLocaleString()+' credits ($'+((bd.dollars||'0.00'))+')';

    // Transaction history
    var purchases=pd&&pd.purchases?pd.purchases:[];
    if(!txTable||!emptyEl)return;
    if(purchases.length===0){
      txTable.style.display='none';
      emptyEl.style.display='';
    }else{
      emptyEl.style.display='none';
      txTable.style.display='';
      var html=purchases.map(function(p){
        return '<div class="tx-row">'+
          '<span class="tx-date">'+formatDate(p.createdAt)+'</span>'+
          '<span class="tx-amount">$'+p.amount.toFixed(2)+'</span>'+
          '<span class="tx-credits">+'+(p.credits||0).toLocaleString()+'</span>'+
          '<span class="tx-method">'+(p.paymentMethod||'PayPal')+'</span>'+
          '<span class="tx-status '+(p.status||'completed')+'">'+(p.status||'Completed')+'</span>'+
        '</div>';
      }).join('');
      txTable.innerHTML=html;
    }
    showContent(true);
  })['catch'](function(){showContent(true)});
}

window.addEventListener('arcana:workspace-ready',function(ev){init(ev.detail)});
if(ws.session)init(ws.session);
})();
