// ARCANA — Homepage enhancements (vanilla JS)

function onReady(fn) {
  if (document.readyState !== 'loading') { fn(); }
  else { document.addEventListener('DOMContentLoaded', fn); }
}

// ── Site Theme Toggle (Home page) ──
function setupSiteThemeToggle() {
  const desktopToggle = document.getElementById('site-theme-toggle');
  const mobileToggle = document.getElementById('mobile-theme-toggle');
  const STORAGE_KEY = 'arcana-site-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return prefersDark.matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isLight = theme === 'light';
    if (isLight) {
      document.documentElement.classList.add('site-light');
    } else {
      document.documentElement.classList.remove('site-light');
    }
    // Sync labels on both buttons
    const label = isLight ? 'dark' : 'light';
    if (desktopToggle) desktopToggle.setAttribute('aria-label', `Switch to ${label} mode`);
    if (mobileToggle) {
      const labelEl = mobileToggle.querySelector('.mobile-theme-label');
      if (labelEl) labelEl.textContent = `Switch to ${label} mode`;
    }
  }

  // Initialize theme (FOUC prevention script already ran, but sync button state)
  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  // Toggle handler
  function toggleTheme() {
    const isLight = document.documentElement.classList.contains('site-light');
    const newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }

  // Desktop toggle click
  if (desktopToggle) desktopToggle.addEventListener('click', toggleTheme);
  // Mobile toggle click
  if (mobileToggle) mobileToggle.addEventListener('click', toggleTheme);

  // Follow system changes if no manual preference
  prefersDark.addEventListener('change', () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(prefersDark.matches ? 'dark' : 'light');
    }
  });
}

// ── Mobile Menu ──
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-overlay');
  if (!hamburger || !menu || !overlay) return;

  let isOpen = false;

  function toggleMenu() {
    isOpen = !isOpen;
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    menu.classList.toggle('active', isOpen);
    overlay.classList.toggle('active', isOpen);
    overlay.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    menu.classList.remove('active');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);

  // Close on menu link click
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  // Close on resize to desktop
  const mq = window.matchMedia('(min-width:861px)');
  mq.addEventListener('change', e => { if (e.matches) closeMenu(); });
}

// ── Scroll Reveal ──
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

// ── Stats Counter Animation ──
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat strong[data-count]');
  if (!stats.length) return;

  const animated = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated.has(entry.target)) {
        animated.add(entry.target);
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  if (isNaN(target)) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = target;
    return;
  }

  const duration = 900;
  const start = performance.now();
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(easeOutQuart(progress) * target);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── Code Copy + Toast ──
let toastTimeout = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  // Build DOM safely — no innerHTML with user text
  toast.textContent = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20 6L9 17l-5-5');
  svg.appendChild(path);
  toast.appendChild(svg);
  toast.appendChild(document.createTextNode(message));
  clearTimeout(toastTimeout);
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

// SVG icon constants (static, safe for innerHTML)
var ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

function initCodeCopy() {
  const codeBlocks = document.querySelectorAll('.code, code.language-bash, code.language-sh');
  codeBlocks.forEach(block => {
    const wrapper = block.closest('pre') || block;

    const btn = document.createElement('button');
    btn.className = 'code-copy';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = ICON_COPY + '<span>Copy</span>';

    btn.addEventListener('click', async () => {
      // Clone wrapper, remove the copy button from the clone so textContent excludes it
      const clone = wrapper.cloneNode(true);
      clone.querySelectorAll('.code-copy').forEach(el => el.remove());
      const text = clone.textContent.trim();
      try {
        // Try modern Clipboard API first, fall back to textarea execCommand
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          if (!ok) throw new Error('execCommand copy failed');
        }
        btn.classList.add('copied');
        btn.innerHTML = ICON_CHECK + '<span>Copied!</span>';
        showToast('Code copied to clipboard');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = ICON_COPY + '<span>Copy</span>';
        }, 2000);
      } catch (err) {
        showToast('Failed to copy');
      }
    });

    wrapper.appendChild(btn);
  });
}

// ── Logo Probe: auto-detect logo color and apply correct filter ──
function initLogoProbe() {
  const logo = document.querySelector('.brand .mark');
  if (!logo) return;

  const STORAGE_KEY = 'arcana-logo-color:' + logo.getAttribute('src');

  function applyLogoFilter(isDark) {
    document.documentElement.classList.toggle('logo-is-dark', isDark);
    const style = document.createElement('style');
    const darkInvert = isDark
      ? '.logo-is-dark .mark{filter:invert(1)}.logo-is-dark .brand:hover .mark{filter:invert(1) drop-shadow(0 0 8px rgba(179,140,255,.5))}'
      : '';
    const lightInvert = isDark
      ? ''
      : '.site-light .mark{filter:invert(1)}.site-light .brand:hover .mark{filter:invert(1) drop-shadow(0 0 6px rgba(139,79,212,.4))}';
    style.textContent = darkInvert + lightInvert;
    document.head.appendChild(style);
  }

  // Check cache first
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached === 'dark' || cached === 'light') {
    applyLogoFilter(cached === 'dark');
    return;
  }

  // Cache miss — sample logo pixels
  function probe() {
    if (!logo.complete || logo.naturalWidth === 0) return;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = logo.naturalWidth;
      canvas.height = logo.naturalHeight;
      ctx.drawImage(logo, 0, 0);
      const w = canvas.width;
      const h = canvas.height;
      const step = Math.max(1, Math.floor(Math.min(w, h) / 8));
      const data = ctx.getImageData(0, 0, w, h).data;
      let totalBrightness = 0;
      let opaquePixels = 0;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4;
          if (data[i + 3] > 128) {
            totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            opaquePixels++;
          }
        }
      }
      if (opaquePixels === 0) return;
      const avgBrightness = totalBrightness / opaquePixels;
      const isDark = avgBrightness < 128;
      try { localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light'); } catch (e) {}
      applyLogoFilter(isDark);
    } catch (e) { /* cross-origin or canvas failure — leave default */ }
  }

  if (logo.complete) probe();
  else logo.addEventListener('load', probe);
}

// ── Hero Parallax ──
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const content = hero.querySelector('.slash, h1, .lead, .actions, .hero-meta');
  if (!content) return;

  let ticking = false;
  const maxScroll = Math.min(hero.offsetHeight || 600, 700);
  const strength = 0.35;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY > maxScroll) {
          content.style.transform = '';
          content.style.opacity = '';
        } else {
          const offset = scrollY * strength;
          content.style.transform = `translateY(${offset}px)`;
          content.style.opacity = 1 - (scrollY / maxScroll) * 0.4;
        }
        ticking = false;
      });  ticking = true;
    }
  }, { passive: true });
}

// ── Keyboard Shortcuts ──
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (!isMeta) return;
    // Skip if user is typing in an input/textarea/contentEditable
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

    // Cmd/Ctrl + K → focus docs search (if present)
    if (e.key === 'k') {
      const searchInput = document.getElementById('docs-search-input');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    }

    // Cmd/Ctrl + Up → scroll to top
    if (e.key === 'ArrowUp' || e.key === 'Up') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// ── Back to Top ──
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.scrollY > 400);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Session-aware nav ──
function updateNavSession() {
  const sb = window.__ARCANA_SB__;
  if (!sb) return;
  sb.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      // Authenticated users: redirect to workspace, not landing page
      if (window.location.pathname === '/' || window.location.pathname === '') {
        window.location.replace('/workspace');
        return;
      }
      showSignedIn(session);
    }
  });
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        window.location.replace('/workspace');
        return;
      }
      showSignedIn(session);
    } else if (event === 'SIGNED_OUT') showSignedOut();
  });
}

function showSignedIn(session) {
  const email = session.user.email || '';
  const shortEmail = email.length > 24 ? email.slice(0, 22) + '…' : email;
  document.querySelectorAll('a[href="/auth"]').forEach(a => {
    a.textContent = shortEmail;
    a.href = '/workspace';
    a.className = a.classList.contains('mobile-cta') ? 'mobile-cta signed-in' : 'signin signed-in';
    a.title = 'Signed in as ' + email;
  });
}

function showSignedOut() {
  document.querySelectorAll('a.signed-in').forEach(a => {
    a.textContent = 'Sign In';
    a.href = '/auth';
    a.className = a.classList.contains('mobile-cta') ? 'mobile-cta' : 'signin';
    a.removeAttribute('title');
  });
}

onReady(() => {
  setupSiteThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initStatsCounter();
  initCodeCopy();
  initHeroParallax();
  initBackToTop();
  initKeyboardShortcuts();
  updateNavSession();
  initLogoProbe();

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
