import { Component } from '@theme/component';
import { debounce, isMobileBreakpoint } from '@theme/utilities';

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

  /** @type {Comment | null} */
  #panelAnchor = null;

  /** @type {Comment | null} */
  #backdropAnchor = null;

  /** @type {HTMLElement | null} */
  #panelEl = null;

  /** @type {HTMLElement | null} */
  #backdropEl = null;

  /** @type {boolean} */
  #suppressDocumentClick = false;

  connectedCallback() {
    super.connectedCallback();
    this.#cacheElements();
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
    this.#unportalPanel();
    this.#clearPanelPosition();
  }

  updatedCallback() {
    super.updatedCallback();
    this.#cacheElements();
  }

  #cacheElements() {
    if (this.refs.panel) this.#panelEl = this.refs.panel;
    if (this.refs.backdrop) this.#backdropEl = this.refs.backdrop;
  }

  #getPanel() {
    return this.refs.panel ?? this.#panelEl;
  }

  #getBackdrop() {
    return this.refs.backdrop ?? this.#backdropEl;
  }

  open() {
    if (this.classList.contains('is-open')) return;

    this.#cacheElements();
    this.classList.add('is-open');
    document.documentElement.classList.add('lame-account-menu-open');
    this.refs.trigger.setAttribute('aria-expanded', 'true');

    if (isMobileBreakpoint()) {
      this.#lockScroll();
      this.#portalPanel();
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
    this.#unportalPanel();
    this.#clearPanelPosition();
    this.refs.trigger.focus();
  }

  toggle() {
    this.#suppressDocumentClick = true;
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
    const trigger = this.refs.trigger;
    const panel = this.#getPanel();
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
    const panel = this.#getPanel();
    if (!panel) return;

    panel.style.removeProperty('position');
    panel.style.removeProperty('top');
    panel.style.removeProperty('right');
    panel.style.removeProperty('left');
    panel.style.removeProperty('width');
  }

  #handleReposition = debounce(() => {
    if (!this.classList.contains('is-open')) return;

    if (isMobileBreakpoint()) {
      if (document.body.style.position !== 'fixed') {
        this.#lockScroll();
      }
      this.#clearPanelPosition();
      this.#portalPanel();
      return;
    }

    this.#unlockScroll();
    this.#unportalPanel();
    this.#positionPanel();
  }, 50);

  #portalPanel() {
    if (!isMobileBreakpoint()) return;

    const panel = this.#getPanel();
    const backdrop = this.#getBackdrop();
    if (!panel || panel.parentElement === document.body) return;

    const panelParent = panel.parentElement;
    if (panelParent) {
      this.#panelAnchor = document.createComment('lame-account-panel-anchor');
      panelParent.insertBefore(this.#panelAnchor, panel);
      panel.classList.add('lame-account__panel--portaled');
      document.body.appendChild(panel);
      this.#panelEl = panel;
    }

    if (backdrop?.parentElement && backdrop.parentElement !== document.body) {
      this.#backdropAnchor = document.createComment('lame-account-backdrop-anchor');
      backdrop.parentElement.insertBefore(this.#backdropAnchor, backdrop);
      backdrop.classList.add('lame-account__backdrop--portaled');
      document.body.appendChild(backdrop);
      this.#backdropEl = backdrop;
    }
  }

  #unportalPanel() {
    const panel = this.#getPanel();
    const backdrop = this.#getBackdrop();
    if (!panel) return;

    if (panel.classList.contains('lame-account__panel--portaled')) {
      if (this.#panelAnchor?.parentElement) {
        this.#panelAnchor.parentElement.insertBefore(panel, this.#panelAnchor);
        this.#panelAnchor.remove();
      }
      panel.classList.remove('lame-account__panel--portaled');
      this.#panelAnchor = null;
    }

    if (backdrop?.classList.contains('lame-account__backdrop--portaled')) {
      if (this.#backdropAnchor?.parentElement) {
        this.#backdropAnchor.parentElement.insertBefore(backdrop, this.#backdropAnchor);
        this.#backdropAnchor.remove();
      }
      backdrop.classList.remove('lame-account__backdrop--portaled');
      this.#backdropAnchor = null;
    }
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

  #isEventInside(event, element) {
    if (!(event.target instanceof Element) || !element) return false;
    return element === event.target || element.contains(event.target);
  }

  #handleDocumentClick = (event) => {
    if (!this.classList.contains('is-open')) return;

    if (this.#suppressDocumentClick) {
      this.#suppressDocumentClick = false;
      return;
    }

    const panel = this.#getPanel();
    const backdrop = this.#getBackdrop();
    const trigger = this.refs.trigger;

    if (this.#isEventInside(event, trigger)) return;
    if (this.#isEventInside(event, panel)) return;
    if (this.#isEventInside(event, backdrop)) return;
    if (event.target instanceof Element && this.contains(event.target)) return;

    this.close();
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
