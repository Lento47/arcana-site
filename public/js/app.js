// ARCANA — Homepage enhancements (vanilla JS)

function onReady(fn) {
  if (document.readyState !== 'loading') { fn(); }
  else { document.addEventListener('DOMContentLoaded', fn); }
}

// ── Session-aware nav ──
function updateNavSession() {
  const sb = window.__ARCANA_SB__;
  if (!sb) return;
  sb.auth.getSession().then(({ data: { session } }) => {
    if (session) showSignedIn(session);
  });
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) showSignedIn(session);
    else if (event === 'SIGNED_OUT') showSignedOut();
  });
}

function showSignedIn(session) {
  const email = session.user.email || '';
  const shortEmail = email.length > 24 ? email.slice(0, 22) + '…' : email;
  document.querySelectorAll('a[href="/auth"]').forEach(a => {
    a.textContent = shortEmail;
    a.href = '#';
    a.className = 'signin signed-in';
    a.title = 'Signed in as ' + email;
  });
}

function showSignedOut() {
  document.querySelectorAll('a.signed-in').forEach(a => {
    a.textContent = 'Sign In';
    a.href = '/auth';
    a.className = 'signin';
    a.removeAttribute('title');
  });
}

onReady(() => {
  updateNavSession();
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Pro subscription button
  const subscribeBtn = document.getElementById('subscribe-pro');
  if (subscribeBtn) {
    subscribeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const originalText = subscribeBtn.textContent;
      subscribeBtn.textContent = 'Redirecting...';
      subscribeBtn.style.opacity = '0.5';
      try {
        const r = await fetch('/api/create-sub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'pro_monthly' })
        });
        const d = await r.json();
        if (d.approvalUrl) {
          window.location.href = d.approvalUrl;
          return;
        }
        alert('Failed to create subscription: ' + (d.error || 'unknown'));
      } catch (err) {
        alert('Network error: ' + err.message);
      }
      subscribeBtn.textContent = originalText;
      subscribeBtn.style.opacity = '';
    });
  }
});
