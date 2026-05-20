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
      const view = button.closest('.lame-profile__card')?.querySelector('[data-profile-view]');
      if (view) {
        view.hidden = open;
      }
    }
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
