// Arcana Workspace — app shell
(function () {
  'use strict';
  const PROXY = 'https://proxy.arcana.otnelhq.com';
  const sb = window.__ARCANA_SB__;

  // Session guard
  if (!sb) { window.location.replace('/auth'); return; }

  const el = {
    email: document.getElementById('ws-email'),
    tierBadge: document.getElementById('ws-tier-badge'),
    balance: document.getElementById('ws-balance'),
    balanceSub: document.getElementById('ws-balance-sub'),
    credits: document.getElementById('ws-credits'),
    usage: document.getElementById('ws-usage'),
    usageSub: document.getElementById('ws-usage-sub'),
    statsGrid: document.getElementById('ws-stats'),
    skeleton: document.getElementById('ws-skeleton'),
    errorBanner: document.getElementById('ws-error'),
    signOut: document.getElementById('btn-signout'),
    mobileMenu: document.getElementById('mobile-menu-btn'),
    sidebar: document.getElementById('sidebar'),
  };

  let session = null;

  async function proxyFetch(path, token) {
    const r = await fetch(PROXY + path, { headers: { Authorization: 'Bearer ' + token } });
    if (r.status === 401) {
      // Try token refresh
      const { data } = await sb.auth.refreshSession();
      if (data.session) {
        session = data.session;
        const r2 = await fetch(PROXY + path, { headers: { Authorization: 'Bearer ' + data.session.access_token } });
        if (r2.ok) return r2.json();
      }
      sb.auth.signOut();
      window.location.replace('/auth');
      return null;
    }
    if (!r.ok) throw new Error('Proxy ' + r.status);
    return r.json();
  }

  function showError(msg) {
    if (el.errorBanner) {
      el.errorBanner.innerHTML = '⚠ ' + msg + ' <button onclick="location.reload()">Retry</button>';
      el.errorBanner.style.display = 'flex';
    }
  }

  function showSkeleton(s) {
    if (el.skeleton) el.skeleton.style.display = s ? 'block' : 'none';
    if (el.statsGrid) el.statsGrid.style.display = s ? 'none' : '';
  }

  async function init(s) {
    session = s;
    checkProxyHealth();
    const email = session.user.email || '';
    if (el.email) el.email.textContent = email;
    // Avatar: first letter of email
    const av = document.getElementById('ws-avatar');
    if (av) av.textContent = (email[0] || '?').toUpperCase();
    // Session ID
    const sid = document.getElementById('ws-session-id');
    if (sid) sid.textContent = 'arc-' + session.user.id.slice(0, 8);
    showSkeleton(true);

    try {
      const [health, balance, usage] = await Promise.all([
        proxyFetch('/v1/health', session.access_token),
        proxyFetch('/v1/balance', session.access_token),
        proxyFetch('/v1/usage', session.access_token),
      ]);

      // Tier
      const tier = health?.tier || 'free';
      const tl = document.getElementById('ws-tier-label');
      if (tl) { tl.textContent = tier + ' tier'; tl.className = 'side-tier ' + (tier === 'pro' ? 'pro' : tier === 'enterprise' ? 'enterprise' : 'free'); }

      // Balance
      const credits = balance?.credits ?? 0;
      const dollars = balance?.dollars ?? '0.00';
      if (el.balance) el.balance.textContent = '$' + dollars;
      if (el.balanceSub) el.balanceSub.textContent = Math.round(credits) + ' credits';
      if (el.credits) el.credits.textContent = credits.toLocaleString('en');
      // Balance bar (max visual: $50)
      const balBar = document.getElementById('ws-balance-bar');
      if (balBar) balBar.style.width = Math.min(100, (parseFloat(dollars) / 50) * 100) + '%';
      // Credits bar
      const crBar = document.getElementById('ws-credits-bar');
      if (crBar) crBar.style.width = Math.min(100, (credits / 5000) * 100) + '%';

      // Usage
      const used = usage?.requests ?? usage?.count ?? 0;
      const limits = { enterprise: Infinity, pro: 2000, trial: 200, free: 50 };
      const limit = limits[tier] ?? 50;
      const limitText = tier === 'enterprise' ? '∞' : limit.toLocaleString('en');
      if (el.usage) el.usage.textContent = used.toLocaleString('en');
      if (el.usageSub) el.usageSub.textContent = 'of ' + limitText + ' today';
      const uBar = document.getElementById('ws-usage-bar');
      if (uBar) {
        const pct = limit === Infinity ? 0 : Math.min(100, Math.round(used / limit * 100));
        uBar.style.width = pct + '%';
        uBar.style.background = pct > 95 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--accent)';
      }
    } catch (e) {
      showError('Could not load workspace data. Proxy may be unavailable.');
    }

    showSkeleton(false);
  }

  // Sign out
  if (el.signOut) {
    el.signOut.addEventListener('click', async () => {
      await sb.auth.signOut();
      window.location.replace('/');
    });
  }

  // Mobile menu
  const overlay = document.getElementById('sidebar-overlay');
  function closeSidebar() { el.sidebar.classList.remove('open'); }
  if (el.mobileMenu) {
    el.mobileMenu.addEventListener('click', () => el.sidebar.classList.toggle('open'));
    if (overlay) overlay.addEventListener('click', closeSidebar);
    el.sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', closeSidebar);
    });
  }

  // Nav: "coming soon" items
  document.querySelectorAll('.nav-item.soon').forEach(item => {
    item.addEventListener('click', () => {
      const placeholder = document.getElementById('ws-placeholder');
      if (placeholder) placeholder.style.display = 'block';
    });
  });

  // Proxy health check — dynamic status dot
  async function checkProxyHealth() {
    const dot = document.querySelector('.side-status .dot');
    const label = document.querySelector('.side-status');
    if (!dot || !label) return;
    try {
      const r = await fetch(PROXY + '/v1/models', { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        dot.style.background = 'var(--green)';
        dot.style.boxShadow = '0 0 6px rgba(140,255,191,.4)';
        if (label.lastChild) label.lastChild.textContent = ' Proxy connected';
      } else {
        dot.style.background = 'var(--amber)';
        dot.style.boxShadow = '0 0 6px rgba(255,211,110,.4)';
        if (label.lastChild) label.lastChild.textContent = ' Proxy degraded';
      }
    } catch {
      dot.style.background = 'var(--red)';
      dot.style.boxShadow = '0 0 6px rgba(255,107,107,.4)';
      dot.style.animation = 'none';
      if (label.lastChild) label.lastChild.textContent = ' Proxy offline';
    }
  }

  // Listen for signed-out event from other tabs
  window.addEventListener('arcana:signed-out', () => {
    window.location.replace('/');
  });

  // Check session and init
  sb.auth.getSession().then(({ data }) => {
    if (!data.session) { window.location.replace('/auth'); return; }
    init(data.session);
  });

  // Listen for auth state changes
  sb.auth.onAuthStateChange((event, s) => {
    if (event === 'SIGNED_OUT') window.location.replace('/');
    if (event === 'TOKEN_REFRESHED' && s) init(s);
  });
})();
