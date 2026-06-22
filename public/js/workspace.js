// Arcana Workspace
(function () {
  'use strict';
  const PROXY = 'https://proxy.arcana.otnelhq.com';
  const sb = window.__ARCANA_SB__;
  if (!sb) { window.location.replace('/auth'); return; }

  const $ = id => document.getElementById(id);
  const el = {
    email: $('ws-email'), avatar: $('ws-avatar'),
    balance: $('ws-balance'), balanceSub: $('ws-balance-sub'), balanceBar: $('ws-balance-bar'),
    credits: $('ws-credits'), creditsBar: $('ws-credits-bar'),
    usage: $('ws-usage'), usageSub: $('ws-usage-sub'), usageBar: $('ws-usage-bar'),
    cards: $('ws-cards'), skeleton: $('ws-skeleton'),
    signOut: $('btn-signout'), mobileMenu: $('mobile-menu-btn'), sidebar: $('sidebar'),
  };

  let session = null;
  function showCards(s) { if (el.skeleton) el.skeleton.style.display = s ? 'none' : ''; if (el.cards) el.cards.style.display = s ? '' : 'none'; }

  async function proxyFetch(path, token) {
    const r = await fetch(PROXY + path, { headers: { Authorization: 'Bearer ' + token } });
    if (r.status === 401) {
      const { data } = await sb.auth.refreshSession();
      if (data.session) { session = data.session; const r2 = await fetch(PROXY + path, { headers: { Authorization: 'Bearer ' + data.session.access_token } }); if (r2.ok) return r2.json(); }
      await sb.auth.signOut(); window.location.replace('/auth'); return null;
    }
    if (!r.ok) throw new Error('Proxy ' + r.status);
    return r.json();
  }

  async function init(s) {
    session = s;
    if (el.email) el.email.textContent = session.user.email || '';
    if (el.avatar) el.avatar.textContent = (session.user.email || '?')[0].toUpperCase();

    try {
      const results = await Promise.allSettled([
        proxyFetch('/v1/health', session.access_token),
        proxyFetch('/v1/balance', session.access_token),
        proxyFetch('/v1/usage', session.access_token),
      ]);
      const health = results[0].status === 'fulfilled' ? results[0].value : null;
      const balanceData = results[1].status === 'fulfilled' ? results[1].value : null;
      const usageData = results[2].status === 'fulfilled' ? results[2].value : null;
      const tier = health?.tier || 'free';

      const dollars = balanceData?.dollars ?? '—';
      const credits = balanceData?.credits ?? 0;
      if (el.balance) el.balance.textContent = balanceData ? '$' + dollars : '—';
      if (el.balanceSub) el.balanceSub.textContent = balanceData ? Math.round(credits).toLocaleString() + ' credits' : 'unavailable';
      if (el.balanceBar) el.balanceBar.style.width = balanceData ? Math.min(100, (parseFloat(dollars) / 50) * 100) + '%' : '0%';
      if (el.credits) el.credits.textContent = balanceData ? credits.toLocaleString() : '—';
      if (el.creditsBar) el.creditsBar.style.width = balanceData ? Math.min(100, (credits / 5000) * 100) + '%' : '0%';

      const used = usageData?.requests ?? usageData?.count ?? 0;
      const limits = { enterprise: Infinity, pro: 2000, trial: 200, free: 50 };
      const limit = limits[tier] ?? 50;
      if (el.usage) el.usage.textContent = usageData ? used.toLocaleString() : '—';
      if (el.usageSub) el.usageSub.textContent = usageData ? 'of ' + (limit === Infinity ? '∞' : limit.toLocaleString()) + ' today' : 'unavailable';
      if (el.usageBar) {
        const pct = limit === Infinity ? 0 : Math.min(100, Math.round(used / limit * 100));
        el.usageBar.style.width = (usageData ? pct : 0) + '%';
        el.usageBar.style.background = pct > 95 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--accent)';
      }
    } catch (e) {}

    showCards(true);
  }

  if (el.signOut) el.signOut.addEventListener('click', async () => { await sb.auth.signOut(); window.location.replace('/'); });

  const overlay = document.getElementById('sidebar-overlay');
  function closeSidebar() { el.sidebar.classList.remove('open'); }
  if (el.mobileMenu) { el.mobileMenu.addEventListener('click', () => el.sidebar.classList.toggle('open')); if (overlay) overlay.addEventListener('click', closeSidebar); }
  el.sidebar.querySelectorAll('.nav-item').forEach(item => { item.addEventListener('click', closeSidebar); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeSidebar(); });

  window.addEventListener('arcana:signed-out', () => { window.location.replace('/'); });

  sb.auth.getSession().then(({ data }) => {
    if (!data.session) { window.location.replace('/auth'); return; }
    init(data.session);
  });
  sb.auth.onAuthStateChange((event, s) => {
    if (event === 'SIGNED_OUT') window.location.replace('/');
    if (event === 'TOKEN_REFRESHED' && s) init(s);
  });
})();
