/**
 * Category collection toolbar — auto-submit brand/sort, clear filters.
 */
class LameCategoryFilters extends HTMLElement {
  connectedCallback() {
    this.#form = this.querySelector('[data-lame-category-filter-form]');
    if (!this.#form) return;

    this.#form.querySelectorAll('[data-auto-submit]').forEach((field) => {
      field.addEventListener('change', () => {
        if (field.name === 'filter.p.vendor' && field.value === '') {
          field.removeAttribute('name');
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

  /** @type {HTMLFormElement | null} */
  #form = null;
}

if (!customElements.get('lame-category-filters')) {
  customElements.define('lame-category-filters', LameCategoryFilters);
}
