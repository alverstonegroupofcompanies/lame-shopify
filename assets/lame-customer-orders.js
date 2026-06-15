const selectors = {
  root: '[data-lame-customer-orders]',
  listView: '[data-orders-list-view]',
  detailView: '[data-orders-detail-view]',
  detailPanel: '[data-order-detail]',
  orderLink: '[data-order-link]',
  backLink: '[data-order-back]',
  copyTracking: '[data-copy-tracking]',
};

class LameCustomerOrders {
  /** @param {HTMLElement} root */
  constructor(root) {
    this.root = root;
    this.listView = root.querySelector(selectors.listView);
    this.detailView = root.querySelector(selectors.detailView);
    if (!this.listView || !this.detailView) return;

    this._bindLinks();
    this._bindBack();
    this._bindCopyTracking();
    this._syncFromUrl();
    window.addEventListener('popstate', () => this._syncFromUrl());
  }

  _bindLinks() {
    this.root.querySelectorAll(selectors.orderLink).forEach((link) => {
      link.addEventListener('click', (event) => {
        const orderId = link.getAttribute('data-order-id');
        if (!orderId) return;
        event.preventDefault();
        this._showOrder(orderId, true);
      });
    });
  }

  _bindBack() {
    this.root.querySelectorAll(selectors.backLink).forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this._showList(true);
      });
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

  _syncFromUrl() {
    const orderId = new URLSearchParams(window.location.search).get('order');
    if (orderId) {
      this._showOrder(orderId, false);
    } else {
      this._showList(false);
    }
  }

  /** @param {string} orderId */
  _showOrder(orderId, pushState) {
    const panel = this.detailView?.querySelector(`${selectors.detailPanel}[data-order-id="${orderId}"]`);
    if (!panel) return;

    this.listView.hidden = true;
    this.detailView.hidden = false;

    this.detailView.querySelectorAll(selectors.detailPanel).forEach((item) => {
      item.hidden = item !== panel;
    });

    const trackSection = panel.querySelector('.lame-order-track');
    (trackSection || panel).scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (pushState) {
      const url = new URL(window.location.href);
      url.searchParams.set('order', orderId);
      history.pushState({ orderId }, '', url);
    }
  }

  _showList(pushState) {
    this.listView.hidden = false;
    this.detailView.hidden = true;

    if (pushState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('order');
      history.pushState({}, '', url.pathname + url.search);
    }

    this.listView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initLameCustomerOrders() {
  document.querySelectorAll(selectors.root).forEach((root) => {
    if (root instanceof HTMLElement) {
      new LameCustomerOrders(root);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLameCustomerOrders);
} else {
  initLameCustomerOrders();
}

document.addEventListener('shopify:section:load', initLameCustomerOrders);
