import { Component } from '@theme/component';
import { debounce, isClickedOutside, isMobileBreakpoint } from '@theme/utilities';

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
    window.addEventListener('resize', this.#handleReposition);
    window.addEventListener('scroll', this.#handleReposition, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.#handleDocumentClick);
    document.removeEventListener('keydown', this.#handleDocumentKeyDown);
    window.removeEventListener('resize', this.#handleReposition);
    window.removeEventListener('scroll', this.#handleReposition, true);
    this.#unlockScroll();
    this.#clearPanelPosition();
  }

  open() {
    if (this.classList.contains('is-open')) return;

    this.classList.add('is-open');
    document.documentElement.classList.add('lame-account-menu-open');
    this.refs.trigger.setAttribute('aria-expanded', 'true');

    if (isMobileBreakpoint()) {
      this.#lockScroll();
    }

    requestAnimationFrame(() => {
      if (!isMobileBreakpoint()) {
        this.#positionPanel();
        requestAnimationFrame(() => this.#positionPanel());
      }
    });
  }

  close() {
    if (!this.classList.contains('is-open')) return;

    this.classList.remove('is-open');
    document.documentElement.classList.remove('lame-account-menu-open');
    this.refs.trigger.setAttribute('aria-expanded', 'false');
    this.#unlockScroll();
    this.#clearPanelPosition();
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

  #positionPanel() {
    const { trigger, panel } = this.refs;
    if (!trigger || !panel || isMobileBreakpoint()) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 12;
    const viewportPadding = 12;
    const panelWidth = panel.offsetWidth || 280;

    let right = window.innerWidth - rect.right;
    right = Math.max(viewportPadding, Math.min(right, window.innerWidth - panelWidth - viewportPadding));

    panel.style.position = 'fixed';
    panel.style.right = `${right}px`;
    panel.style.left = 'auto';
    panel.style.width = `${panelWidth}px`;

    const panelHeight = panel.offsetHeight;
    let top = rect.bottom + gap;

    if (top + panelHeight > window.innerHeight - viewportPadding) {
      const topAbove = rect.top - gap - panelHeight;
      if (topAbove >= viewportPadding) {
        top = topAbove;
      } else {
        top = Math.max(viewportPadding, window.innerHeight - panelHeight - viewportPadding);
      }
    }

    panel.style.top = `${top}px`;
  }

  #clearPanelPosition() {
    const { panel } = this.refs;
    if (!panel) return;

    panel.style.removeProperty('position');
    panel.style.removeProperty('top');
    panel.style.removeProperty('right');
    panel.style.removeProperty('left');
    panel.style.removeProperty('width');
  }

  #handleReposition = debounce(() => {
    if (!this.classList.contains('is-open') || isMobileBreakpoint()) return;
    this.#positionPanel();
  }, 50);

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
