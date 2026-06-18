/**
 * Brand dropdown + sidebar Brand facet for Our Products.
 * Always applies client-side filtering; persists via facets AJAX when available.
 */

/** @param {string} vendor */
function lameBrandSlugFromVendor(vendor) {
  const raw = (vendor || '').trim().toLowerCase();
  if (!raw) return 'other';
  if (raw.includes('lamstone')) return 'lamstone-healthcare';
  return raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** @param {string} slug */
function lameApplyBrandFilter(slug) {
  const productsColumn = document.querySelector('.lame-collection-products-column');
  if (!productsColumn) return;

  const normalizedSlug = slug || '';
  const isFiltered = normalizedSlug !== '';

  productsColumn.classList.toggle('lame-collection-products-column--brand-selected', isFiltered);

  if (isFiltered) {
    productsColumn.dataset.activeBrand = normalizedSlug;
  } else {
    delete productsColumn.dataset.activeBrand;
  }

  productsColumn.querySelectorAll('.lame-collection-brand-section').forEach((section) => {
    const sectionSlug = section.id.replace(/^brand-/, '');
    const show = !isFiltered || sectionSlug === normalizedSlug;
    /** @type {HTMLElement} */ (section).classList.toggle('lame-brand-filter-hidden', !show);
    /** @type {HTMLElement} */ (section).hidden = !show;
  });

  productsColumn.querySelectorAll('[data-brand]').forEach((item) => {
    const itemSlug = lameBrandSlugFromVendor(item.getAttribute('data-brand'));
    const show = !isFiltered || itemSlug === normalizedSlug;
    /** @type {HTMLElement} */ (item).classList.toggle('lame-brand-filter-hidden', !show);
    /** @type {HTMLElement} */ (item).hidden = !show;
  });
}

/** @param {HTMLSelectElement} select */
function lameVendorLabelFromOption(select) {
  const selected = select.options[select.selectedIndex];
  if (!selected || !selected.dataset.brandSlug) return '';
  return selected.textContent?.replace(/\s*\(\d+\)\s*$/, '').trim() || '';
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

  const selected = select.options[select.selectedIndex];
  const filterUrl = selected?.dataset.filterUrl;

  if (filterUrl) {
    try {
      const resolved = new URL(filterUrl, window.location.origin);
      for (const [key, value] of url.searchParams.entries()) {
        if (key.startsWith('filter.') && key !== 'filter.p.vendor' && !resolved.searchParams.has(key)) {
          resolved.searchParams.set(key, value);
        }
      }
      return resolved.toString();
    } catch {
      // fall through
    }
  }

  const vendorLabel = lameVendorLabelFromOption(select);
  if (vendorLabel) {
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

  const option = Array.from(select.options).find((opt) => opt.dataset.brandSlug === slug);
  if (option) {
    select.value = option.value;
  } else if (!slug) {
    select.value = '';
  }
}

/** @param {string} vendorLabel */
function lameSyncSidebarBrandCheckboxes(vendorLabel) {
  const panel = document.querySelector('#facet-inputs-filter-p-vendor');
  if (!panel) return;

  panel.querySelectorAll('input[name="filter.p.vendor"]').forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const label = (input.dataset.label || input.value || '').trim();
    input.checked = Boolean(vendorLabel) && label === vendorLabel;
  });
}

/** @param {HTMLSelectElement} select */
function lameSyncBrandFilterFromUrl(select) {
  const params = new URLSearchParams(window.location.search);
  const vendorParam = params.get('filter.p.vendor');

  if (!vendorParam) {
    const hashMatch = window.location.hash.match(/^#brand-(.+)$/);
    if (hashMatch) {
      const slug = hashMatch[1];
      const option = Array.from(select.options).find((opt) => opt.dataset.brandSlug === slug);
      if (option) {
        select.value = option.value;
        return option.dataset.brandSlug || '';
      }
    }
    return '';
  }

  const vendorDecoded = decodeURIComponent(vendorParam.replace(/\+/g, ' '));
  const slug = lameBrandSlugFromVendor(vendorDecoded);
  const option = Array.from(select.options).find((opt) => {
    const optLabel = opt.textContent?.replace(/\s*\(\d+\)\s*$/, '').trim() || '';
    return opt.dataset.brandSlug === slug || optLabel === vendorDecoded;
  });
  if (option) select.value = option.value;
  return slug;
}

/** @param {string} url */
function lamePersistBrandFilterUrl(url) {
  const facetsForm = document.querySelector(
    '.collection-template-our-products facets-form-component, .all-products-page facets-form-component'
  );

  if (facetsForm && typeof facetsForm.updateFiltersByURL === 'function') {
    facetsForm.updateFiltersByURL(url);
    return;
  }

  window.location.assign(url);
}

/** @param {HTMLSelectElement} select */
function lameInitBrandFilterSelect(select) {
  if (select.dataset.brandFilterInit === 'true') return;
  select.dataset.brandFilterInit = 'true';

  const applyFromSelect = (persist = true) => {
    const selected = select.options[select.selectedIndex];
    const slug = selected?.dataset.brandSlug || '';
    const vendorLabel = lameVendorLabelFromOption(select);

    lameApplyBrandFilter(slug);
    lameSyncSidebarBrandCheckboxes(vendorLabel);

    if (!persist) return;

    const url = lameBuildBrandFilterUrl(select);
    if (url !== window.location.href) {
      lamePersistBrandFilterUrl(url);
    }
  };

  const initialSlug = lameSyncBrandFilterFromUrl(select);
  lameApplyBrandFilter(initialSlug);
  lameSyncSidebarBrandCheckboxes(
    initialSlug
      ? lameVendorLabelFromOption(select) ||
          decodeURIComponent(
            new URLSearchParams(window.location.search).get('filter.p.vendor')?.replace(/\+/g, ' ') || ''
          )
      : ''
  );

  select.addEventListener('change', () => applyFromSelect(true));
}

function lameInitSidebarBrandFacet() {
  const panel = document.querySelector('#facet-inputs-filter-p-vendor');
  if (!panel || panel.dataset.brandFacetInit === 'true') return;
  panel.dataset.brandFacetInit = 'true';

  panel.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name !== 'filter.p.vendor') return;

    const checked = panel.querySelector('input[name="filter.p.vendor"]:checked');
    const vendorLabel = checked instanceof HTMLInputElement ? (checked.dataset.label || checked.value || '').trim() : '';
    const slug = vendorLabel ? lameBrandSlugFromVendor(vendorLabel) : '';

    lameApplyBrandFilter(slug);
    lameSyncBrandDropdown(slug);
  });
}

function lameReapplyBrandFilterFromPage() {
  const select = document.querySelector('[data-brand-filter]');
  if (!(select instanceof HTMLSelectElement)) return;

  const slug = lameSyncBrandFilterFromUrl(select);
  lameApplyBrandFilter(slug);
  lameSyncSidebarBrandCheckboxes(
    slug
      ? lameVendorLabelFromOption(select) ||
          decodeURIComponent(
            new URLSearchParams(window.location.search).get('filter.p.vendor')?.replace(/\+/g, ' ') || ''
          )
      : ''
  );
}

function lameInitBrandFilters() {
  document.querySelectorAll('[data-brand-filter]').forEach((element) => {
    if (element instanceof HTMLSelectElement) lameInitBrandFilterSelect(element);
  });
  lameInitSidebarBrandFacet();
  lameReapplyBrandFilterFromPage();
}

lameInitBrandFilters();
document.addEventListener('shopify:section:load', () => {
  document.querySelectorAll('[data-brand-filter]').forEach((element) => {
    if (element instanceof HTMLSelectElement) {
      delete element.dataset.brandFilterInit;
    }
  });
  const panel = document.querySelector('#facet-inputs-filter-p-vendor');
  if (panel) delete panel.dataset.brandFacetInit;

  lameInitBrandFilters();
});
