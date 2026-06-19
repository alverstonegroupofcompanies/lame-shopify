/**
 * Brand filter for Our Products — client-side visibility + server-side section refresh.
 * Slug rules must match snippets/lame-vendor-slug.liquid.
 */

const VENDOR_FILTER_HIDDEN_CLASS = 'lame-brand-filter--hidden';
const OUR_PRODUCTS_ROOT = '.collection-template-our-products';

/** @type {(() => void) | undefined} */
let morphCompleteHandler;

/**
 * @param {string} vendor
 * @returns {string}
 */
export function vendorToSlug(vendor) {
  const raw = (vendor || '').trim();
  if (!raw) return 'other';

  const lower = raw.toLowerCase();
  if (lower.includes('lamstone')) return 'lamstone-healthcare';

  return handleize(raw);
}

/**
 * @param {string} value
 * @returns {string}
 */
function handleize(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function slugFamilyMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;

  const strip = (slug) => slug.replace(/-/g, '');
  const aStripped = strip(a);
  const bStripped = strip(b);

  if (aStripped && aStripped === bStripped) return true;
  if (aStripped.length >= 4 && bStripped.length >= 4) {
    if (aStripped.includes(bStripped) || bStripped.includes(aStripped)) return true;
  }

  return false;
}

/**
 * @returns {HTMLInputElement[]}
 */
export function getVendorFilterInputs() {
  return [
    ...document.querySelectorAll('[data-lame-vendor-filter] input[type="checkbox"][name="filter.p.vendor"]'),
    ...document.querySelectorAll('input[type="checkbox"][name="filter.p.vendor"]'),
  ].filter((input, index, list) => input instanceof HTMLInputElement && list.indexOf(input) === index);
}

/**
 * @returns {Set<string>}
 */
export function getSelectedVendorSlugs() {
  const slugs = new Set();

  for (const input of getVendorFilterInputs()) {
    if (!input.checked) continue;
    slugs.add(vendorToSlug(input.value));
  }

  return slugs;
}

/**
 * @param {string} productSlug
 * @param {string} brandName
 * @param {Set<string>} selectedSlugs
 * @returns {boolean}
 */
function productMatchesSelection(productSlug, brandName, selectedSlugs) {
  if (selectedSlugs.size === 0) return true;

  const candidates = new Set([productSlug, vendorToSlug(brandName)].filter(Boolean));

  for (const selected of selectedSlugs) {
    for (const candidate of candidates) {
      if (slugFamilyMatch(candidate, selected)) return true;
    }
  }

  return false;
}

/**
 * @param {Element} root
 * @param {Set<string>} selectedSlugs
 */
function toggleBrandSections(root, selectedSlugs) {
  const sections = root.querySelectorAll('.lame-collection-brand-section[data-brand-slug]');

  for (const section of sections) {
    if (!(section instanceof HTMLElement)) continue;

    const sectionSlug = section.getAttribute('data-brand-slug') || '';
    const brandName = section.getAttribute('data-brand') || '';
    const visible = productMatchesSelection(sectionSlug, brandName, selectedSlugs);

    section.classList.toggle(VENDOR_FILTER_HIDDEN_CLASS, !visible);
    section.hidden = !visible;
  }
}

/**
 * @param {Element} root
 * @param {Set<string>} selectedSlugs
 * @returns {number}
 */
function toggleProductItems(root, selectedSlugs) {
  const items = root.querySelectorAll('li[data-brand-slug], li[data-brand]');
  let visibleCount = 0;

  for (const item of items) {
    if (!(item instanceof HTMLElement)) continue;

    const productSlug = item.getAttribute('data-brand-slug') || '';
    const brandName = item.getAttribute('data-brand') || '';
    const visible = productMatchesSelection(productSlug, brandName, selectedSlugs);

    item.classList.toggle(VENDOR_FILTER_HIDDEN_CLASS, !visible);
    item.hidden = !visible;

    if (visible) visibleCount += 1;
  }

  return visibleCount;
}

/**
 * Show/hide products and brand sections for the current checkbox selection.
 */
export function applyVendorBrandFilter() {
  const root = document.querySelector(OUR_PRODUCTS_ROOT);
  if (!root) return;

  const selectedSlugs = getSelectedVendorSlugs();
  const productsColumn = root.querySelector('.lame-collection-products-column');

  if (productsColumn instanceof HTMLElement) {
    productsColumn.classList.toggle('lame-collection-products-column--brand-selected', selectedSlugs.size > 0);
  }

  toggleBrandSections(root, selectedSlugs);
  const visibleCount = toggleProductItems(root, selectedSlugs);

  const emptyState = root.querySelector('.lame-brand-filter-empty');
  if (emptyState instanceof HTMLElement) {
    const showEmpty = selectedSlugs.size > 0 && visibleCount === 0;
    emptyState.hidden = !showEmpty;
  }
}

/**
 * @param {URLSearchParams} [urlParams]
 */
export function syncVendorCheckboxesFromUrl(urlParams) {
  const params = urlParams ?? new URL(window.location.href).searchParams;
  const urlSlugs = new Set(params.getAll('filter.p.vendor').map((value) => vendorToSlug(value)));

  for (const input of getVendorFilterInputs()) {
    const inputSlug = vendorToSlug(input.value);
    input.checked = [...urlSlugs].some((slug) => slugFamilyMatch(inputSlug, slug));
  }
}

/**
 * @param {URLSearchParams} params
 */
export function syncVendorParamsToUrlSearchParams(params) {
  const vendorInputs = getVendorFilterInputs();
  if (!vendorInputs.length) return;

  params.delete('filter.p.vendor');

  const added = new Set();

  for (const input of vendorInputs) {
    if (!input.checked) continue;

    const value = input.value.trim();
    if (!value) continue;

    const slug = vendorToSlug(value);
    if (added.has(slug)) continue;

    added.add(slug);
    params.append('filter.p.vendor', value);
  }
}

/**
 * Keep desktop and drawer brand checkboxes in sync.
 * @param {HTMLInputElement} changedInput
 */
export function syncVendorCheckboxGroup(changedInput) {
  const changedSlug = vendorToSlug(changedInput.value);

  for (const input of getVendorFilterInputs()) {
    if (slugFamilyMatch(vendorToSlug(input.value), changedSlug)) {
      input.checked = changedInput.checked;
    }
  }
}

/**
 * Re-apply brand filter after section morph replaces the product grid.
 */
export function onSectionMorphComplete() {
  if (!document.querySelector('[data-lame-vendor-filter]')) return;

  syncVendorCheckboxesFromUrl();
  applyVendorBrandFilter();
}

/**
 * @param {() => void} callback
 */
export function registerSectionMorphComplete(callback) {
  morphCompleteHandler = callback;
}

registerSectionMorphComplete(onSectionMorphComplete);
