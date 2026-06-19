const STORAGE_KEY = 'lame_registration_data';

const selectors = {
  root: '[data-lame-customer-auth]',
  registerStep: '[data-lame-register-step]',
  registerForm: '#LameCreateCustomerForm',
  registerErrors: '[data-lame-register-errors]',
  registerAddress: '[data-lame-register-address]',
  regField: '[data-lame-reg-field]',
  completeRoot: '[data-lame-registration-complete]',
  loginErrors: '[data-lame-login-errors]',
  resetErrors: '[data-lame-reset-errors]',
  activateErrors: '[data-lame-activate-errors]',
  authTab: '[data-lame-auth-tab]',
  authPanel: '[data-lame-auth-panel]',
  authTabLink: '[data-lame-auth-tab-link]',
  countrySelect: '#RegCountry_Signup',
  provinceSelect: '#RegProvince_Signup',
  provinceContainer: '#RegProvinceContainer_Signup',
};

const messages = {
  required: 'Please fill in all required fields.',
  email: 'Please enter a valid email address.',
  password: 'Password must be at least 5 characters.',
  passwordMatch: 'Passwords do not match.',
  phone: 'Please enter a valid phone number.',
};

class LameCustomerAuth {
  constructor(root) {
    this.root = root;
    this.config = window.LameAuthConfig || {};
    this._setupCountryProvince();
    this._setupRegisterForm();
    this._setupCompletion();
    this._setupLoginTabs();
    this._setupPasswordForms();
  }

  _setupCountryProvince() {
    if (typeof Shopify === 'undefined' || !Shopify.CountryProvinceSelector) return;
    const country = this.root.querySelector(selectors.countrySelect);
    if (!country) return;
    new Shopify.CountryProvinceSelector('RegCountry_Signup', 'RegProvince_Signup', {
      hideElement: 'RegProvinceContainer_Signup',
    });
  }

  _setupRegisterForm() {
    const step = this.root.querySelector(selectors.registerStep);
    const form = this.root.querySelector(selectors.registerForm);
    if (!step || !form) return;

    form.addEventListener('submit', (event) => {
      const errors = this._validateRegistration(form);
      const errorBox = this.root.querySelector(selectors.registerErrors);
      if (errors.length) {
        event.preventDefault();
        if (errorBox) {
          errorBox.hidden = false;
          errorBox.innerHTML = errors.map((msg) => `<p>${msg}</p>`).join('');
          errorBox.focus();
        }
        return;
      }

      if (errorBox) {
        errorBox.hidden = true;
        errorBox.innerHTML = '';
      }

      const data = this._collectRegistrationData(form);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        /* sessionStorage unavailable */
      }
    });
  }

  _collectRegistrationData(form) {
    const data = {
      first_name: form.querySelector('#RegisterFirstName')?.value?.trim() || '',
      last_name: form.querySelector('#RegisterLastName')?.value?.trim() || '',
      email: form.querySelector('#RegisterEmail')?.value?.trim() || '',
      phone: form.querySelector('#RegisterPhone')?.value?.trim() || '',
    };

    this.root.querySelectorAll(`${selectors.registerAddress} ${selectors.regField}`).forEach((field) => {
      const key = field.dataset.lameRegField;
      if (!key) return;
      if (field.type === 'checkbox') {
        data[key] = field.checked;
      } else {
        data[key] = field.value?.trim() || '';
      }
    });

    return data;
  }

  _validateRegistration(form) {
    const errors = [];
    const requiredIds = ['RegisterFirstName', 'RegisterLastName', 'RegisterEmail', 'RegisterPhone', 'RegisterPassword'];
    requiredIds.forEach((id) => {
      const input = form.querySelector(`#${id}`);
      if (input && !input.value?.trim()) errors.push(messages.required);
    });

    const email = form.querySelector('#RegisterEmail')?.value?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(messages.email);
    }

    const password = form.querySelector('#RegisterPassword')?.value;
    if (password && password.length < 5) {
      errors.push(messages.password);
    }

    const addressFields = ['address1', 'city', 'zip', 'country'];
    addressFields.forEach((key) => {
      const field = this.root.querySelector(`[data-lame-reg-field="${key}"]`);
      if (field && !field.value?.trim()) errors.push(messages.required);
    });

    return [...new Set(errors)];
  }

  _setupCompletion() {
    if (!this.config.completeRegistration) return;

    const completeEl = this.root.querySelector(selectors.completeRoot);
    let data;
    try {
      data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    } catch (e) {
      data = null;
    }

    if (!data) {
      if (completeEl) {
        completeEl.innerHTML = `<p>${this._escapeHtml('Registration data was lost. Please add your address from your profile.')}</p>`;
        const link = document.createElement('a');
        link.href = this.config.returnUrl || '/account';
        link.className = 'button lame-profile__btn-primary';
        link.textContent = 'Go to profile';
        completeEl.appendChild(link);
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const step = params.get('step') || 'phone';

    if (step === 'address') {
      this._submitAddressStep(data);
    } else {
      this._submitPhoneStep(data);
    }
  }

  _submitPhoneStep(data) {
    const phoneInput = document.getElementById('LameRegPhone');
    const form = document.getElementById('LameRegistrationPhoneForm');
    if (!phoneInput || !form || !data.phone) {
      this._submitAddressStep(data);
      return;
    }

    phoneInput.value = data.phone;
    const firstName = document.getElementById('LameRegAddrFirstName');
    const lastName = document.getElementById('LameRegAddrLastName');
    if (firstName && data.first_name) firstName.value = data.first_name;
    if (lastName && data.last_name) lastName.value = data.last_name;
    form.submit();
  }

  _submitAddressStep(data) {
    const mappings = {
      LameRegAddrAddress1: 'address1',
      LameRegAddrAddress2: 'address2',
      LameRegAddrCity: 'city',
      LameRegAddrZip: 'zip',
      LameRegAddrCountry: 'country',
      LameRegAddrProvince: 'province',
      LameRegAddrPhone: 'phone',
    };

    Object.entries(mappings).forEach(([id, key]) => {
      const input = document.getElementById(id);
      if (input && data[key] != null) input.value = data[key];
    });

    const defaultInput = document.getElementById('LameRegAddrDefault');
    if (defaultInput) {
      defaultInput.value = data.default_address === false ? '0' : '1';
    }

    const form = document.getElementById('LameRegistrationAddressForm');
    if (!form) return;

    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }

    form.submit();
  }

  _setupLoginTabs() {
    const tabs = this.root.querySelectorAll(selectors.authTab);
    const panels = this.root.querySelectorAll(selectors.authPanel);
    if (!tabs.length) return;

    const activate = (name) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.lameAuthTab === name;
        tab.classList.toggle('lame-auth__tab--active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const active = panel.dataset.lameAuthPanel === name;
        panel.classList.toggle('lame-auth__panel--active', active);
        panel.hidden = !active;
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activate(tab.dataset.lameAuthTab));
    });

    this.root.querySelectorAll(selectors.authTabLink).forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        activate(link.dataset.lameAuthTabLink);
      });
    });

    this.root.querySelectorAll('[data-lame-auth-tab]').forEach((trigger) => {
      if (trigger.matches(selectors.authTab)) return;
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        activate(trigger.dataset.lameAuthTab);
      });
    });
  }

  _setupPasswordForms() {
    const resetForm = document.getElementById('LameResetPasswordForm');
    if (resetForm) {
      resetForm.addEventListener('submit', (event) => {
        if (!this._validatePasswordPair(resetForm, 'ResetPassword', 'ResetPasswordConfirm', selectors.resetErrors)) {
          event.preventDefault();
        }
      });
    }

    const activateForm = document.getElementById('LameActivateAccountForm');
    if (activateForm) {
      activateForm.addEventListener('submit', (event) => {
        if (!this._validatePasswordPair(activateForm, 'ActivatePassword', 'ActivatePasswordConfirm', selectors.activateErrors)) {
          event.preventDefault();
        }
      });
    }

    const loginForm = document.getElementById('LameLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (event) => {
        const email = loginForm.querySelector('#LoginEmail')?.value?.trim();
        const password = loginForm.querySelector('#LoginPassword')?.value;
        const errorBox = this.root.querySelector(selectors.loginErrors);
        if (!email || !password) {
          event.preventDefault();
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.innerHTML = `<p>${messages.required}</p>`;
          }
        } else if (errorBox) {
          errorBox.hidden = true;
          errorBox.innerHTML = '';
        }
      });
    }
  }

  _validatePasswordPair(form, passId, confirmId, errorSelector) {
    const pass = form.querySelector(`#${passId}`)?.value || '';
    const confirm = form.querySelector(`#${confirmId}`)?.value || '';
    const errorBox = this.root.querySelector(errorSelector);
    const errors = [];

    if (pass.length < 5) errors.push(messages.password);
    if (pass !== confirm) errors.push(messages.passwordMatch);

    if (errors.length) {
      if (errorBox) {
        errorBox.hidden = false;
        errorBox.innerHTML = errors.map((msg) => `<p>${msg}</p>`).join('');
      }
      return false;
    }

    if (errorBox) {
      errorBox.hidden = true;
      errorBox.innerHTML = '';
    }
    return true;
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

function initLameCustomerAuth() {
  document.querySelectorAll(selectors.root).forEach((root) => new LameCustomerAuth(root));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLameCustomerAuth);
} else {
  initLameCustomerAuth();
}
