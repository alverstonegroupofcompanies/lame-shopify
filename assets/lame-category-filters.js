/**
 * Category collection toolbar — auto-submit price/brand/sort, clear filters.
 */
class LameCategoryFilters extends HTMLElement {
  connectedCallback() {
    this.#form = this.querySelector('[data-lame-category-filter-form]');
    if (!this.#form) return;

    this.#priceField = this.#form.querySelector('[data-price-filter]');
    this.#priceHiddenWrap = this.#form.querySelector('[data-price-hidden-inputs]');

    this.#form.querySelectorAll('[data-auto-submit]').forEach((field) => {
      field.addEventListener('change', () => {
        if (field.name === 'filter.p.vendor' && field.value === '') {
          field.removeAttribute('name');
        }

        if (field.matches('[data-price-filter]')) {
          this.#syncPriceHiddenInputs(field.value);
        }

        this.#form.requestSubmit();
      });
    });

    this.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
      const sortField = this.#form.querySelector('[name="sort_by"]');
      const sortBy = sortField?.value;
      const baseUrl = this.#form.action.replace(/\/$/, '') || window.location.pathname;
      const url = new URL(baseUrl, window.location.origin);

      if (sortBy) {
        url.searchParams.set('sort_by', sortBy);
      }

      window.location.assign(url.toString());
    });
  }

  #syncPriceHiddenInputs(rangeKey) {
    if (!this.#priceHiddenWrap) return;

    this.#priceHiddenWrap.innerHTML = '';

    if (!rangeKey || rangeKey === 'all') return;

    const [gte, lte] = rangeKey.split('-');
    if (!gte || !lte) return;

    const gteInput = document.createElement('input');
    gteInput.type = 'hidden';
    gteInput.name = 'filter.v.price.gte';
    gteInput.value = gte;

    const lteInput = document.createElement('input');
    lteInput.type = 'hidden';
    lteInput.name = 'filter.v.price.lte';
    lteInput.value = lte;

    this.#priceHiddenWrap.append(gteInput, lteInput);
  }

  /** @type {HTMLFormElement | null} */
  #form = null;

  /** @type {HTMLSelectElement | null} */
  #priceField = null;

  /** @type {HTMLElement | null} */
  #priceHiddenWrap = null;
}

if (!customElements.get('lame-category-filters')) {
  customElements.define('lame-category-filters', LameCategoryFilters);
}
