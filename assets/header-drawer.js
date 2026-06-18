import { Component } from '@theme/component';
import { trapFocus, removeTrapFocus } from '@theme/focus';
import { onAnimationEnd, removeWillChangeOnAnimationEnd } from '@theme/utilities';

/**
 * A custom element that manages the main menu drawer.
 *
 * @typedef {object} Refs
 * @property {HTMLDetailsElement} details - The details element.
 * @property {HTMLDivElement} menuDrawer - The slideable drawer panel containing the menu.
 *
 * @extends {Component<Refs>}
 */
class HeaderDrawer extends Component {
  requiredRefs = ['details', 'menuDrawer'];

  /** @type {Comment | null} */
  #drawerAnchor = null;

  /** @type {Comment | null} */
  #backdropAnchor = null;

  /** @type {HTMLElement | null} */
  #backdrop = null;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keyup', this.#onKeyUp);
    this.#setupAnimatedElementListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keyup', this.#onKeyUp);
  }

  /**
   * Close the main menu drawer when the Escape key is pressed
   * @param {KeyboardEvent} event
   */
  #onKeyUp = (event) => {
    if (event.key !== 'Escape') return;

    this.#close(this.#getDetailsElement(event));
  };

  /**
   * @returns {boolean} Whether the main menu drawer is open
   */
  get isOpen() {
    return (
      this.refs.details.classList.contains('menu-open') || this.refs.details.hasAttribute('open')
    );
  }

  /**
   * Get the closest details element to the event target
   * @param {Event | undefined} event
   * @returns {HTMLDetailsElement}
   */
  #getDetailsElement(event) {
    if (!(event?.target instanceof Element)) return this.refs.details;

    return event.target.closest('details') ?? this.refs.details;
  }

  /**
   * Toggle the main menu drawer
   */
  /**
   * @param {Event} [event]
   */
  toggle(event) {
    event?.preventDefault();
    return this.isOpen ? this.close() : this.open(undefined, event);
  }

  /**
   * Open the closest drawer or the main menu drawer
   * @param {string} [target]
   * @param {Event} [event]
   */
  open(target, event) {
    const details = this.#getDetailsElement(event);
    const summary = details.querySelector('summary');

    if (!summary) return;

    summary.setAttribute('aria-expanded', 'true');
    summary.setAttribute('aria-hidden', 'true');
    details.setAttribute('open', '');
    details.classList.add('menu-open');

    if (target) {
      this.refs.menuDrawer.classList.add('menu-drawer--has-submenu-opened');
    }

    this.preventInitialAccordionAnimations(details);
    this.#portalDrawer();

    const mainDrawer = this.refs.menuDrawer;

    requestAnimationFrame(() => {
      mainDrawer.classList.add('menu-drawer--open');
      this.#getBackdrop()?.classList.add('menu-drawer__backdrop--open');
      onAnimationEnd(mainDrawer, () => trapFocus(details), { subtree: false });
    });
  }

  /**
   * Go back or close the main menu drawer
   * @param {Event} [event]
   */
  back(event) {
    this.#close(this.#getDetailsElement(event));
  }

  /**
   * Close the main menu drawer
   */
  close() {
    this.#close(this.refs.details);
  }

  /**
   * Close the closest menu or submenu that is open
   *
   * @param {HTMLDetailsElement} details
   */
  #close(details) {
    const summary = details.querySelector('summary');

    if (!summary) return;

    summary.setAttribute('aria-expanded', 'false');
    summary.removeAttribute('aria-hidden');
    details.classList.remove('menu-open');
    this.refs.menuDrawer.classList.remove('menu-drawer--has-submenu-opened', 'menu-drawer--open');
    this.#getBackdrop()?.classList.remove('menu-drawer__backdrop--open');

    const drawer =
      details === this.refs.details
        ? this.refs.menuDrawer
        : details.querySelector('.menu-drawer__submenu');

    onAnimationEnd(
      drawer || details,
      () => {
        reset(details);
        if (details === this.refs.details) {
          this.#unportalDrawer();
          removeTrapFocus();
          const openDetails = this.querySelectorAll('details[open]:not(accordion-custom > details)');
          openDetails.forEach(reset);
        } else {
          trapFocus(this.refs.details);
        }
      },
      { subtree: false }
    );
  }

  /**
   * @returns {boolean}
   */
  #shouldPortalDrawer() {
    return this.refs.menuDrawer.classList.contains('menu-drawer--luxury');
  }

  /**
   * @returns {HTMLElement | null}
   */
  #getBackdrop() {
    if (this.#backdrop) return this.#backdrop;
    const backdrop = this.refs.details.querySelector('.menu-drawer__backdrop');
    if (backdrop instanceof HTMLElement) {
      this.#backdrop = backdrop;
    }
    return this.#backdrop;
  }

  #portalDrawer() {
    if (!this.#shouldPortalDrawer()) return;

    const drawer = this.refs.menuDrawer;
    if (drawer.parentElement === document.body) return;

    const parent = drawer.parentElement;
    if (!parent) return;

    this.#drawerAnchor = document.createComment('menu-drawer-anchor');
    parent.insertBefore(this.#drawerAnchor, drawer);

    const backdrop = this.#getBackdrop();
    if (backdrop?.parentElement) {
      this.#backdropAnchor = document.createComment('menu-drawer-backdrop-anchor');
      backdrop.parentElement.insertBefore(this.#backdropAnchor, backdrop);
      backdrop.classList.add('menu-drawer__backdrop--portaled');
      document.body.appendChild(backdrop);
    }

    drawer.classList.add('menu-drawer--portaled');
    document.body.appendChild(drawer);
  }

  #unportalDrawer() {
    const drawer = this.refs.menuDrawer;
    if (!drawer.classList.contains('menu-drawer--portaled')) return;

    if (this.#drawerAnchor?.parentElement) {
      this.#drawerAnchor.parentElement.insertBefore(drawer, this.#drawerAnchor);
      this.#drawerAnchor.remove();
    }
    this.#drawerAnchor = null;

    const backdrop = this.#getBackdrop();
    if (backdrop && this.#backdropAnchor?.parentElement) {
      this.#backdropAnchor.parentElement.insertBefore(backdrop, this.#backdropAnchor);
      this.#backdropAnchor.remove();
      backdrop.classList.remove('menu-drawer__backdrop--portaled', 'menu-drawer__backdrop--open');
    }
    this.#backdropAnchor = null;

    drawer.classList.remove('menu-drawer--portaled', 'menu-drawer--open');
  }

  /**
   * Attach animationend event listeners to all animated elements to remove will-change after animation
   * to remove the stacking context and allow submenus to be positioned correctly
   */
  #setupAnimatedElementListeners() {
    const allAnimated = this.querySelectorAll('.menu-drawer__animated-element');
    allAnimated.forEach((element) => {
      element.addEventListener('animationend', removeWillChangeOnAnimationEnd);
    });
  }

  /**
   * Temporarily disables accordion animations to prevent unwanted transitions when the drawer opens.
   * Adds a no-animation class to accordion content elements, then removes it after 100ms to
   * re-enable animations for user interactions.
   * @param {HTMLDetailsElement} details - The details element containing the accordions
   */
  preventInitialAccordionAnimations(details) {
    const content = details.querySelectorAll('accordion-custom .details-content');

    content.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.classList.add('details-content--no-animation');
      }
    });
    setTimeout(() => {
      content.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.remove('details-content--no-animation');
        }
      });
    }, 100);
  }
}

if (!customElements.get('header-drawer')) {
  customElements.define('header-drawer', HeaderDrawer);
}

/**
 * Reset an open details element to its original state
 *
 * @param {HTMLDetailsElement} element
 */
function reset(element) {
  element.classList.remove('menu-open');
  element.removeAttribute('open');
  const summary = element.querySelector('summary');
  summary?.setAttribute('aria-expanded', 'false');
  summary?.removeAttribute('aria-hidden');
}
