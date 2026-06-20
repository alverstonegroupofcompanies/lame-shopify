/**
 * Brand filter for Our Products — client-side visibility + server-side section refresh.
 * Slug rules must match snippets/lame-vendor-slug.liquid.
 */

const VENDOR_FILTER_HIDDEN_CLASS = 'lame-brand-filter--hidden';
const COLLECTION_FILTER_ROOTS = ['.collection-template-our-products', '.lame-collection-premium-active'];

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
 * @returns {HTMLElement | null}
 */
export function getCollectionFilterRoot() {
  for (const selector of COLLECTION_FILTER_ROOTS) {
    const root = document.querySelector(selector);
    if (root instanceof HTMLElement) return root;
  }

  return null;
}

/**
 * @returns {boolean}
 */
export function shouldRunVendorBrandFilter() {
  if (!getVendorFilterInputs().length) return false;
  return getCollectionFilterRoot() !== null;
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
    const trimmed = input.value.trim();
    if (trimmed) slugs.add(trimmed);
  }

  return slugs;
}

function normalizeVendorName(name) {
  return (name || '').trim().toLowerCase();
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
  const brandNormalized = normalizeVendorName(brandName);

  for (const selected of selectedSlugs) {
    for (const candidate of candidates) {
      if (slugFamilyMatch(candidate, selected)) return true;
    }

    if (brandNormalized && brandNormalized === normalizeVendorName(selected)) return true;
  }

  return false;
}

/**
 * @param {Element} root
 */
function resetVendorBrandFilterVisibility(root) {
  const selectors = [
    'li[data-brand-slug]',
    'li[data-brand]',
    '.lame-collection-brand-section[data-brand-slug]',
  ];

  for (const selector of selectors) {
    for (const element of root.querySelectorAll(selector)) {
      if (!(element instanceof HTMLElement)) continue;
      element.classList.remove(VENDOR_FILTER_HIDDEN_CLASS);
      element.hidden = false;
    }
  }
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
 * @param {HTMLUListElement} list
 * @param {string} name
 * @param {HTMLElement} filterComponent
 * @param {Set<string>} existingSlugs
 * @param {number} augmentIndex
 * @returns {number}
 */
function appendVendorCheckbox(list, name, filterComponent, existingSlugs, augmentIndex) {
  const slug = vendorToSlug(name);
  const alreadyListed = [...existingSlugs].some((existing) => slugFamilyMatch(existing, slug));
  if (alreadyListed || !name) return augmentIndex;

  const templateItem =
    list.querySelector('.facets__inputs-list-item:not([data-lame-vendor-augmented]):not([data-lame-vendor-template])') ||
    list.querySelector('[data-lame-vendor-template]');
  if (!(templateItem instanceof HTMLLIElement)) return augmentIndex;

  const clone = templateItem.cloneNode(true);
  if (!(clone instanceof HTMLLIElement)) return augmentIndex;

  const input = clone.querySelector('input[type="checkbox"]');
  const labelText = clone.querySelector('.checkbox__label-text');
  const label = clone.querySelector('label.checkbox__label');
  if (!(input instanceof HTMLInputElement) || !(labelText instanceof HTMLElement)) return augmentIndex;

  const nextIndex = augmentIndex + 1;
  const componentId = filterComponent.id || 'vendor-filter';
  const inputId = `Filter-filter-p-vendor-augment-${nextIndex}-${componentId}`;

  input.value = name;
  input.checked = false;
  input.disabled = false;
  input.id = inputId;
  input.removeAttribute('disabled');
  if (label instanceof HTMLLabelElement) label.htmlFor = inputId;
  labelText.textContent = name;

  clone.setAttribute('data-lame-vendor-augmented', 'true');
  clone.setAttribute('data-skip-node-update', 'true');
  list.appendChild(clone);
  existingSlugs.add(slug);

  return nextIndex;
}

/**
 * Add checkboxes for vendors listed in collection.all_vendors JSON.
 */
export function augmentVendorFilterFromCatalog() {
  const catalogNode = document.getElementById('LameCollectionAllVendors');
  if (!(catalogNode instanceof HTMLScriptElement)) return;

  /** @type {string[]} */
  let vendors = [];
  try {
    const parsed = JSON.parse(catalogNode.textContent || '[]');
    if (Array.isArray(parsed)) vendors = parsed.filter((entry) => typeof entry === 'string' && entry.trim());
  } catch {
    return;
  }

  if (!vendors.length) return;

  const filterComponents = document.querySelectorAll('[data-lame-vendor-filter]');
  if (!filterComponents.length) return;

  for (const filterComponent of filterComponents) {
    const list = filterComponent.querySelector('ul.facets__inputs-list');
    if (!(list instanceof HTMLUListElement)) continue;

    const existingSlugs = new Set(
      [...list.querySelectorAll('input[type="checkbox"][name="filter.p.vendor"]')].map((input) =>
        vendorToSlug(input instanceof HTMLInputElement ? input.value : '')
      )
    );

    let augmentIndex = list.querySelectorAll('[data-lame-vendor-augmented]').length;

    for (const vendorName of vendors) {
      augmentIndex = appendVendorCheckbox(list, vendorName.trim(), filterComponent, existingSlugs, augmentIndex);
    }
  }
}

/**
 * Add Brand filter checkboxes for vendors present on the grid but missing from Liquid list.
 */
export function augmentVendorFilterFromGrid() {
  augmentVendorFilterFromCatalog();

  const root = getCollectionFilterRoot();
  if (!root) return;

  /** @type {Map<string, string>} */
  const brandsFromGrid = new Map();

  root.querySelectorAll('[data-brand-slug][data-brand]').forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    const slug = (element.getAttribute('data-brand-slug') || '').trim();
    const name = (element.getAttribute('data-brand') || '').trim();
    if (!slug || !name || slug === 'other') return;

    if (!brandsFromGrid.has(slug)) brandsFromGrid.set(slug, name);
  });

  if (!brandsFromGrid.size) return;

  const filterComponents = document.querySelectorAll('[data-lame-vendor-filter]');
  if (!filterComponents.length) return;

  for (const filterComponent of filterComponents) {
    const list = filterComponent.querySelector('ul.facets__inputs-list');
    if (!(list instanceof HTMLUListElement)) continue;

    const existingSlugs = new Set(
      [...list.querySelectorAll('input[type="checkbox"][name="filter.p.vendor"]')].map((input) =>
        vendorToSlug(input instanceof HTMLInputElement ? input.value : '')
      )
    );

    let augmentIndex = list.querySelectorAll('[data-lame-vendor-augmented]').length;

    for (const [slug, name] of brandsFromGrid) {
      augmentIndex = appendVendorCheckbox(list, name, filterComponent, existingSlugs, augmentIndex);
    }
  }
}

/**
 * Show/hide products and brand sections for the current checkbox selection.
 */
export function applyVendorBrandFilter() {
  augmentVendorFilterFromGrid();

  const root = getCollectionFilterRoot();
  if (!root) return;

  resetVendorBrandFilterVisibility(root);

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
  const root = getCollectionFilterRoot();
  if (!root) return;

  augmentVendorFilterFromGrid();

  if (!getVendorFilterInputs().length) return;

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
