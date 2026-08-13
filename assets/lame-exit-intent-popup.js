/**
 * LAMÉ exit-intent coupon popup
 * Desktop: mouse toward top edge. Mobile: inactivity, rapid upward scroll, page hide.
 */
(() => {
  const root = document.querySelector('[data-lame-exit-popup]');
  if (!root) return;

  const cfg = {
    delayMs: Number(root.dataset.delayMs || 10000),
    inactivityMs: Number(root.dataset.inactivityMs || 25000),
    requireProductView: root.dataset.requireProductView === 'true',
    frequency: root.dataset.frequency || 'once_every_7_days',
    storageKey: root.dataset.storageKey || 'lame_exit_intent_v1',
    couponCode: root.dataset.couponCode || '',
    contactUrl: root.dataset.contactUrl || '/contact',
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
  let inactivityTimer = null;
  let lastScrollY = window.scrollY;
  let lastScrollTs = Date.now();

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
    if (codeEl && cfg.couponCode) codeEl.textContent = cfg.couponCode;
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

  const onMouseOut = (event) => {
    if (!event) return;
    if (event.relatedTarget || event.toElement) return;
    if (event.clientY > 24) return;
    open();
  };

  const resetInactivity = () => {
    if (!isTouchish()) return;
    window.clearTimeout(inactivityTimer);
    inactivityTimer = window.setTimeout(() => open(), cfg.inactivityMs);
  };

  const onScroll = () => {
    if (!isTouchish()) return;
    const y = window.scrollY;
    const ts = Date.now();
    const dy = lastScrollY - y;
    const dt = Math.max(ts - lastScrollTs, 1);
    const velocity = dy / dt;
    lastScrollY = y;
    lastScrollTs = ts;
    // Rapid upward scroll near top of page
    if (y < 120 && dy > 80 && velocity > 0.9) open();
    resetInactivity();
  };

  const onVisibility = () => {
    // Soft mobile exit signal — limited to cart to avoid tab-switch annoyance
    if (
      document.visibilityState === 'hidden' &&
      isTouchish() &&
      root.dataset.template === 'cart'
    ) {
      open();
    }
  };

  const onPageShow = (event) => {
    // Back-forward cache / back navigation heuristic on mobile
    if (event.persisted && isTouchish()) open();
  };

  let triggersBound = false;

  const bindTriggers = () => {
    if (triggersBound) return;
    triggersBound = true;
    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    ['pointerdown', 'keydown', 'touchstart'].forEach((type) => {
      document.addEventListener(type, resetInactivity, { passive: true });
    });
    resetInactivity();
  };

  const teardownTriggers = () => {
    document.removeEventListener('mouseout', onMouseOut);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pageshow', onPageShow);
    window.clearTimeout(inactivityTimer);
    triggersBound = false;
  };

  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => close({ persist: true }));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && opened) close({ persist: true });
  });

  copyBtn?.addEventListener('click', async () => {
    const code = cfg.couponCode || codeEl?.textContent?.trim() || '';
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
      const response = await fetch(cfg.contactUrl, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });

      // Shopify customer forms usually redirect; fetch follows same-origin redirects.
      if (response.status >= 400) {
        throw new Error('subscribe_failed');
      }
      showSuccess();
    } catch (_) {
      // Native fallback if fetch is blocked: allow a normal form post.
      form.submit();
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
