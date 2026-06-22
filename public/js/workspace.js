// Arcana Workspace
(function () {
  'use strict';
  var PROXY = 'https://proxy.arcana.otnelhq.com';
  var sb = window.__ARCANA_SB__;
  if (!sb) { window.location.replace('/auth'); return; }

  var emailEl = document.getElementById('ws-email');
  var avatarEl = document.getElementById('ws-avatar');
  var balanceEl = document.getElementById('ws-balance');
  var balanceSubEl = document.getElementById('ws-balance-sub');
  var creditsEl = document.getElementById('ws-credits');
  var usageEl = document.getElementById('ws-usage');
  var usageSubEl = document.getElementById('ws-usage-sub');
  var statsEl = document.getElementById('ws-stats');
  var skelEl = document.getElementById('ws-skeleton');

  function showCards(s) { if (skelEl) skelEl.style.display = s ? 'none' : ''; if (statsEl) statsEl.style.display = s ? '' : 'none'; }

  async function proxyFetch(path, token) {
    var r = await fetch(PROXY + path, { headers: { Authorization: 'Bearer ' + token } });
    if (r.status === 401) {
      var ref = await sb.auth.refreshSession();
      if (ref.data.session) { r = await fetch(PROXY + path, { headers: { Authorization: 'Bearer ' + ref.data.session.access_token } }); if (r.ok) return r.json(); }
      await sb.auth.signOut(); window.location.replace('/auth'); return null;
    }
    if (!r.ok) throw new Error('Proxy ' + r.status);
    return r.json();
  }

  async function init(session) {
    if (emailEl) emailEl.textContent = session.user.email || '';
    if (avatarEl) avatarEl.textContent = (session.user.email || '?')[0].toUpperCase();

    try {
      var results = await Promise.allSettled([
        proxyFetch('/v1/balance', session.access_token),
        proxyFetch('/v1/usage', session.access_token),
      ]);
      var balanceData = results[0].status === 'fulfilled' ? results[0].value : null;
      var usageData = results[1].status === 'fulfilled' ? results[1].value : null;

      var dollars = balanceData ? (balanceData.dollars || '0.00') : '—';
      var credits = balanceData ? (balanceData.credits || 0) : 0;
      if (balanceEl) balanceEl.textContent = balanceData ? '$' + dollars : '—';
      if (balanceSubEl) balanceSubEl.textContent = balanceData ? Math.round(credits).toLocaleString() + ' credits' : 'unavailable';
      if (creditsEl) creditsEl.textContent = balanceData ? credits.toLocaleString() : '—';

      var used = usageData ? (usageData.requests || usageData.count || 0) : 0;
      if (usageEl) usageEl.textContent = usageData ? used.toLocaleString() : '—';
      if (usageSubEl) usageSubEl.textContent = usageData ? 'of 50 today' : 'unavailable';
    } catch (e) {}

    showCards(true);
  }

  // Sign out
  document.getElementById('btn-signout').addEventListener('click', async function () {
    await sb.auth.signOut(); window.location.replace('/');
  });

  // Mobile menu
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  function close() { sidebar.classList.remove('open'); }
  document.getElementById('mobile-menu-btn').addEventListener('click', function () { sidebar.classList.toggle('open'); });
  if (overlay) overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // Session events
  window.addEventListener('arcana:signed-out', function () { window.location.replace('/'); });

  sb.auth.getSession().then(function (r) {
    if (!r.data.session) { window.location.replace('/auth'); return; }
    init(r.data.session);
  });
  sb.auth.onAuthStateChange(function (event, s) {
    if (event === 'SIGNED_OUT') window.location.replace('/');
    if (event === 'TOKEN_REFRESHED' && s) init(s);
  });
})();
