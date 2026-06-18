/**
 * Brand dropdown: server navigation when Shopify vendor facet is enabled,
 * client-side product filtering otherwise.
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
    /** @type {HTMLElement} */ (section).hidden = !show;
  });

  productsColumn.querySelectorAll('[data-brand]').forEach((item) => {
    const itemSlug = lameBrandSlugFromVendor(item.getAttribute('data-brand'));
    const show = !isFiltered || itemSlug === normalizedSlug;
    /** @type {HTMLElement} */ (item).hidden = !show;
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
  const option = Array.from(select.options).find((opt) => opt.dataset.brandSlug === slug);
  if (option) select.value = option.value;
  return slug;
}

/** @param {HTMLSelectElement} select */
function lameInitBrandFilterSelect(select) {
  if (select.dataset.brandFilterInit === 'true') return;
  select.dataset.brandFilterInit = 'true';

  const useClientFilter = select.hasAttribute('data-client-filter');

  const applySelection = () => {
    const selected = select.options[select.selectedIndex];
    const slug = selected?.dataset.brandSlug || '';
    lameApplyBrandFilter(slug);
  };

  if (useClientFilter) {
    const initialSlug = lameSyncBrandFilterFromUrl(select);
    lameApplyBrandFilter(initialSlug);
  }

  select.addEventListener('change', () => {
    const selected = select.options[select.selectedIndex];
    const filterUrl = selected?.dataset.filterUrl || select.dataset.collectionUrl || '';

    if (useClientFilter) {
      applySelection();
      const url = new URL(window.location.href);
      url.hash = '';

      if (selected?.dataset.brandSlug) {
        const vendorLabel = selected.textContent?.replace(/\s*\(\d+\)\s*$/, '').trim() || '';
        url.searchParams.set('filter.p.vendor', vendorLabel);
      } else {
        url.searchParams.delete('filter.p.vendor');
      }

      window.history.replaceState({}, '', url.toString());
      return;
    }

    if (filterUrl) window.location.href = filterUrl;
  });
}

function lameInitBrandFilters() {
  document.querySelectorAll('[data-brand-filter]').forEach((element) => {
    if (element instanceof HTMLSelectElement) lameInitBrandFilterSelect(element);
  });
}

lameInitBrandFilters();
document.addEventListener('shopify:section:load', lameInitBrandFilters);
