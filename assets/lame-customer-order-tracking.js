const selectors = {
  root: '[data-lame-order-tracking]',
  panel: '[data-order-tracking]',
  picker: '[data-order-tracking-picker]',
  empty: '[data-order-tracking-empty]',
  copyTracking: '[data-copy-tracking]',
  loginLink: '[data-tracking-login]',
};

class LameOrderTrackingPage {
  /** @param {HTMLElement} root */
  constructor(root) {
    this.root = root;
    this.emptyState = root.querySelector(selectors.empty);
    this.picker = root.querySelector(selectors.picker);
    this._setLoginReturnUrl();
    this._bindCopyTracking();
    this._showOrderFromUrl();
    window.addEventListener('popstate', () => this._showOrderFromUrl());
  }

  _setLoginReturnUrl() {
    this.root.querySelectorAll(selectors.loginLink).forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      const loginUrl = new URL(link.href, window.location.origin);
      loginUrl.searchParams.set('return_url', returnUrl);
      link.href = loginUrl.toString();
    });
  }

  _bindCopyTracking() {
    this.root.querySelectorAll(selectors.copyTracking).forEach((button) => {
      button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy-tracking');
        if (!value) return;

        try {
          await navigator.clipboard.writeText(value);
          const label = button.textContent;
          button.textContent = button.dataset.copiedLabel || 'Copied';
          button.classList.add('is-copied');
          window.setTimeout(() => {
            button.textContent = label;
            button.classList.remove('is-copied');
          }, 1800);
        } catch {
          /* clipboard unavailable */
        }
      });
    });
  }

  _showOrderFromUrl() {
    const orderId = new URLSearchParams(window.location.search).get('order');
    const panels = this.root.querySelectorAll(selectors.panel);
    let matched = false;

    panels.forEach((panel) => {
      if (!(panel instanceof HTMLElement)) return;
      const isMatch = orderId && panel.dataset.orderId === orderId;
      panel.hidden = !isMatch;
      if (isMatch) {
        matched = true;
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    if (this.picker instanceof HTMLElement) {
      this.picker.hidden = Boolean(orderId && matched);
    }

    if (this.emptyState instanceof HTMLElement) {
      const showEmpty = Boolean(orderId && !matched);
      this.emptyState.hidden = !showEmpty;
    }

    if (matched) {
      const active = this.root.querySelector(`${selectors.panel}[data-order-id="${orderId}"]`);
      active?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function initLameOrderTracking() {
  document.querySelectorAll(selectors.root).forEach((root) => {
    if (root instanceof HTMLElement) {
      new LameOrderTrackingPage(root);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLameOrderTracking);
} else {
  initLameOrderTracking();
}

document.addEventListener('shopify:section:load', initLameOrderTracking);
