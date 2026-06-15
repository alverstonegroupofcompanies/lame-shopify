import { Component } from '@theme/component';
import { isClickedOutside, isMobileBreakpoint } from '@theme/utilities';

/**
 * Premium account menu — mobile slide-in drawer and desktop dropdown.
 *
 * @typedef {object} Refs
 * @property {HTMLButtonElement} trigger - Menu toggle button.
 * @property {HTMLElement} panel - Menu panel container.
 * @property {HTMLElement} [backdrop] - Mobile overlay.
 * @property {HTMLElement[]} [menuitem] - Focusable menu rows.
 *
 * @extends {Component<Refs>}
 */
class AccountMenuComponent extends Component {
  requiredRefs = ['trigger', 'panel'];

  /** @type {number} */
  #scrollY = 0;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.#handleDocumentClick);
    document.addEventListener('keydown', this.#handleDocumentKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.#handleDocumentClick);
    document.removeEventListener('keydown', this.#handleDocumentKeyDown);
    this.#unlockScroll();
  }

  open() {
    if (this.classList.contains('is-open')) return;

    this.classList.add('is-open');
    this.refs.trigger.setAttribute('aria-expanded', 'true');

    if (isMobileBreakpoint()) {
      this.#lockScroll();
    }

    const items = this.#menuItems;
    requestAnimationFrame(() => {
      items[0]?.focus();
    });
  }

  close() {
    if (!this.classList.contains('is-open')) return;

    this.classList.remove('is-open');
    this.refs.trigger.setAttribute('aria-expanded', 'false');
    this.#unlockScroll();
    this.refs.trigger.focus();
  }

  toggle() {
    if (this.classList.contains('is-open')) {
      this.close();
    } else {
      this.open();
    }
  }

  get #menuItems() {
    const items = this.refs.menuitem;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }

  #lockScroll() {
    this.#scrollY = window.scrollY;
    document.body.style.width = '100%';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.#scrollY}px`;
    document.documentElement.setAttribute('scroll-lock', '');
  }

  #unlockScroll() {
    if (document.body.style.position !== 'fixed') return;

    document.body.style.width = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.documentElement.removeAttribute('scroll-lock');
    window.scrollTo({ top: this.#scrollY, behavior: 'instant' });
  }

  #handleDocumentClick = (event) => {
    if (!this.classList.contains('is-open')) return;
    if (event.target instanceof Element && this.contains(event.target)) return;
    if (isClickedOutside(event, this.refs.panel) && isClickedOutside(event, this.refs.trigger)) {
      this.close();
    }
  };

  #handleDocumentKeyDown = (event) => {
    if (!this.classList.contains('is-open')) return;

    const items = this.#menuItems;
    if (!items.length) return;

    const currentIndex = items.indexOf(/** @type {HTMLElement} */ (document.activeElement));

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case 'Tab': {
        const first = items[0];
        const last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
        break;
      }
    }
  };

}

if (!customElements.get('account-menu-component')) {
  customElements.define('account-menu-component', AccountMenuComponent);
}
