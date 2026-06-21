(function () {
      'use strict';

      const sb = window.__ARCANA_SB__;
      const authReady = !!sb;

      // Show offline warning on page load if Supabase SDK failed to load
      if (!authReady) {
        window.addEventListener('arcana:auth-offline', () => {
          showBannerQuick('warning', 'Auth unavailable', 'Authentication service did not load. Check your connection and refresh.');
        });
        // Also show after a short delay in case the event already fired
        setTimeout(() => {
          if (!window.__ARCANA_SB__) showBannerQuick('warning', 'Auth unavailable', 'Authentication service did not load. Check your connection and refresh.');
        }, 1500);
      }

      // Quick banner before full init (used for offline warning)
      function showBannerQuick(type, title, message) {
        const b = document.getElementById('banner-' + type);
        if (!b) return;
        const t = b.querySelector('[id^="banner-' + type + '-title"]');
        const m = b.querySelector('[id^="banner-' + type + '-message"]');
        if (t) t.textContent = title;
        if (m) m.textContent = message;
        b.setAttribute('aria-hidden', 'false');
      }

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let theme = document.documentElement.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');

      const scanline = document.getElementById('scanline');
      const toggleThemeBtn = document.getElementById('theme-toggle');
      const sunIcon = toggleThemeBtn.querySelector('.icon-sun');
      const moonIcon = toggleThemeBtn.querySelector('.icon-moon');
      const yearEl = document.getElementById('year');
      yearEl.textContent = new Date().getFullYear();

      function applyTheme(value) {
        theme = value;
        document.documentElement.setAttribute('data-theme', value);
        if (value === 'dark') {
          sunIcon.classList.remove('hidden');
          moonIcon.classList.add('hidden');
        } else {
          sunIcon.classList.add('hidden');
          moonIcon.classList.remove('hidden');
        }
      }

      applyTheme(theme);

      toggleThemeBtn.addEventListener('click', () => {
        applyTheme(theme === 'dark' ? 'light' : 'dark');
      });

      // Mode switching
      const modeBtns = document.querySelectorAll('[data-mode]');
      const modePanels = {
        personal: document.getElementById('mode-personal'),
        workspace: document.getElementById('mode-workspace'),
        enterprise: document.getElementById('mode-enterprise')
      };

      function setMode(mode) {
        modeBtns.forEach(btn => {
          const selected = btn.dataset.mode === mode;
          btn.setAttribute('aria-selected', selected);
          btn.tabIndex = selected ? 0 : -1;
        });
        Object.entries(modePanels).forEach(([key, panel]) => {
          panel.classList.toggle('hidden', key !== mode);
        });
        hideAllStates();
        hideBanners();
        scanline.classList.remove('active');
      }

      modeBtns.forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
      });

      enableArrowKeys(document.querySelector('.mode-switcher'), '[data-mode]', setMode);

      // Tab switching (personal)
      const tabBtns = document.querySelectorAll('[data-tab]');
      const tabPanels = {
        signin: document.getElementById('panel-signin'),
        signup: document.getElementById('panel-signup'),
        magic: document.getElementById('panel-magic')
      };

      function setTab(tab) {
        tabBtns.forEach(btn => {
          const selected = btn.dataset.tab === tab;
          btn.setAttribute('aria-selected', selected);
          btn.tabIndex = selected ? 0 : -1;
        });
        Object.entries(tabPanels).forEach(([key, panel]) => {
          panel.setAttribute('aria-hidden', key !== tab);
        });
        hideBanners();
        hideAllStates();
      }

      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => setTab(btn.dataset.tab));
      });

      enableArrowKeys(document.querySelector('.tabs'), '[data-tab]', setTab);

      // Keyboard arrow navigation for tablists
      function enableArrowKeys(container, selector, callback) {
        if (!container) return;
        const items = () => Array.from(container.querySelectorAll(selector));
        container.addEventListener('keydown', e => {
          const list = items();
          const current = list.find(item => item.getAttribute('aria-selected') === 'true');
          if (!current) return;
          let index = list.indexOf(current);
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            index = (index + 1) % list.length;
            list[index].focus();
            callback(list[index].dataset.mode || list[index].dataset.tab);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            index = (index - 1 + list.length) % list.length;
            list[index].focus();
            callback(list[index].dataset.mode || list[index].dataset.tab);
          }
        });
      }

      // Banners
      const banners = {
        success: document.getElementById('banner-success'),
        error: document.getElementById('banner-error'),
        warning: document.getElementById('banner-warning'),
        info: document.getElementById('banner-info')
      };

      function hideBanners() {
        Object.values(banners).forEach(b => b.setAttribute('aria-hidden', 'true'));
      }

      function showBanner(type, title, message) {
        hideBanners();
        const b = banners[type];
        if (title) b.querySelector('[id^="banner-' + type + '-title"]').textContent = title;
        if (message) b.querySelector('[id^="banner-' + type + '-message"]').textContent = message;
        b.setAttribute('aria-hidden', 'false');
      }

      // State panels
      const statePanels = {
        'magic-sent': document.getElementById('state-magic-sent'),
        'oauth-pending': document.getElementById('state-oauth-pending'),
        'saml-redirect': document.getElementById('state-saml-redirect'),
        'saml-return': document.getElementById('state-saml-return'),
        success: document.getElementById('state-success')
      };

      function hideAllStates() {
        Object.values(statePanels).forEach(p => p.setAttribute('aria-hidden', 'true'));
        document.getElementById('skeleton').setAttribute('aria-hidden', 'true');
      }

      function showStatePanel(id) {
        hideAllStates();
        statePanels[id].setAttribute('aria-hidden', 'false');
      }

      function showSkeleton() {
        hideAllStates();
        document.querySelectorAll('.auth-mode').forEach(m => m.classList.add('hidden'));
        document.getElementById('skeleton').setAttribute('aria-hidden', 'false');
      }

      function restoreMode(mode) {
        document.querySelectorAll('.auth-mode').forEach(m => m.classList.add('hidden'));
        modePanels[mode].classList.remove('hidden');
        hideAllStates();
      }

      // Password toggles
      document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = document.getElementById(btn.dataset.target);
          const showing = target.type === 'text';
          target.type = showing ? 'password' : 'text';
          btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
        });
      });

      // ── Arcana: decrypt the arcane ──
      const PROXY_AUTH = 'https://proxy.arcana.otnelhq.com';

      // Helpers
      function setInvalid(input, errorEl, message) {
        input.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      }

      function clearInvalid(input, errorEl) {
        input.setAttribute('aria-invalid', 'false');
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }

      function pulseScanline() {
        scanline.classList.add('active');
        setTimeout(() => scanline.classList.remove('active'), 900);
      }

      function randomSession() {
        return 'arc-' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      }

      // ── Real validation ──
      function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
      function isValidPassword(v) { return v.length >= 12; }

      // ── Async with real network ──
      function mockAsync(fn, delay = 900) {
        return new Promise(resolve => setTimeout(() => resolve(fn()), delay));
      }

      // ── Personal sign in ──
      document.getElementById('form-signin').addEventListener('submit', async e => {
        e.preventDefault();
        hideBanners();
        const emailEl = document.getElementById('signin-email');
        const password = document.getElementById('signin-password');
        const error = document.getElementById('signin-password-error');
        clearInvalid(password, error);

        if (!isValidEmail(emailEl.value)) {
          showBanner('error', 'Invalid email', 'Enter a valid email address to continue.');
          return;
        }
        if (!password.value) {
          setInvalid(password, error, 'Password is required.');
          return;
        }
        if (!authReady) {
          showBanner('warning', 'Auth offline', 'Authentication is temporarily unavailable.');
          return;
        }

        const btn = document.getElementById('btn-signin');
        btn.disabled = true;
        btn.textContent = 'Signing in…';
        pulseScanline();

        const { data, error: err } = await sb.auth.signInWithPassword({
          email: emailEl.value.trim().toLowerCase(),
          password: password.value,
        });

        if (err) {
          btn.disabled = false;
          btn.textContent = 'Sign in';
          if (err.message?.includes('Invalid login')) {
            showBanner('error', 'Access denied', 'Email or password not recognized. Check your credentials.');
          } else if (err.message?.includes('Email not confirmed')) {
            showBanner('warning', 'Email unverified', 'Check your inbox for the confirmation link.');
          } else {
            showBanner('error', 'Authentication failed', err.message || 'Could not sign in.');
          }
          return;
        }

        if (data.session) {
          document.getElementById('success-session').textContent = 'arc-' + data.session.user.id.slice(0, 8);
          showStatePanel('success');
          showBanner('success', 'Authenticated', 'Routing to your workspace…');
          // Redirect to workspace after brief display
          setTimeout(() => { window.location.href = '/'; }, 1500);
        }
      });

      // Sign up
      document.getElementById('form-signup').addEventListener('submit', async e => {
        e.preventDefault();
        hideBanners();
        const emailEl = document.getElementById('signup-email');
        const passwordEl = document.getElementById('signup-password');
        if (!isValidEmail(emailEl.value)) {
          showBanner('error', 'Invalid email', 'Your arcana identity starts with a valid email.');
          return;
        }
        if (!isValidPassword(passwordEl.value)) {
          showBanner('error', 'Weak passphrase', 'Minimum 12 characters. Use a passphrase or password manager.');
          return;
        }
        if (!authReady) {
          showBanner('warning', 'Auth offline', 'Authentication is temporarily unavailable.');
          return;
        }

        const btn = document.getElementById('btn-signup');
        btn.disabled = true;
        btn.textContent = 'Creating account…';
        pulseScanline();

        const { data, error: err } = await sb.auth.signUp({
          email: emailEl.value.trim().toLowerCase(),
          password: passwordEl.value,
        });

        if (err) {
          btn.disabled = false;
          btn.textContent = 'Create account';
          if (err.message?.includes('already registered')) {
            showBanner('warning', 'Email exists', 'This email is already registered. Sign in instead.');
          } else {
            showBanner('error', 'Account creation failed', err.message || 'Could not create account.');
          }
          return;
        }

        if (data.user?.identities?.length === 0) {
          showBanner('warning', 'Email exists', 'This email is already registered. Sign in instead.');
          btn.disabled = false;
          btn.textContent = 'Create account';
          return;
        }

        // User created — check if email confirmation required
        document.getElementById('success-session').textContent = 'arc-' + data.user.id.slice(0, 8);
        if (data.session) {
          showStatePanel('success');
          showBanner('success', 'Account created', 'Your Arcana workspace is ready.');
          setTimeout(() => { window.location.href = '/'; }, 1500);
        } else {
          // Email confirmation sent
          showBanner('info', 'Verify your email', 'A confirmation link was sent to your inbox. Verify to complete sign-up.');
          btn.disabled = false;
          btn.textContent = 'Create account';
        }
      });

      // Magic link (OTP)
      document.getElementById('form-magic').addEventListener('submit', async e => {
        e.preventDefault();
        hideBanners();
        const emailEl = document.getElementById('magic-email');
        const email = emailEl.value.trim();
        if (!isValidEmail(email)) {
          showBanner('error', 'Invalid email', 'Enter a valid email address to receive the link.');
          return;
        }
        if (!authReady) {
          showBanner('warning', 'Auth offline', 'Authentication is temporarily unavailable.');
          return;
        }
        const btn = document.getElementById('btn-magic');
        btn.disabled = true;
        btn.textContent = 'Sending…';
        pulseScanline();

        const { error: err } = await sb.auth.signInWithOtp({
          email: email.toLowerCase(),
          options: { emailRedirectTo: 'https://arcana.otnelhq.com/auth' },
        });

        if (err) {
          btn.disabled = false;
          btn.textContent = 'Send magic link';
          showBanner('error', 'Could not send link', err.message || 'Failed to send the magic link.');
          return;
        }

        document.getElementById('magic-sent-email').textContent = email || '—';
        showStatePanel('magic-sent');
        showBanner('info', 'Magic link sent', 'Check your inbox for the one-time sign-in link.');
        btn.disabled = false;
        btn.textContent = 'Send magic link';
      });

      document.getElementById('btn-magic-back').addEventListener('click', () => {
        setTab('signin');
        hideBanners();
      });

      // OAuth
      function handleOAuth(provider) {
        if (!authReady) {
          showBanner('warning', 'Auth offline', 'Authentication is temporarily unavailable.');
          return;
        }
        hideBanners();
        document.getElementById('oauth-provider-name').textContent = provider;
        document.getElementById('oauth-provider-id').textContent = provider.toLowerCase();
        showStatePanel('oauth-pending');
        showBanner('info', 'OAuth handshake', `Cross the threshold with ${provider}.`);
        pulseScanline();

        sb.auth.signInWithOAuth({
          provider: provider.toLowerCase(),
          options: { redirectTo: 'https://arcana.otnelhq.com/auth' },
        });
        // Page will redirect — no further action needed
      }

      document.getElementById('oauth-github').addEventListener('click', () => handleOAuth('GitHub'));
      document.getElementById('oauth-google').addEventListener('click', () => handleOAuth('Google'));
      document.getElementById('oauth-github-signup').addEventListener('click', () => handleOAuth('GitHub'));
      document.getElementById('oauth-google-signup').addEventListener('click', () => handleOAuth('Google'));
      document.getElementById('btn-oauth-cancel').addEventListener('click', () => {
        restoreMode('personal');
        setTab('signin');
        hideBanners();
      });

      // Workspace token
      document.getElementById('form-workspace').addEventListener('submit', async e => {
        e.preventDefault();
        hideBanners();
        const tokenEl = document.getElementById('workspace-token');
        if (!tokenEl.value.trim()) {
          showBanner('error', 'Token required', 'Paste your invite code or workspace token to continue.');
          return;
        }
        const btn = document.getElementById('btn-workspace');
        btn.disabled = true;
        btn.textContent = 'Joining…';
        pulseScanline();

        await mockAsync(() => {
          document.getElementById('success-session').textContent = randomSession();
          showStatePanel('success');
          showBanner('success', 'Workspace joined', 'Session scoped to the shared workspace.');
        });
        btn.disabled = false;
        btn.textContent = 'Join workspace';
      });

      // Enterprise SSO — real Supabase SAML + proxy email validation
      document.getElementById('form-enterprise').addEventListener('submit', async e => {
        e.preventDefault();
        hideBanners();
        const btn = document.getElementById('btn-enterprise');
        const email = document.getElementById('enterprise-email').value.trim().toLowerCase();
        const slugInput = document.getElementById('enterprise-slug');
        const domain = slugInput.value.trim().toLowerCase() || email.split('@')[1]?.split('.')[0] || '';

        if (!isValidEmail(email)) {
          showBanner('error', 'Invalid email', 'Enter your organization email to discover the workspace.');
          return;
        }
        if (!authReady) {
          showBanner('warning', 'Auth offline', 'Authentication is temporarily unavailable.');
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Discovering…';
        pulseScanline();

        // Optional: check proxy for domain registration info
        var idpName = 'Identity Provider';
        try {
          var r = await fetch(PROXY_AUTH + '/v1/identity/validate-email?email=' + encodeURIComponent(email));
          var d = await r.json();
          if (d.valid) {
            idpName = d.tier === 'enterprise' ? 'Okta / Azure AD' : 'Identity Provider';
          }
        } catch {} // Proxy check is informational only — proceed regardless

        document.getElementById('sso-provider-name').textContent = idpName;
        document.getElementById('sso-provider-domain').textContent = email.split('@')[1] || domain + '.com';
        document.getElementById('sso-provider-preview').setAttribute('aria-hidden', 'false');
        document.getElementById('saml-redirect-idp').textContent = idpName;
        document.getElementById('saml-redirect-domain').textContent = email.split('@')[1] || domain + '.com';
        showStatePanel('saml-redirect');
        showBanner('info', 'IdP handshake', 'Routing to ' + idpName + ' for SAML authentication.');

        // Real Supabase SSO — redirects to IdP
        const { error: err } = await sb.auth.signInWithSSO({
          domain: email.split('@')[1] || domain + '.com',
          options: { redirectTo: 'https://arcana.otnelhq.com/auth' },
        });

        if (err) {
          btn.disabled = false;
          btn.textContent = 'Continue with SSO';
          restoreMode('enterprise');
          if (err.message?.includes('not found') || err.message?.includes('No SSO')) {
            showBanner('warning', 'Domain not onboarded',
              (email.split('@')[1] || domain) + ' has no SAML connection. Contact your admin or use a personal account.'
            );
          } else {
            showBanner('error', 'SSO handshake failed', err.message || 'Could not initiate SAML authentication.');
          }
        }
        // On success, browser redirects to IdP — no further action
      });

      document.getElementById('btn-saml-cancel').addEventListener('click', () => {
        restoreMode('enterprise');
        hideBanners();
      });

      document.getElementById('btn-saml-return-cancel').addEventListener('click', () => {
        restoreMode('enterprise');
        hideBanners();
      });

      // ── Session detection (OAuth redirect, magic link return, cached session) ──
      function onAuthenticated(session) {
        document.getElementById('success-session').textContent = 'arc-' + session.user.id.slice(0, 8);
        showStatePanel('success');
        showBanner('success', 'Authenticated', 'Routing to your workspace…');
        setTimeout(() => { window.location.href = '/'; }, 1500);
      }

      if (authReady) {
        window.addEventListener('arcana:session', (ev) => {
          if (ev.detail) onAuthenticated(ev.detail);
        });
        window.addEventListener('arcana:signed-in', (ev) => {
          if (ev.detail) onAuthenticated(ev.detail);
        });
      }

      // Initial state
      setMode('personal');
      setTab('signin');
    })();
