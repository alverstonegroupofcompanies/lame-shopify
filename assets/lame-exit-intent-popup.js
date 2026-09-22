/**
 * LAMÉ welcome coupon popup
 * Shows capture form first; coupon is revealed only after email submit.
 * Trigger: no mouse / scroll / touch / keyboard activity for ~10s.
 * Frequency: once per browser (guests) or once per signed-in customer.
 * Never again after claim, code use, or dismiss (once_forever).
 */
(() => {
  const root = document.querySelector('[data-lame-exit-popup]');
  if (!root) return;

  const customerId = (root.dataset.customerId || '').trim();
  const baseKey = root.dataset.storageKey || 'lame_exit_intent_welcome';
  const storageKey = customerId ? `${baseKey}_c_${customerId}` : `${baseKey}_guest`;

  const cfg = {
    delayMs: Number(root.dataset.delayMs || 0),
    inactivityMs: Number(root.dataset.inactivityMs || 10000),
    requireProductView: root.dataset.requireProductView === 'true',
    frequency: root.dataset.frequency || 'once_forever',
    storageKey,
    couponCode: root.dataset.couponCode || 'WELCOME10',
    contactUrl: root.dataset.contactUrl || window.location.pathname || '/',
    codeUsed: root.dataset.codeUsed === 'true',
  };

  const STORAGE = {
    dismissedAt: `${cfg.storageKey}:dismissed`,
    claimedAt: `${cfg.storageKey}:claimed`,
    subscribed: `${cfg.storageKey}:subscribed`,
    productViews: `${baseKey}:product_views`,
    purchased: `${baseKey}:purchased`,
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
    // Server already knows the customer used / claimed the code
    if (cfg.codeUsed) return false;
    if (read(STORAGE.claimedAt) || read(STORAGE.subscribed)) return false;
    if (read(STORAGE.purchased)) return false;

    // Default: once forever after dismiss (any visitor / signed-in customer)
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
    // Persist immediately so refresh / new tab do not reopen before close
    write(STORAGE.dismissedAt, String(now()));
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    root.classList.add('is-open');
    lockScroll(true);
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
    write(STORAGE.dismissedAt, String(now()));
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

  /** No mouse / scroll / touch / keyboard activity for inactivityMs → show */
  const resetInactivity = () => {
    if (!armed || opened || closedByUser) return;
    window.clearTimeout(inactivityTimer);
    inactivityTimer = window.setTimeout(() => open(), Math.max(1000, cfg.inactivityMs));
  };

  const onActivity = () => resetInactivity();

  let triggersBound = false;

  const bindTriggers = () => {
    if (triggersBound) return;
    triggersBound = true;

    ['mousemove', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach((type) => {
      const target = type === 'scroll' ? window : document;
      target.addEventListener(type, onActivity, { passive: true });
    });

    resetInactivity();
  };

  const teardownTriggers = () => {
    ['mousemove', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach((type) => {
      const target = type === 'scroll' ? window : document;
      target.removeEventListener(type, onActivity);
    });
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

  /** Email the store owner via Shopify contact form (inbox notification) */
  const notifyStore = (subscriberEmail) => {
    try {
      const notify = new FormData();
      notify.set('form_type', 'contact');
      notify.set('utf8', '✓');
      notify.set('contact[email]', subscriberEmail);
      notify.set(
        'contact[body]',
        `New exit-intent signup.\nEmail: ${subscriberEmail}\nOffer: ${cfg.couponCode || 'WELCOME10'}\nSource: exit-intent popup`
      );
      notify.set('contact[name]', 'Exit-intent popup');
      fetch(cfg.contactUrl || `${window.Shopify?.routes?.root || '/'}contact`, {
        method: 'POST',
        body: notify,
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      }).catch(() => {});
    } catch (_) {
      /* non-blocking */
    }
  };

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
    if (!formData.get('contact[accepts_marketing]')) {
      formData.set('contact[accepts_marketing]', 'true');
    }

    const originalLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = submitBtn.dataset.loadingLabel || 'Saving…';
    }

    const endpoint =
      cfg.contactUrl ||
      `${window.Shopify?.routes?.root || '/'}contact`;

    const restoreSubmit = () => {
      if (!submitBtn) return;
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel || '';
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });

      let payload = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          payload = await response.json();
        } catch (_) {
          payload = null;
        }
      }

      const rawErrors = payload?.errors;
      let errorMessage =
        payload?.description ||
        payload?.message ||
        (typeof rawErrors === 'string' ? rawErrors : null);

      if (!errorMessage && rawErrors && typeof rawErrors === 'object') {
        const parts = [];
        Object.values(rawErrors).forEach((value) => {
          if (Array.isArray(value)) parts.push(...value);
          else if (value) parts.push(String(value));
        });
        errorMessage = parts.filter(Boolean).join(' ') || null;
      }

      const alreadyExists = /already|taken|exists|subscribed/i.test(
        String(errorMessage || '')
      );

      if (alreadyExists || response.ok || response.status === 200) {
        showSuccess();
        notifyStore(email);
        restoreSubmit();
        return;
      }

      if (response.status >= 400) {
        throw new Error(errorMessage || 'Could not save your email. Please try again.');
      }

      showSuccess();
      notifyStore(email);
      restoreSubmit();
    } catch (err) {
      const msg = String(err?.message || '');
      const isNetwork = /failed to fetch|networkerror|load failed|network/i.test(msg);

      if (isNetwork) {
        HTMLFormElement.prototype.submit.call(form);
        return;
      }

      setError(msg || 'Could not save your email. Please try again.');
      restoreSubmit();
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
