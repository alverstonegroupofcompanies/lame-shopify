/**
 * Brand filter — Our Products collection.
 * Client-side show/hide by data-brand-slug; URL kept in sync for pagination.
 */

const LAME_BRAND_FILTER_HIDDEN = 'lame-brand-filter-hidden';

/** @param {string} vendor */
function lameBrandSlugFromVendor(vendor) {
  const raw = (vendor || '').trim().toLowerCase();
  if (!raw) return 'other';
  if (raw.includes('lamstone')) return 'lamstone-healthcare';
  return raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** @returns {HTMLElement | null} */
function lameGetProductsColumn() {
  return document.querySelector('.lame-collection-products-column');
}

/** @param {string} slug */
function lameApplyBrandFilter(slug) {
  const productsColumn = lameGetProductsColumn();
  if (!productsColumn) return;

  const normalizedSlug = (slug || '').trim();
  const isFiltered = normalizedSlug !== '';

  productsColumn.classList.toggle('lame-collection-products-column--brand-selected', isFiltered);

  if (isFiltered) {
    productsColumn.dataset.activeBrand = normalizedSlug;
  } else {
    delete productsColumn.dataset.activeBrand;
  }

  const items = productsColumn.querySelectorAll('[data-brand-slug]');
  let visibleCount = 0;

  items.forEach((item) => {
    const itemSlug = (item.getAttribute('data-brand-slug') || '').trim();
    const show = !isFiltered || itemSlug === normalizedSlug;
    /** @type {HTMLElement} */ (item).classList.toggle(LAME_BRAND_FILTER_HIDDEN, !show);
    if (show) visibleCount += 1;
  });

  const emptyEl = productsColumn.querySelector('[data-lame-brand-filter-empty]');
  if (emptyEl instanceof HTMLElement) {
    emptyEl.hidden = !isFiltered || visibleCount > 0;
  }
}

/** @param {HTMLSelectElement} select */
function lameSelectedBrandFromDropdown(select) {
  const selected = select.options[select.selectedIndex];
  if (!selected) return { slug: '', vendorLabel: '' };

  const slug = (selected.dataset.brandSlug || '').trim();
  const vendorLabel = (selected.dataset.vendorLabel || selected.textContent?.replace(/\s*\(\d+\)\s*$/, '').trim() || '').trim();

  return { slug, vendorLabel };
}

/** @param {HTMLSelectElement} select */
function lameBuildBrandFilterUrl(select) {
  const baseUrl = select.dataset.collectionUrl || window.location.pathname;
  const url = new URL(baseUrl, window.location.origin);
  const current = new URL(window.location.href);

  for (const [key, value] of current.searchParams.entries()) {
    if (key.startsWith('filter.') && key !== 'filter.p.vendor') {
      url.searchParams.set(key, value);
    }
  }

  url.searchParams.delete('page');

  const { slug, vendorLabel } = lameSelectedBrandFromDropdown(select);

  if (slug && vendorLabel) {
    url.searchParams.set('filter.p.vendor', vendorLabel);
  } else {
    url.searchParams.delete('filter.p.vendor');
  }

  return url.toString();
}

/** @param {string} slug */
function lameSyncBrandDropdown(slug) {
  const select = document.querySelector('[data-brand-filter]');
  if (!(select instanceof HTMLSelectElement)) return;

  const normalizedSlug = (slug || '').trim();
  const option = Array.from(select.options).find((opt) => (opt.dataset.brandSlug || '').trim() === normalizedSlug);

  if (option) {
    select.value = option.value;
  } else if (!normalizedSlug) {
    select.selectedIndex = 0;
  }
}

/** @param {string} vendorLabel */
function lameSyncSidebarBrandCheckboxes(vendorLabel) {
  const panel = document.querySelector('#facet-inputs-filter-p-vendor');
  if (!panel) return;

  const normalizedLabel = (vendorLabel || '').trim();

  panel.querySelectorAll('input[name="filter.p.vendor"]').forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const label = (input.dataset.label || input.value || '').trim();
    input.checked = Boolean(normalizedLabel) && label === normalizedLabel;
  });
}

/** @param {HTMLSelectElement} select */
function lameReadBrandSlugFromPage(select) {
  const params = new URLSearchParams(window.location.search);
  const vendorParam = params.get('filter.p.vendor');

  if (vendorParam) {
    const vendorDecoded = decodeURIComponent(vendorParam.replace(/\+/g, ' '));
    const slug = lameBrandSlugFromVendor(vendorDecoded);

    const option = Array.from(select.options).find((opt) => {
      const optLabel = (opt.dataset.vendorLabel || opt.textContent?.replace(/\s*\(\d+\)\s*$/, '').trim() || '').trim();
      const optSlug = (opt.dataset.brandSlug || '').trim();
      return optSlug === slug || optLabel === vendorDecoded;
    });

    if (option) select.value = option.value;
    return slug;
  }

  const productsColumn = lameGetProductsColumn();
  const columnSlug = productsColumn?.dataset.activeBrand?.trim();
  if (columnSlug) {
    lameSyncBrandDropdown(columnSlug);
    return columnSlug;
  }

  const hashMatch = window.location.hash.match(/^#brand-(.+)$/);
  if (hashMatch) {
    const slug = hashMatch[1];
    lameSyncBrandDropdown(slug);
    return slug;
  }

  return '';
}

/** @param {HTMLSelectElement} select */
function lameHandleBrandDropdownChange(select) {
  const { slug, vendorLabel } = lameSelectedBrandFromDropdown(select);

  lameApplyBrandFilter(slug);
  lameSyncSidebarBrandCheckboxes(vendorLabel);

  const url = lameBuildBrandFilterUrl(select);

  if (select.hasAttribute('data-server-vendor-facet')) {
    const facetsForm = document.querySelector(
      '.collection-template-our-products facets-form-component, .all-products-page facets-form-component'
    );

    if (facetsForm && typeof facetsForm.updateFiltersByURL === 'function') {
      facetsForm.updateFiltersByURL(url);
      return;
    }

    window.location.assign(url);
    return;
  }

  if (url !== window.location.href) {
    history.replaceState({ lameBrandFilter: slug }, '', url);
  }
}

function lameReapplyBrandFilterFromPage() {
  const select = document.querySelector('[data-brand-filter]');
  if (!(select instanceof HTMLSelectElement)) return;

  const slug = lameReadBrandSlugFromPage(select);
  const { vendorLabel } = lameSelectedBrandFromDropdown(select);

  lameApplyBrandFilter(slug);
  lameSyncSidebarBrandCheckboxes(vendorLabel);
}

function lameScheduleBrandFilterReapply() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      lameReapplyBrandFilterFromPage();
    });
  });
}

function lameInitBrandFilters() {
  lameReapplyBrandFilterFromPage();
}

if (!document.documentElement.dataset.lameBrandFilterBound) {
  document.documentElement.dataset.lameBrandFilterBound = 'true';

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.matches('[data-brand-filter]')) return;
    lameHandleBrandDropdownChange(target);
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name !== 'filter.p.vendor') return;
    if (!target.closest('#facet-inputs-filter-p-vendor')) return;

    const panel = target.closest('#facet-inputs-filter-p-vendor');
    const checked = panel?.querySelector('input[name="filter.p.vendor"]:checked');
    const vendorLabel =
      checked instanceof HTMLInputElement ? (checked.dataset.label || checked.value || '').trim() : '';
    const slug = vendorLabel ? lameBrandSlugFromVendor(vendorLabel) : '';

    lameApplyBrandFilter(slug);
    lameSyncBrandDropdown(slug);
  });

  document.addEventListener('filter:update', lameScheduleBrandFilterReapply);

  window.addEventListener('popstate', () => {
    lameScheduleBrandFilterReapply();
  });
}

lameInitBrandFilters();
document.addEventListener('shopify:section:load', lameScheduleBrandFilterReapply);
