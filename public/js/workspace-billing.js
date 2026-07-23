// Arcana Workspace — Billing page
(function(){'use strict';
var ws=window.__ARCANA_WORKSPACE__;
if(!ws)return;
var e=function(id){return document.getElementById(id)};
var skelEl=e('b-skeleton'),txSkelEl=e('b-tx-skel'),contentEl=e('b-content'),errorEl=e('b-error');
var tierEl=e('b-tier'),statusEl=e('b-status'),renewalEl=e('b-renewal'),creditsEl=e('b-credits');
var txTable=e('b-transactions'),emptyEl=e('b-empty');

function showContent(vis){
  if(skelEl)skelEl.classList.toggle('is-hidden',vis);
  if(contentEl)contentEl.classList.toggle('is-hidden',!vis);
  if(errorEl)errorEl.classList.add('is-hidden');
}
function showError(){
  if(skelEl)skelEl.classList.add('is-hidden');
  showTxSkeleton(false);
  if(contentEl)contentEl.classList.add('is-hidden');
  if(errorEl)errorEl.classList.remove('is-hidden');
}
function showTxSkeleton(show){
  if(txSkelEl)txSkelEl.classList.toggle('is-hidden',!show);
}

function formatDate(iso){
  if(!iso)return'—';
  var d=new Date(iso);
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function init(s){
  showContent(false);
  showTxSkeleton(true);

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
    showTxSkeleton(false);
    if(purchases.length===0){
      txTable.classList.add('is-hidden');
      emptyEl.classList.remove('is-hidden');
    }else{
      emptyEl.classList.add('is-hidden');
      txTable.classList.remove('is-hidden');
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
  })['catch'](function(){showError()});
}

var retryBtn=e('b-retry');
if(retryBtn)retryBtn.addEventListener('click',function(){
  if(ws.session)init(ws.session);
});
window.addEventListener('arcana:workspace-ready',function(ev){init(ev.detail)});
if(ws.session)init(ws.session);
})();
