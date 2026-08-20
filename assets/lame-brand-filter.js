/**
 * Brand filter for Our Products / premium collection pages.
 * Client-side hide for instant feedback + server-side filter.p.vendor reload for full catalog.
 */

import { sectionRenderer } from '@theme/section-renderer';
import { debounce, startViewTransition } from '@theme/utilities';

const HIDDEN_CLASS = 'lame-brand-filter--hidden';
const BRAND_PARAM = 'brand';
const VENDOR_PARAM = 'filter.p.vendor';
const STORAGE_PREFIX = 'lame-brand-filter:';
const CLEAR_EVENT = 'lame:clear-brand-filter';
const MORPH_EVENT = 'lame:section-morph-complete';

/** @type {boolean} */
let isReloading = false;

/**
 * @returns {HTMLElement | null}
 */
function getCollectionRoot() {
  return (
    document.querySelector('.collection-template-our-products') ||
    document.querySelector('.lame-collection-premium-active')
  );
}

/**
 * @returns {string | null}
 */
function getSectionId() {
  const resultsList = document.querySelector('results-list[section-id]');
  const sectionId = resultsList?.getAttribute('section-id');
  return sectionId || null;
}

/**
 * @param {string | null | undefined} slug
 * @returns {string}
 */
function normalizeSlug(slug) {
  return (slug || '').trim().toLowerCase();
}

/**
 * @param {string | null | undefined} name
 * @returns {string}
 */
function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

/**
 * Collapse spacing/ampersand variants so "Fair & Lovely" matches "Fair  & Lovely".
 * @param {string | null | undefined} name
 * @returns {string}
 */
function normalizeBrandLabel(name) {
  return normalizeName(name).replace(/\s+/g, ' ').replace(/\s*&\s*/g, ' & ');
}

/**
 * @returns {NodeListOf<HTMLInputElement>}
 */
function getAllBrandInputs() {
  return document.querySelectorAll('lame-brand-filter input[type="checkbox"][data-brand-slug]');
}

/**
 * @returns {Set<string>}
 */
function getSelectedSlugs() {
  /** @type {Set<string>} */
  const slugs = new Set();

  for (const input of getAllBrandInputs()) {
    if (!input.checked) continue;
    const slug = normalizeSlug(input.getAttribute('data-brand-slug'));
    if (slug) slugs.add(slug);
  }

  return slugs;
}

/**
 * @returns {string[]}
 */
function getSelectedVendorLabels() {
  /** @type {Set<string>} */
  const labels = new Set();

  for (const input of getAllBrandInputs()) {
    if (!input.checked) continue;
    const label = (input.getAttribute('data-brand-label') || '').trim();
    if (label) labels.add(label);
  }

  return [...labels];
}

/**
 * @returns {{ noResults: string, loading: string, mismatch: string, noRoot: string, vendorDisabled: string }}
 */
function getFilterMessages() {
  const el = document.querySelector('lame-brand-filter');

  return {
    noResults:
      el?.getAttribute('data-msg-no-results') || 'No products match the selected brands.',
    loading: el?.getAttribute('data-msg-loading') || 'Loading matching products...',
    mismatch:
      el?.getAttribute('data-msg-mismatch') ||
      'Brand filter mismatch. Try clearing filters and selecting again.',
    noRoot:
      el?.getAttribute('data-msg-no-root') ||
      'Brand filter could not find the product grid.',
    vendorDisabled:
      el?.getAttribute('data-msg-vendor-disabled') ||
      'Enable the Vendor filter in Shopify Search & Discovery for brand filtering to work across all products.',
  };
}

/**
 * @returns {boolean}
 */
function isVendorFilterEnabled() {
  const el = document.querySelector('lame-brand-filter');
  return el?.getAttribute('data-vendor-filter-enabled') !== 'false';
}

/**
 * @param {HTMLElement} root
 * @param {string[]} vendorParams
 * @returns {boolean}
 */
function serverFilterMayBeIgnored(root, vendorParams) {
  if (!vendorParams.length) return false;

  const vendorSet = new Set(vendorParams.map((vendor) => normalizeName(vendor)));
  const productItems = root.querySelectorAll(
    'li[data-vendor], .lame-category-shop__item[data-vendor], li[data-brand-slug], .lame-category-shop__item[data-brand-slug]'
  );

  if (!productItems.length) return false;

  for (const item of productItems) {
    if (!(item instanceof HTMLElement)) continue;
    if (item.classList.contains(HIDDEN_CLASS)) continue;

    const vendor = normalizeName(item.getAttribute('data-vendor'));
    const brand = normalizeName(item.getAttribute('data-brand'));
    const identity = vendor || brand;
    if (identity && !vendorSet.has(identity)) {
      return true;
    }
  }

  return false;
}

/**
 * @param {HTMLInputElement} changedInput
 */
function syncCheckboxGroups(changedInput) {
  const slug = normalizeSlug(changedInput.getAttribute('data-brand-slug'));
  const { checked } = changedInput;

  for (const input of getAllBrandInputs()) {
    if (normalizeSlug(input.getAttribute('data-brand-slug')) === slug) {
      input.checked = checked;
    }
  }
}

/**
 * @param {string} sectionId
 * @returns {string | null}
 */
function getStorageKey(sectionId) {
  return sectionId ? `${STORAGE_PREFIX}${sectionId}` : null;
}

/**
 * @param {string[]} slugs
 */
function persistSlugs(slugs) {
  const sectionId = document.querySelector('lame-brand-filter')?.getAttribute('data-section-id');
  const key = sectionId ? getStorageKey(sectionId) : null;
  if (!key) return;

  if (slugs.length) {
    sessionStorage.setItem(key, slugs.join(','));
  } else {
    sessionStorage.removeItem(key);
  }
}

/**
 * @returns {string[] | null}
 */
function loadPersistedSlugs() {
  const sectionId = document.querySelector('lame-brand-filter')?.getAttribute('data-section-id');
  const key = sectionId ? getStorageKey(sectionId) : null;
  if (!key) return null;

  const stored = sessionStorage.getItem(key);
  if (!stored) return null;

  return stored
    .split(',')
    .map(normalizeSlug)
    .filter(Boolean);
}

/**
 * @param {HTMLElement} root
 * @returns {Set<string>}
 */
function getDomSlugs(root) {
  /** @type {Set<string>} */
  const slugs = new Set();

  root.querySelectorAll('[data-brand-slug]').forEach((element) => {
    const slug = normalizeSlug(element.getAttribute('data-brand-slug'));
    if (slug) slugs.add(slug);
  });

  return slugs;
}

/**
 * @param {URL} [url]
 */
function syncFromUrl(url = new URL(window.location.href)) {
  const brandParam = url.searchParams.get(BRAND_PARAM);
  const slugs = brandParam
    ? new Set(
        brandParam
          .split(',')
          .map((part) => toBrandSlug(part) || normalizeSlug(part))
          .filter(Boolean)
      )
    : new Set();

  for (const input of getAllBrandInputs()) {
    const slug = toBrandSlug(input.getAttribute('data-brand-slug'));
    const labelSlug = toBrandSlug(
      input.getAttribute('data-brand-label') || input.getAttribute('data-label')
    );
    const compact = (slug || labelSlug).replace(/-/g, '');
    input.checked = [...slugs].some((part) => {
      const compactPart = part.replace(/-/g, '');
      return part === slug || part === labelSlug || (compact && compactPart === compact);
    });
  }

  updateActiveCount();
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function toBrandSlug(value) {
  return normalizeName(value)
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * @param {URL} [url]
 * @returns {boolean}
 */
function syncFromVendorUrl(url = new URL(window.location.href)) {
  const vendors = url.searchParams.getAll(VENDOR_PARAM);
  if (!vendors.length) return false;

  const vendorSet = new Set(vendors.map((vendor) => normalizeName(vendor)));
  const vendorSlugs = new Set(vendors.map((vendor) => toBrandSlug(vendor)).filter(Boolean));
  let matched = false;

  for (const input of getAllBrandInputs()) {
    const label = normalizeName(input.getAttribute('data-brand-label'));
    const slug = normalizeSlug(input.getAttribute('data-brand-slug'));
    const checked = Boolean((label && vendorSet.has(label)) || (slug && vendorSlugs.has(slug)));
    input.checked = checked;
    if (checked) matched = true;
  }

  // Keep incoming vendor params when checkboxes are not on this page yet.
  if (matched) {
    syncBrandParamsToUrl(url);
  }

  updateActiveCount();
  return true;
}

/**
 * @param {URL} [baseUrl]
 */
function syncBrandParamsToUrl(baseUrl = new URL(window.location.href)) {
  const slugs = [...getSelectedSlugs()];
  const url = new URL(baseUrl.toString());

  url.searchParams.delete(BRAND_PARAM);
  url.searchParams.delete(VENDOR_PARAM);
  url.searchParams.delete('page');

  if (slugs.length) {
    url.searchParams.set(BRAND_PARAM, slugs.join(','));
  }

  for (const label of getSelectedVendorLabels()) {
    url.searchParams.append(VENDOR_PARAM, label);
  }

  history.replaceState(history.state, '', url.toString());
  persistSlugs(slugs);
  updateClearAllButton();

  return url;
}

function syncToUrl() {
  syncBrandParamsToUrl();
}

function updateActiveCount() {
  const count = getSelectedSlugs().size;

  for (const status of document.querySelectorAll('[data-brand-filter-status]')) {
    status.textContent = count > 0 ? String(count) : '';
    status.classList.toggle('bubble', count > 0);
    status.classList.toggle('facets__bubble', count > 0);
  }

  updateClearAllButton();
}

function updateClearAllButton() {
  const clearButton =
    document.querySelector('.lame-collection-filters-head__clear') ||
    document.querySelector('.lame-collection-facet-actions__clear');
  if (!(clearButton instanceof HTMLButtonElement)) return;

  const brandActive = getSelectedSlugs().size > 0;
  const facetsActive =
    clearButton.classList.contains('lame-collection-facet-actions__clear--active') ||
    clearButton.classList.contains('lame-collection-filters-head__clear--active');

  if (brandActive) {
    clearButton.classList.add('lame-collection-facet-actions__clear--active');
    clearButton.classList.add('lame-collection-filters-head__clear--active');
  }

  clearButton.disabled = !(facetsActive || brandActive);
}

/**
 * @param {HTMLElement} emptyState
 * @param {string} message
 */
function renderBrandFilterLoadingMarkup(emptyState, message) {
  emptyState.replaceChildren();

  const wrap = document.createElement('span');
  wrap.className = 'lame-filter-loading';

  const spinner = document.createElement('span');
  spinner.className = 'lame-filter-loading__spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'lame-filter-loading__label';
  label.textContent = message;

  const skeletons = document.createElement('span');
  skeletons.className = 'lame-filter-loading__skeletons';
  skeletons.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < 8; index += 1) {
    const card = document.createElement('span');
    card.className = 'lame-filter-loading__card';
    skeletons.append(card);
  }

  wrap.append(spinner, label, skeletons);
  emptyState.append(wrap);
}

function diagnoseBrandFilter(root, selected, visibleCount, hasFilter) {
  const emptyState = root?.querySelector('.lame-brand-filter-empty');
  if (!(emptyState instanceof HTMLElement)) return;

  const messages = getFilterMessages();

  const resetClasses = () => {
    emptyState.classList.remove('lame-brand-filter-empty--error', 'lame-brand-filter-empty--loading');
  };

  if (!hasFilter) {
    emptyState.hidden = true;
    emptyState.removeAttribute('data-brand-filter-error');
    emptyState.textContent = messages.noResults;
    resetClasses();
    return;
  }

  if (isReloading) {
    emptyState.hidden = false;
    renderBrandFilterLoadingMarkup(emptyState, messages.loading);
    emptyState.setAttribute('data-brand-filter-error', 'loading');
    emptyState.setAttribute('role', 'status');
    emptyState.classList.add('lame-brand-filter-empty--loading');
    emptyState.classList.remove('lame-brand-filter-empty--error');
    return;
  }

  if (visibleCount > 0) {
    emptyState.hidden = true;
    emptyState.removeAttribute('data-brand-filter-error');
    resetClasses();
    return;
  }

  if (!root) {
    emptyState.hidden = false;
    emptyState.textContent = messages.noRoot;
    emptyState.setAttribute('data-brand-filter-error', 'no_root');
    emptyState.setAttribute('role', 'alert');
    emptyState.classList.add('lame-brand-filter-empty--error');
    console.error('[lame-brand-filter] Collection root not found');
    return;
  }

  const domSlugs = getDomSlugs(root);
  const selectedArray = [...selected];
  const missingFromDom = selectedArray.filter((slug) => !domSlugs.has(slug));
  const vendorParams = new URL(window.location.href).searchParams.getAll(VENDOR_PARAM);

  emptyState.hidden = false;
  emptyState.setAttribute('role', 'alert');

  if (!isVendorFilterEnabled()) {
    emptyState.textContent = messages.vendorDisabled;
    emptyState.setAttribute('data-brand-filter-error', 'vendor_filter_disabled');
    emptyState.classList.add('lame-brand-filter-empty--error');
    emptyState.classList.remove('lame-brand-filter-empty--loading');
    console.error(
      '[lame-brand-filter] filter.p.vendor ignored — enable Vendor in Search & Discovery',
      { selected: selectedArray, domSlugs: [...domSlugs], vendorParams }
    );
    return;
  }

  if (
    vendorParams.length > 0 &&
    !isReloading &&
    serverFilterMayBeIgnored(root, vendorParams)
  ) {
    emptyState.textContent = messages.vendorDisabled;
    emptyState.setAttribute('data-brand-filter-error', 'vendor_filter_disabled');
    emptyState.classList.add('lame-brand-filter-empty--error');
    emptyState.classList.remove('lame-brand-filter-empty--loading');
    console.error(
      '[lame-brand-filter] filter.p.vendor ignored — enable Vendor in Search & Discovery',
      { url: window.location.href, selected: selectedArray, domSlugs: [...domSlugs], vendorParams }
    );
    return;
  }

  if (missingFromDom.length > 0 && vendorParams.length === 0) {
    emptyState.hidden = false;
    renderBrandFilterLoadingMarkup(emptyState, messages.loading);
    emptyState.setAttribute('data-brand-filter-error', 'loading');
    emptyState.setAttribute('role', 'status');
    emptyState.classList.add('lame-brand-filter-empty--loading');
    emptyState.classList.remove('lame-brand-filter-empty--error');
    console.warn('[lame-brand-filter] Selected brands not on current page; server reload expected', {
      selected: selectedArray,
      domSlugs: [...domSlugs],
      missingFromDom,
    });
    return;
  }

  if (missingFromDom.length > 0 && vendorParams.length > 0) {
    emptyState.textContent = messages.mismatch;
    emptyState.setAttribute('data-brand-filter-error', 'mismatch');
    emptyState.classList.add('lame-brand-filter-empty--error');
    emptyState.classList.remove('lame-brand-filter-empty--loading');
    console.warn('[lame-brand-filter] Slug/vendor mismatch after server filter', {
      selected: selectedArray,
      domSlugs: [...domSlugs],
      vendorParams,
      missingFromDom,
    });
    return;
  }

  emptyState.textContent = messages.noResults;
  emptyState.setAttribute('data-brand-filter-error', 'no_results');
  emptyState.classList.add('lame-brand-filter-empty--error');
  emptyState.classList.remove('lame-brand-filter-empty--loading');
  console.info('[lame-brand-filter] No visible products for selected brands', {
    selected: selectedArray,
    domSlugs: [...domSlugs],
    vendorParams,
  });
}

/**
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function getDisplayLabelForInput(input) {
  const label =
    input.getAttribute('data-label') ||
    input.closest('li')?.querySelector('.checkbox__label-text')?.textContent ||
    input.getAttribute('data-brand-label') ||
    '';
  return normalizeBrandLabel(label);
}

/** Remove duplicate brand checkboxes; keep the last entry (correct vendor string). */
function dedupeBrandFilterLabels() {
  for (const component of document.querySelectorAll('lame-brand-filter')) {
    const ul = component.querySelector('ul.facets__inputs-list');
    if (!ul) continue;

    const items = Array.from(ul.querySelectorAll('li.facets__inputs-list-item'));
    /** @type {Map<string, HTMLLIElement>} */
    const lastByLabel = new Map();

    for (const li of items) {
      const input = li.querySelector('input[data-brand-slug]');
      if (!(input instanceof HTMLInputElement)) continue;

      const labelKey = getDisplayLabelForInput(input);
      if (!labelKey) continue;

      lastByLabel.set(labelKey, li);
    }

    for (const li of items) {
      const input = li.querySelector('input[data-brand-slug]');
      if (!(input instanceof HTMLInputElement)) continue;

      const labelKey = getDisplayLabelForInput(input);
      if (!labelKey) continue;

      if (lastByLabel.get(labelKey) !== li) {
        li.remove();
      }
    }
  }
}

/**
 * @param {string} slug
 * @param {string} filterLabel - exact value for filter.p.vendor
 * @param {string} [displayLabel]
 */
function appendBrandCheckbox(slug, filterLabel, displayLabel = filterLabel) {
  const templateInput = document.querySelector('lame-brand-filter input[data-brand-slug]');
  if (!(templateInput instanceof HTMLInputElement)) return;

  const templateLi = templateInput.closest('li');
  if (!templateLi) return;

  const normalizedDisplayLabel = normalizeBrandLabel(displayLabel);

  for (const component of document.querySelectorAll('lame-brand-filter')) {
    const ul = component.querySelector('ul.facets__inputs-list');
    if (!ul) continue;

    const existing = ul.querySelector(`input[data-brand-slug="${CSS.escape(slug)}"]`);
    if (existing) continue;

    const items = Array.from(ul.querySelectorAll('input[data-brand-slug]'));
    const duplicateIndex = items.findIndex(
      (element) =>
        element instanceof HTMLInputElement &&
        getDisplayLabelForInput(element) === normalizedDisplayLabel
    );
    if (duplicateIndex !== -1) {
      const duplicateInput = items[duplicateIndex];
      const duplicateLi = duplicateInput.closest('li');
      duplicateLi?.remove();
    }

    const idPrefix = component.getAttribute('data-id-prefix') || 'desktop';
    const clone = templateLi.cloneNode(true);
    const input = clone.querySelector('input[data-brand-slug]');
    const labelEl = clone.querySelector('label');
    const labelText = clone.querySelector('.checkbox__label-text');
    const inputIndex = ul.querySelectorAll('input[data-brand-slug]').length + 1;
    const inputId = `Filter-brand-augment-${inputIndex}-${idPrefix}-${slug}`;

    if (input instanceof HTMLInputElement) {
      input.id = inputId;
      input.checked = false;
      input.setAttribute('data-brand-slug', slug);
      input.setAttribute('data-brand-label', filterLabel);
      input.setAttribute('data-label', displayLabel);
    }

    if (labelEl instanceof HTMLLabelElement) {
      labelEl.setAttribute('for', inputId);
    }

    if (labelText) {
      labelText.textContent = displayLabel;
    }

    ul.appendChild(clone);
  }
}

export function augmentBrandFilterFromGrid() {
  const root = getCollectionRoot();
  if (!root) return;

  /** @type {Map<string, { filterLabel: string, displayLabel: string }>} */
  const brandsFromGrid = new Map();

  root.querySelectorAll('[data-brand-slug]').forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    const slug = normalizeSlug(element.getAttribute('data-brand-slug'));
    const vendor = (element.getAttribute('data-vendor') || '').trim();
    const brand = (element.getAttribute('data-brand') || '').trim();
    const filterLabel = vendor || brand;
    const displayLabel = brand || vendor;

    if (!slug || !filterLabel || slug === 'other') return;

    if (!brandsFromGrid.has(slug)) {
      brandsFromGrid.set(slug, { filterLabel, displayLabel });
    }
  });

  if (!brandsFromGrid.size) return;

  /** @type {Set<string>} */
  const existingSlugs = new Set();
  /** @type {Set<string>} */
  const existingLabels = new Set();

  for (const input of getAllBrandInputs()) {
    const slug = normalizeSlug(input.getAttribute('data-brand-slug'));
    if (slug) existingSlugs.add(slug);

    const label = getDisplayLabelForInput(input);
    if (label) existingLabels.add(label);
  }

  for (const [slug, { filterLabel, displayLabel }] of brandsFromGrid) {
    if (existingSlugs.has(slug)) continue;
    if (existingLabels.has(normalizeBrandLabel(displayLabel))) continue;
    appendBrandCheckbox(slug, filterLabel, displayLabel);
  }

  dedupeBrandFilterLabels();
}

export function applyBrandFilter() {
  const root = getCollectionRoot();
  const selected = getSelectedSlugs();
  const url = new URL(window.location.href);
  const urlSlugs = new Set(
    [
      ...(url.searchParams.get(BRAND_PARAM) || '')
        .split(',')
        .map((part) => normalizeSlug(part) || toBrandSlug(part)),
      ...url.searchParams.getAll(VENDOR_PARAM).map((vendor) => toBrandSlug(vendor)),
    ].filter(Boolean)
  );
  const active = selected.size ? selected : urlSlugs;
  const hasFilter = active.size > 0;

  if (!root) {
    diagnoseBrandFilter(null, active, 0, hasFilter);
    return;
  }

  const items = root.querySelectorAll(
    '.lame-collection-products-column li[data-brand-slug], .lame-collection-products-column .lame-category-shop__item[data-brand-slug]'
  );
  const sections = root.querySelectorAll('.lame-collection-brand-section[data-brand-slug]');
  const productsColumn = root.querySelector('.lame-collection-products-column');

  let visibleCount = 0;

  for (const item of items) {
    const slug = normalizeSlug(item.getAttribute('data-brand-slug'));
    const show = !hasFilter || active.has(slug);
    item.classList.toggle(HIDDEN_CLASS, !show);
    if (show) visibleCount += 1;
  }

  for (const section of sections) {
    const slug = normalizeSlug(section.getAttribute('data-brand-slug'));
    const show = !hasFilter || active.has(slug);
    section.classList.toggle(HIDDEN_CLASS, !show);
    if (show) visibleCount += 1;
  }

  if (productsColumn instanceof HTMLElement) {
    productsColumn.classList.toggle('lame-collection-products-column--brand-selected', hasFilter);
  }

  diagnoseBrandFilter(root, active, visibleCount, hasFilter);
  updateActiveCount();
  document.dispatchEvent(new CustomEvent('lame:apply-client-filters'));
}

async function reloadSectionWithBrandFilter() {
  const sectionId = getSectionId();
  if (!sectionId) {
    console.error('[lame-brand-filter] Missing section-id on results-list');
    return;
  }

  const url = syncBrandParamsToUrl();
  isReloading = true;
  applyBrandFilter();

  const renderSection = () =>
    sectionRenderer.renderSection(sectionId, { url, cache: false });

  try {
    const inDialog = Boolean(document.querySelector('dialog[open]'));
    if (!inDialog) {
      const transition = startViewTransition(renderSection, ['product-grid']);
      if (transition && typeof transition.catch === 'function') {
        await transition.catch(() => renderSection());
      } else {
        await renderSection();
      }
    } else {
      await renderSection();
    }
  } catch (error) {
    console.error('[lame-brand-filter] Section reload failed', error);
    try {
      await renderSection();
    } catch (retryError) {
      console.error('[lame-brand-filter] Section reload retry failed', retryError);
    }
  } finally {
    isReloading = false;
    augmentBrandFilterFromGrid();
    dedupeBrandFilterLabels();
    restoreBrandSelection();
    applyBrandFilter();
  }
}

const scheduleServerReload = debounce(() => {
  reloadSectionWithBrandFilter();
}, 300);

export function clearBrandFilter() {
  for (const input of getAllBrandInputs()) {
    input.checked = false;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(BRAND_PARAM);
  url.searchParams.delete(VENDOR_PARAM);
  url.searchParams.delete('page');
  history.replaceState(history.state, '', url.toString());
  persistSlugs([]);
  applyBrandFilter();
  scheduleServerReload();
}

/**
 * Tick brand checkboxes from the current URL.
 * Offer-banner links use brand= only; never strip that param here.
 */
function restoreBrandSelection() {
  const url = new URL(window.location.href);
  const hasVendor = url.searchParams.getAll(VENDOR_PARAM).length > 0;
  const hasBrand = Boolean(url.searchParams.get(BRAND_PARAM));

  if (hasVendor) {
    syncFromVendorUrl(url);
    if (getSelectedSlugs().size === 0 && hasBrand) {
      syncFromUrl(url);
    }
    return;
  }

  if (hasBrand) {
    syncFromUrl(url);
    return;
  }

  for (const input of getAllBrandInputs()) {
    input.checked = false;
  }

  persistSlugs([]);
}

/**
 * Sync brand checkboxes from the current location URL.
 * Used after facet-remove pills clear filter.p.vendor.
 */
export function syncBrandFilterFromLocation() {
  restoreBrandSelection();
  applyBrandFilter();
  updateActiveCount();
}

function initBrandFilter() {
  augmentBrandFilterFromGrid();
  dedupeBrandFilterLabels();
  restoreBrandSelection();
  applyBrandFilter();

  const hasSelection = getSelectedSlugs().size > 0;
  const url = new URL(window.location.href);
  const hasVendorFilter = url.searchParams.getAll(VENDOR_PARAM).length > 0;
  const hasDiscount = Boolean(url.searchParams.get('discount'));

  // Discount filter loads the full catalog itself. A vendor reload here would
  // empty the page when the URL vendor label does not match Shopify exactly.
  if (hasSelection && !hasVendorFilter && !hasDiscount) {
    scheduleServerReload();
  }

  requestAnimationFrame(() => {
    restoreBrandSelection();
    if (url.searchParams.get(BRAND_PARAM)) {
      applyBrandFilter();
    }
  });
}

function handleMorphComplete() {
  augmentBrandFilterFromGrid();
  dedupeBrandFilterLabels();
  restoreBrandSelection();
  applyBrandFilter();
}

class LameBrandFilter extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', (event) => {
      const { target } = event;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.matches('[data-brand-slug]')) return;

      syncCheckboxGroups(target);
      syncToUrl();
      applyBrandFilter();
      scheduleServerReload();
    });
  }
}

if (!customElements.get('lame-brand-filter')) {
  customElements.define('lame-brand-filter', LameBrandFilter);
}

document.addEventListener(CLEAR_EVENT, clearBrandFilter);
document.addEventListener(MORPH_EVENT, handleMorphComplete);
document.addEventListener('lame:sync-brand-filter-from-url', syncBrandFilterFromLocation);
document.addEventListener('lame:tick-brand-from-url', () => {
  restoreBrandSelection();
  updateActiveCount();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBrandFilter, { once: true });
} else {
  initBrandFilter();
}
