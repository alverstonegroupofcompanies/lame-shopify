const selectors = {
  root: '[data-lame-customer-profile]',
  countrySelect: '[data-address-country-select]',
  toggleAddress: '[data-toggle-address]',
  cancelAddress: '[data-cancel-address]',
  deleteAddress: '[data-delete-address]',
  editToggle: '[data-edit-toggle]',
  editCancel: '[data-edit-cancel]',
  bankForm: 'form.lame-profile__form--bank',
};

const attrs = {
  expanded: 'aria-expanded',
  confirmMessage: 'data-confirm-message',
};

class LameCustomerProfile {
  constructor(root) {
    this.root = root;
    this._setupCountries();
    this._setupAddressListeners();
    this._setupEditPanels();
    this._setupBankForm();
    this._setupSidebarNav();
    this._openAddAddressFromHash();
  }

  _setupCountries() {
    if (typeof Shopify === 'undefined' || !Shopify.CountryProvinceSelector) return;

    const newCountry = this.root.querySelector('#AddressCountryNew');
    if (newCountry) {
      new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
        hideElement: 'AddressProvinceContainerNew',
      });
    }

    this.root.querySelectorAll(selectors.countrySelect).forEach((select) => {
      const formId = select.dataset.formId;
      if (!formId) return;
      new Shopify.CountryProvinceSelector(
        `AddressCountry_${formId}`,
        `AddressProvince_${formId}`,
        {
          hideElement: `AddressProvinceContainer_${formId}`,
        }
      );
    });
  }

  _setupAddressListeners() {
    this.root.querySelectorAll(selectors.toggleAddress).forEach((button) => {
      button.addEventListener('click', () => this._togglePanel(button));
    });

    this.root.querySelectorAll(selectors.cancelAddress).forEach((button) => {
      button.addEventListener('click', () => {
        const panel =
          button.closest('.lame-profile__card-edit') ||
          button.closest('.lame-profile__card-edit--inset');
        const panelId = panel?.id;
        const toggle = panelId
          ? this.root.querySelector(`[aria-controls="${panelId}"]`)
          : null;
        if (toggle) {
          this._setPanelOpen(toggle, false);
        } else if (panel) {
          panel.hidden = true;
        }
      });
    });

    this.root.querySelectorAll(selectors.deleteAddress).forEach((button) => {
      button.addEventListener('click', () => {
        const message = button.getAttribute(attrs.confirmMessage);
        if (message && confirm(message) && typeof Shopify !== 'undefined') {
          Shopify.postLink(button.dataset.target, {
            parameters: { _method: 'delete' },
          });
        }
      });
    });
  }

  _setupEditPanels() {
    this.root.querySelectorAll(selectors.editToggle).forEach((button) => {
      button.addEventListener('click', () => this._togglePanel(button));
    });

    this.root.querySelectorAll(selectors.editCancel).forEach((button) => {
      button.addEventListener('click', () => {
        const panelId = button.getAttribute('aria-controls');
        const toggle = panelId
          ? this.root.querySelector(`[aria-controls="${panelId}"][data-edit-toggle]`)
          : null;
        if (toggle) {
          this._setPanelOpen(toggle, false);
        }
      });
    });
  }

  _togglePanel(button) {
    const isOpen = button.getAttribute(attrs.expanded) === 'true';
    this._setPanelOpen(button, !isOpen);
  }

  _setPanelOpen(button, open) {
    button.setAttribute(attrs.expanded, String(open));
    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) {
      panel.hidden = !open;
    }

    if (button.hasAttribute('data-edit-toggle') && panelId) {
      const view =
        button.closest('.lame-acct-card, .lame-profile__card, .lame-acct-bank')?.querySelector('[data-profile-view]') ||
        this.root.querySelector(`[data-profile-view]`);
      if (view) {
        view.hidden = open;
      }
      if (open && panelId === 'AccountEditForm') {
        const settings = document.getElementById('account-settings');
        settings?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.root.querySelectorAll('[data-profile-nav]').forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === '#account-settings');
        });
      }
    }
  }

  _setupSidebarNav() {
    this.root.querySelectorAll('[data-profile-nav]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href?.startsWith('#')) return;
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.root.querySelectorAll('[data-profile-nav]').forEach((item) => {
          item.classList.remove('is-active');
        });
        link.classList.add('is-active');
        if (history.replaceState) {
          history.replaceState(null, '', href);
        }
      });
    });
  }

  _openAddAddressFromHash() {
    if (window.location.hash === '#add-address') {
      const addBtn = this.root.querySelector('[aria-controls="AddressNewForm"]');
      if (addBtn) {
        this._setPanelOpen(addBtn, true);
        document.getElementById('AddressNewForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  _setupBankForm() {
    const form = this.root.querySelector(selectors.bankForm);
    if (!form) return;

    form.addEventListener('submit', () => {
      const bodyField = form.querySelector('[data-bank-body]');
      if (!bodyField) return;

      const fields = form.querySelectorAll('[data-bank-field]');
      const lines = ['Bank details update from customer profile:'];
      fields.forEach((field) => {
        const label = field.getAttribute('data-bank-field');
        const value = field.value.trim();
        if (value) {
          lines.push(`${label}: ${value}`);
        }
      });
      bodyField.value = lines.join('\n');
    });
  }
}

function syncAccountWishlistCount(root) {
  const STORAGE_KEY = 'lame:wishlist:v1';
  const badges = root.querySelectorAll('[data-account-wishlist-count]');
  if (!badges.length) return;

  let count = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      count = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch (_e) {
    count = 0;
  }

  badges.forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count < 1;
  });
}

function syncAccountWishlistPreview(root) {
  const STORAGE_KEY = 'lame:wishlist:v1';
  const preview = root.querySelector('[data-account-wishlist-preview]');
  if (!(preview instanceof HTMLElement)) return;

  const empty = preview.querySelector('[data-account-wishlist-empty]');
  const filled = preview.querySelector('[data-account-wishlist-filled]');
  const list = preview.querySelector('[data-account-wishlist-list]');
  if (!(list instanceof HTMLElement) || !(filled instanceof HTMLElement) || !(empty instanceof HTMLElement)) return;

  /** @type {Array<{id:number|string,handle?:string,url?:string,title?:string,image?:string,price?:string}>} */
  let items = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      items = Array.isArray(parsed) ? parsed : [];
    }
  } catch (_e) {
    items = [];
  }

  if (!items.length) {
    list.innerHTML = '';
    filled.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  filled.hidden = false;

  const max = 4;
  const slice = items.slice(0, max);
  list.innerHTML = slice
    .map((item) => {
      const url = item.url || (item.handle ? `/products/${item.handle}` : '#');
      const title = item.title || '';
      const img = item.image || '';
      const price = item.price || '';
      const safe = (s) =>
        String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      return `
        <li class="lame-profile__wishlist-item">
          <a class="lame-profile__wishlist-thumb" href="${safe(url)}">
            ${img ? `<img class="lame-profile__wishlist-img" src="${safe(img)}" alt="" loading="lazy" width="64" height="64">` : `<span class="lame-profile__wishlist-fallback" aria-hidden="true"></span>`}
          </a>
          <div class="lame-profile__wishlist-meta">
            <a class="lame-profile__wishlist-title" href="${safe(url)}">${safe(title)}</a>
            ${price ? `<div class="lame-profile__wishlist-price">${safe(price)}</div>` : ''}
          </div>
        </li>`;
    })
    .join('');
}

function setupAccountAnchorScroll(root) {
  root.querySelectorAll('.lame-profile__quick-card[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href')?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) {
        history.replaceState(null, '', `#${id}`);
      }
    });
  });
}

function initLameCustomerProfile() {
  document.querySelectorAll(selectors.root).forEach((root) => {
    new LameCustomerProfile(root);
    syncAccountWishlistCount(root);
    syncAccountWishlistPreview(root);
    setupAccountAnchorScroll(root);
  });
}

document.addEventListener('lame:wishlistchange', () => {
  document.querySelectorAll(selectors.root).forEach((root) => {
    syncAccountWishlistCount(root);
    syncAccountWishlistPreview(root);
  });
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLameCustomerProfile);
} else {
  initLameCustomerProfile();
}

document.addEventListener('shopify:section:load', initLameCustomerProfile);
