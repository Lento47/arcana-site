// ARCANA — Homepage enhancements (vanilla JS)

document.addEventListener('DOMContentLoaded', () => {
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
