/**
 * Client-side brand filter for Our Products / premium collection pages.
 * Filters visible products by data-brand-slug. Uses ?brand=slug1,slug2 URL param only.
 */

const HIDDEN_CLASS = 'lame-brand-filter--hidden';
const BRAND_PARAM = 'brand';
const LEGACY_VENDOR_PARAM = 'filter.p.vendor';
const STORAGE_PREFIX = 'lame-brand-filter:';
const CLEAR_EVENT = 'lame:clear-brand-filter';
const MORPH_EVENT = 'lame:section-morph-complete';

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
 * @param {string | null | undefined} slug
 * @returns {string}
 */
function normalizeSlug(slug) {
  return (slug || '').trim().toLowerCase();
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
 * @param {URL} [url]
 */
function syncFromUrl(url = new URL(window.location.href)) {
  const brandParam = url.searchParams.get(BRAND_PARAM);
  const slugs = brandParam
    ? new Set(
        brandParam
          .split(',')
          .map(normalizeSlug)
          .filter(Boolean)
      )
    : new Set();

  for (const input of getAllBrandInputs()) {
    const slug = normalizeSlug(input.getAttribute('data-brand-slug'));
    input.checked = slugs.has(slug);
  }

  updateActiveCount();
}

function syncToUrl() {
  const slugs = [...getSelectedSlugs()];
  const url = new URL(window.location.href);

  url.searchParams.delete(BRAND_PARAM);

  if (slugs.length) {
    url.searchParams.set(BRAND_PARAM, slugs.join(','));
  }

  history.replaceState(history.state, '', url.toString());
  persistSlugs(slugs);
  updateClearAllButton();
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
  const clearButton = document.querySelector('.lame-collection-facet-actions__clear');
  if (!(clearButton instanceof HTMLButtonElement)) return;

  const brandActive = getSelectedSlugs().size > 0;
  const facetsActive = clearButton.classList.contains('lame-collection-facet-actions__clear--active');

  if (brandActive) {
    clearButton.classList.add('lame-collection-facet-actions__clear--active');
  }

  clearButton.disabled = !(facetsActive || brandActive);
}

export function applyBrandFilter() {
  const root = getCollectionRoot();
  if (!root) return;

  const selected = getSelectedSlugs();
  const hasFilter = selected.size > 0;

  const items = root.querySelectorAll(
    '.lame-collection-products-column li[data-brand-slug], .lame-collection-products-column .lame-category-shop__item[data-brand-slug]'
  );
  const sections = root.querySelectorAll('.lame-collection-brand-section[data-brand-slug]');
  const productsColumn = root.querySelector('.lame-collection-products-column');
  const emptyState = root.querySelector('.lame-brand-filter-empty');

  let visibleCount = 0;

  for (const item of items) {
    const slug = normalizeSlug(item.getAttribute('data-brand-slug'));
    const show = !hasFilter || selected.has(slug);
    item.classList.toggle(HIDDEN_CLASS, !show);
    if (show) visibleCount += 1;
  }

  for (const section of sections) {
    const slug = normalizeSlug(section.getAttribute('data-brand-slug'));
    const show = !hasFilter || selected.has(slug);
    section.classList.toggle(HIDDEN_CLASS, !show);
    if (show) visibleCount += 1;
  }

  if (productsColumn instanceof HTMLElement) {
    productsColumn.classList.toggle('lame-collection-products-column--brand-selected', hasFilter);
  }

  if (emptyState instanceof HTMLElement) {
    emptyState.hidden = !(hasFilter && visibleCount === 0);
  }

  updateActiveCount();
}

export function clearBrandFilter() {
  for (const input of getAllBrandInputs()) {
    input.checked = false;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(BRAND_PARAM);
  history.replaceState(history.state, '', url.toString());
  persistSlugs([]);
  applyBrandFilter();
}

function stripLegacyVendorFilterParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(LEGACY_VENDOR_PARAM)) return;

  url.searchParams.delete(LEGACY_VENDOR_PARAM);
  history.replaceState(history.state, '', url.toString());
}

function restoreBrandSelection() {
  const url = new URL(window.location.href);

  if (url.searchParams.get(BRAND_PARAM)) {
    syncFromUrl(url);
    return;
  }

  const persisted = loadPersistedSlugs();
  if (!persisted?.length) {
    syncFromUrl(url);
    return;
  }

  for (const input of getAllBrandInputs()) {
    const slug = normalizeSlug(input.getAttribute('data-brand-slug'));
    input.checked = persisted.includes(slug);
  }

  syncToUrl();
}

function initBrandFilter() {
  stripLegacyVendorFilterParam();
  restoreBrandSelection();
  applyBrandFilter();
}

function handleMorphComplete() {
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
    });
  }
}

if (!customElements.get('lame-brand-filter')) {
  customElements.define('lame-brand-filter', LameBrandFilter);
}

document.addEventListener(CLEAR_EVENT, clearBrandFilter);
document.addEventListener(MORPH_EVENT, handleMorphComplete);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBrandFilter, { once: true });
} else {
  initBrandFilter();
}
