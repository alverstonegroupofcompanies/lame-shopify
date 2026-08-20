import { mediaQueryLarge, requestIdleCallback, startViewTransition } from '@theme/utilities';
import { sectionRenderer } from '@theme/section-renderer';
import PaginatedList from '@theme/paginated-list';

/**
 * A custom element that renders a pagniated results list
 */
export default class ResultsList extends PaginatedList {
  connectedCallback() {
    super.connectedCallback();

    mediaQueryLarge.addEventListener('change', this.#handleMediaQueryChange);
    this.setAttribute('initialized', '');
  }

  disconnectedCallback() {
    mediaQueryLarge.removeEventListener('change', this.#handleMediaQueryChange);
  }

  /**
   * Updates the layout.
   *
   * @param {Event} event
   */
  updateLayout({ target }) {
    if (!(target instanceof HTMLInputElement)) return;

    this.#animateLayoutChange(target.value);
  }

  /**
   * Sets the layout.
   *
   * @param {string} value
   */
  #animateLayoutChange = async (value) => {
    const { grid } = this.refs;

    if (!grid) return;

    await startViewTransition(() => this.#setLayout(value), ['product-grid']);

    requestIdleCallback(() => {
      const viewport = mediaQueryLarge.matches ? 'desktop' : 'mobile';
      sessionStorage.setItem(`product-grid-view-${viewport}`, value);
    });
  };

  /**
   * Animates the layout change.
   *
   * @param {string} value
   */
  #setLayout(value) {
    const { grid } = this.refs;
    if (!grid) return;
    grid.setAttribute('product-grid-view', value);
  }

  /**
   * Handles the media query change event.
   *
   * @param {MediaQueryListEvent} event
   */
  #handleMediaQueryChange = (event) => {
    const targetElement = event.matches
      ? this.querySelector('[data-grid-layout="desktop-default-option"]')
      : this.querySelector('[data-grid-layout="mobile-option"]');

    if (!(targetElement instanceof HTMLInputElement)) return;

    targetElement.checked = true;
    this.#setLayout('default');
  };

  /**
   * Our Products — load next/previous 12 via section morph (replace grid, do not append).
   * @param {Record<string, string>} data - URL search params from pagination link
   * @param {Event} event
   */
  async onCollectionPaginationClick(data, event) {
    event.preventDefault();

    const detail = { data: data || {}, handled: false };
    document.dispatchEvent(new CustomEvent('lame:collection-pagination', { detail }));
    if (detail.handled) return;

    const url = new URL(window.location.href);
    const preservedBrand = url.searchParams.get('brand');
    const preservedDiscount = url.searchParams.get('discount');
    const lastPageAttr = this.querySelector('[data-last-page]')?.getAttribute('data-last-page');
    const lastPage = Number(lastPageAttr || 0);

    for (const [key, value] of Object.entries(data || {})) {
      url.searchParams.set(key, value);
    }

    // Never navigate past the last available page for the current filtered set.
    const requestedPage = Number(url.searchParams.get('page') || 1);
    if (lastPage > 0 && requestedPage > lastPage) {
      url.searchParams.delete('page');
    }

    if (preservedBrand) url.searchParams.set('brand', preservedBrand);
    if (preservedDiscount) url.searchParams.set('discount', preservedDiscount);
    url.searchParams.delete('section_id');

    this.pages.clear();

    await startViewTransition(
      () => sectionRenderer.renderSection(this.sectionId, { cache: false, url }),
      ['product-grid']
    );

    history.pushState('', '', url.toString());
    this.#scrollProductsColumnToTop();

    // If morph still landed past results, force page 1.
    const emptyGrid = this.querySelector('.main-collection-grid__empty');
    const productItems = this.querySelectorAll(
      '[data-testid="product-grid"] > li, [data-testid="product-grid-grouped"] li[data-brand-slug]'
    );
    const pageNow = Number(new URL(window.location.href).searchParams.get('page') || 1);
    if (emptyGrid && pageNow > 1 && productItems.length === 0) {
      const fixUrl = new URL(window.location.href);
      fixUrl.searchParams.delete('page');
      fixUrl.searchParams.delete('section_id');
      await sectionRenderer.renderSection(this.sectionId, { cache: false, url: fixUrl });
      history.replaceState('', '', fixUrl.toString());
      this.#scrollProductsColumnToTop();
    }
  }

  #scrollProductsColumnToTop() {
    const column = this.querySelector('[data-lame-products-scroll]');
    const results = this.querySelector('#ResultsList');

    if (column instanceof HTMLElement) {
      column.scrollTop = 0;
    }

    if (results instanceof HTMLElement) {
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

if (!customElements.get('results-list')) {
  customElements.define('results-list', ResultsList);
}
