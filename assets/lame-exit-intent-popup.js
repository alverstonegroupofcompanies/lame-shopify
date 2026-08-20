/**
 * LAMÉ exit-intent coupon popup
 * Shows capture form first; WELCOME10 (coupon) is revealed only after email submit.
 * Desktop: mouse moves into the upper half of the viewport.
 * Mobile: user scrolls upward (instead of down).
 * Soft fallback: after arm delay + fallback wait, show once if still eligible.
 */
(() => {
  const root = document.querySelector('[data-lame-exit-popup]');
  if (!root) return;

  const cfg = {
    delayMs: Number(root.dataset.delayMs || 8000),
    inactivityMs: Number(root.dataset.inactivityMs || 20000),
    fallbackMs: Number(root.dataset.fallbackMs || 18000),
    requireProductView: root.dataset.requireProductView === 'true',
    frequency: root.dataset.frequency || 'once_every_7_days',
    storageKey: root.dataset.storageKey || 'lame_exit_intent_v2',
    couponCode: root.dataset.couponCode || 'WELCOME10',
    contactUrl: root.dataset.contactUrl || window.location.pathname || '/',
  };

  const STORAGE = {
    dismissedAt: `${cfg.storageKey}:dismissed`,
    claimedAt: `${cfg.storageKey}:claimed`,
    subscribed: `${cfg.storageKey}:subscribed`,
    productViews: `${cfg.storageKey}:product_views`,
    purchased: `${cfg.storageKey}:purchased`,
    shownSession: `${cfg.storageKey}:shown_session`,
  };

  const form = root.querySelector('.lame-exit-popup__form');
  const capture = root.querySelector('[data-lame-exit-capture]');
  const success = root.querySelector('[data-lame-exit-success]');
  const errorEl = root.querySelector('[data-lame-exit-error]');
  const submitBtn = root.querySelector('[data-lame-exit-submit]');
  const codeEl = root.querySelector('[data-lame-exit-code]');
  const copyBtn = root.querySelector('[data-lame-exit-copy]');
  const copyNote = root.querySelector('[data-lame-exit-copy-note]');
  const closeButtons = root.querySelectorAll('[data-lame-exit-close]');

  let opened = false;
  let armed = false;
  let closedByUser = false;
  let fallbackTimer = null;
  let lastScrollY = window.scrollY || 0;
  let upwardScrollAccum = 0;
  let lastMouseY = null;
  let wasInLowerHalf = false;

  const now = () => Date.now();

  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      /* private mode */
    }
  };

  const readSession = (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (_) {
      return null;
    }
  };

  const writeSession = (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (_) {
      /* private mode */
    }
  };

  const markThankYouIfNeeded = () => {
    const path = window.location.pathname || '';
    if (/thank[_-]?you/i.test(path) || /checkouts\/.+\/thank/i.test(path)) {
      write(STORAGE.purchased, String(now()));
    }
  };

  const trackProductView = () => {
    if (root.dataset.template !== 'product') return;
    const current = Number(read(STORAGE.productViews) || 0);
    write(STORAGE.productViews, String(current + 1));
  };

  const frequencyAllows = () => {
    if (read(STORAGE.claimedAt) || read(STORAGE.subscribed)) return false;
    if (read(STORAGE.purchased)) return false;

    if (cfg.frequency === 'once_forever' && read(STORAGE.dismissedAt)) return false;
    if (cfg.frequency === 'once_per_session' && readSession(STORAGE.shownSession)) return false;

    const dismissedAt = Number(read(STORAGE.dismissedAt) || 0);
    if (!dismissedAt) return true;

    const day = 24 * 60 * 60 * 1000;
    if (cfg.frequency === 'once_per_day') return now() - dismissedAt >= day;
    if (cfg.frequency === 'once_every_7_days') return now() - dismissedAt >= 7 * day;
    return true;
  };

  const canShow = () => {
    if (opened || closedByUser || !armed) return false;
    if (document.body.classList.contains('lame-exit-popup-open')) return false;
    if (cfg.requireProductView && Number(read(STORAGE.productViews) || 0) < 1) return false;
    return frequencyAllows();
  };

  const lockScroll = (lock) => {
    document.documentElement.classList.toggle('lame-exit-popup-open', lock);
    document.body.classList.toggle('lame-exit-popup-open', lock);
  };

  const open = () => {
    if (!canShow()) return;
    opened = true;
    writeSession(STORAGE.shownSession, '1');
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    root.classList.add('is-open');
    lockScroll(true);
    // Always start on email capture — coupon only after submit
    if (capture) capture.hidden = false;
    if (success) success.hidden = true;
    window.requestAnimationFrame(() => {
      const focusable = root.querySelector('input[type="email"], [data-lame-exit-close]');
      focusable?.focus?.({ preventScroll: true });
    });
  };

  const close = ({ persist = true } = {}) => {
    opened = false;
    closedByUser = true;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    window.setTimeout(() => {
      if (!root.classList.contains('is-open')) root.hidden = true;
    }, 280);
    if (persist) write(STORAGE.dismissedAt, String(now()));
    teardownTriggers();
  };

  const showSuccess = () => {
    write(STORAGE.subscribed, '1');
    write(STORAGE.claimedAt, String(now()));
    if (capture) capture.hidden = true;
    if (success) success.hidden = false;
    if (codeEl) codeEl.textContent = cfg.couponCode || 'WELCOME10';
    success?.querySelector('h2, [data-lame-exit-success-heading]')?.focus?.({ preventScroll: true });
  };

  const setError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message || '';
    errorEl.hidden = !message;
  };

  const isTouchish = () =>
    window.matchMedia('(hover: none), (pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  const midY = () => Math.max(window.innerHeight || 0, 1) * 0.5;

  /**
   * Desktop: pointer moved into the upper half of the screen
   * (must have been in the lower half first, then moved up / into top half).
   */
  const onMouseMove = (event) => {
    if (!armed || isTouchish()) return;
    if (typeof event.clientY !== 'number') return;

    const half = midY();
    const y = event.clientY;
    const movingUp = lastMouseY != null && y < lastMouseY - 2;
    lastMouseY = y;

    if (y >= half) {
      wasInLowerHalf = true;
      return;
    }

    // In upper half: trigger when crossing from below, or moving further up while above half
    if (wasInLowerHalf || movingUp) {
      open();
    }
  };

  /**
   * Mobile: any clear upward scroll (finger/content moving toward top of page).
   */
  const onScroll = () => {
    if (!armed || !isTouchish()) {
      lastScrollY = window.scrollY || 0;
      return;
    }

    const y = window.scrollY || 0;
    const dy = lastScrollY - y; // positive = scrolled up
    lastScrollY = y;

    if (dy > 0) {
      upwardScrollAccum += dy;
    } else if (dy < -8) {
      // Reset streak when user scrolls down again
      upwardScrollAccum = 0;
    }

    // ~80px of upward travel in one streak is enough to feel intentional
    if (upwardScrollAccum >= 80) open();
  };

  let triggersBound = false;

  const bindTriggers = () => {
    if (triggersBound) return;
    triggersBound = true;
    lastScrollY = window.scrollY || 0;
    upwardScrollAccum = 0;
    lastMouseY = null;
    wasInLowerHalf = false;

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    // Soft fallback so the popup still appears if exit signals never fire
    window.clearTimeout(fallbackTimer);
    fallbackTimer = window.setTimeout(() => open(), Math.max(0, cfg.fallbackMs));
  };

  const teardownTriggers = () => {
    document.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('scroll', onScroll);
    window.clearTimeout(fallbackTimer);
    triggersBound = false;
  };

  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => close({ persist: true }));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && opened) close({ persist: true });
  });

  copyBtn?.addEventListener('click', async () => {
    const code = cfg.couponCode || codeEl?.textContent?.trim() || 'WELCOME10';
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      if (copyNote) copyNote.textContent = copyBtn.dataset.copiedLabel || 'Copied!';
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(codeEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      if (copyNote) copyNote.textContent = copyBtn.dataset.copyFallback || 'Select and copy the code';
    }
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput?.value?.trim();
    if (!email) {
      setError('Please enter your email.');
      emailInput?.focus();
      return;
    }

    const formData = new FormData(form);
    if (!formData.get('form_type')) formData.set('form_type', 'customer');
    if (!formData.get('utf8')) formData.set('utf8', '✓');

    const originalLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = submitBtn.dataset.loadingLabel || 'Saving…';
    }

    try {
      const action = form.getAttribute('action') || cfg.contactUrl || window.location.pathname;
      const response = await fetch(action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });

      // Shopify may return 200 HTML or a redirect; treat non-4xx as email accepted
      if (response.status >= 400) {
        throw new Error('subscribe_failed');
      }
      // Reveal WELCOME10 only after email is successfully sent
      showSuccess();
    } catch (_) {
      setError('Could not save your email. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel || '';
      }
    }
  });

  // Init
  markThankYouIfNeeded();
  trackProductView();

  if (root.dataset.startSuccess === 'true') {
    showSuccess();
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    root.classList.add('is-open');
    opened = true;
    lockScroll(true);
    writeSession(STORAGE.shownSession, '1');
    return;
  }

  if (!frequencyAllows()) return;

  window.setTimeout(() => {
    armed = true;
    bindTriggers();
  }, Math.max(0, cfg.delayMs));
})();
