const selectors = {
  root: '[data-lame-customer-profile]',
  addresses: '[data-customer-addresses]',
  countrySelect: '[data-address-country-select]',
  addressPanel: '[data-address-panel]',
  toggleAddress: '[data-toggle-address]',
  cancelAddress: '[data-cancel-address]',
  deleteAddress: '[data-delete-address]',
  tab: '[data-profile-tab]',
  panel: '[data-profile-panel]',
  bankForm: '[data-bank-form]',
};

const attrs = {
  expanded: 'aria-expanded',
  confirmMessage: 'data-confirm-message',
};

class LameCustomerProfile {
  constructor(root) {
    this.root = root;
    this.elements = this._getElements();
    if (!this.elements.addresses) return;
    this._setupCountries();
    this._setupAddressListeners();
    this._setupTabs();
    this._setupBankForm();
    this._openTabFromHash();
    this._openTabFromPath();
  }

  _openTabFromPath() {
    const path = window.location.pathname;
    if (path.includes('/addresses') || path.endsWith('/addresses')) {
      this._activateTab('addresses');
    }
  }

  _getElements() {
    const addresses = this.root.querySelector(selectors.addresses);
    return {
      addresses,
      toggleButtons: this.root.querySelectorAll(selectors.toggleAddress),
      cancelButtons: this.root.querySelectorAll(selectors.cancelAddress),
      deleteButtons: this.root.querySelectorAll(selectors.deleteAddress),
      countrySelects: addresses ? addresses.querySelectorAll(selectors.countrySelect) : [],
      tabs: this.root.querySelectorAll(selectors.tab),
      panels: this.root.querySelectorAll(selectors.panel),
      bankForm: this.root.querySelector(selectors.bankForm),
    };
  }

  _setupCountries() {
    if (typeof Shopify === 'undefined' || !Shopify.CountryProvinceSelector) return;

    const newCountry = this.root.querySelector('#AddressCountryNew');
    if (newCountry) {
      new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
        hideElement: 'AddressProvinceContainerNew',
      });
    }

    this.elements.countrySelects.forEach((select) => {
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
    this.elements.toggleButtons.forEach((button) => {
      button.addEventListener('click', () => this._toggleExpanded(button));
    });

    this.elements.cancelButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const panel =
          button.closest(selectors.addressPanel) ||
          button.closest('.lame-profile__address-form');
        const panelId = panel?.id;
        const toggle = panelId
          ? this.root.querySelector(`[aria-controls="${panelId}"]`)
          : null;
        if (toggle) {
          this._setExpanded(toggle, false);
        } else if (panel) {
          panel.hidden = true;
        }
      });
    });

    this.elements.deleteButtons.forEach((button) => {
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

  _toggleExpanded(target) {
    const isExpanded = target.getAttribute(attrs.expanded) === 'true';
    this._setExpanded(target, !isExpanded);
  }

  _setExpanded(target, expanded) {
    target.setAttribute(attrs.expanded, String(expanded));
    const panelId = target.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : target.closest(selectors.addressPanel)?.querySelector('[id]');
    if (panel) {
      panel.hidden = !expanded;
    }
  }

  _setupTabs() {
    this.elements.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.profileTab;
        this._activateTab(id);
        if (id) {
          history.replaceState(null, '', `#${id}`);
        }
      });
    });
  }

  _activateTab(id) {
    this.elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.profileTab === id;
      tab.setAttribute('aria-selected', String(isActive));
      tab.classList.toggle('lame-profile__tab--active', isActive);
    });
    this.elements.panels.forEach((panel) => {
      const isActive = panel.dataset.profilePanel === id;
      panel.hidden = !isActive;
      panel.classList.toggle('lame-profile__panel--active', isActive);
    });
  }

  _openTabFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && this.root.querySelector(`[data-profile-tab="${hash}"]`)) {
      this._activateTab(hash);
    }
  }

  _setupBankForm() {
    const form = this.elements.bankForm;
    if (!form) return;

    form.addEventListener('submit', (event) => {
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

function initLameCustomerProfile() {
  document.querySelectorAll(selectors.root).forEach((root) => {
    new LameCustomerProfile(root);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLameCustomerProfile);
} else {
  initLameCustomerProfile();
}

document.addEventListener('shopify:section:load', initLameCustomerProfile);
