/**
 * Discount % filter for Our Products / premium collection pages.
 * Client-side hide based on data-discount-percent (compare-at savings).
 */

const HIDDEN_CLASS = 'lame-discount-filter--hidden';
const BRAND_HIDDEN_CLASS = 'lame-brand-filter--hidden';
const DISCOUNT_PARAM = 'discount';
const STORAGE_PREFIX = 'lame-discount-filter:';
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
 * @returns {string}
 */
function storageKey() {
  return `${STORAGE_PREFIX}${window.location.pathname}`;
}

/**
 * @returns {NodeListOf<HTMLInputElement>}
 */
function getAllDiscountInputs() {
  return document.querySelectorAll('lame-discount-filter input[type="checkbox"][data-discount-min]');
}

/**
 * @returns {{ value: number, mode: string }[]}
 */
function getSelectedRules() {
  /** @type {Map<string, { value: number, mode: string }>} */
  const rules = new Map();

  for (const input of getAllDiscountInputs()) {
    if (!input.checked) continue;
    const value = Number(input.getAttribute('data-discount-min'));
    const mode = input.getAttribute('data-discount-mode') === 'above' ? 'above' : 'upto';
    if (!Number.isFinite(value) || value <= 0) continue;
    rules.set(`${mode}:${value}`, { value, mode });
  }

  return [...rules.values()].sort((a, b) => a.value - b.value);
}

/**
 * @returns {number[]}
 */
function getSelectedMins() {
  return getSelectedRules().map((rule) => rule.value);
}

/**
 * @param {number} percent
 * @param {{ value: number, mode: string }[]} rules
 * @returns {boolean}
 */
function matchesDiscount(percent, rules) {
  if (!rules.length) return true;

  return rules.some((rule) => {
    if (rule.mode === 'above') return percent >= rule.value;
    return percent > 0 && percent <= rule.value;
  });
}

function persistMins(mins) {
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify(mins));
  } catch {
    // Ignore storage errors
  }
}

/**
 * @returns {number[]}
 */
function readPersistedMins() {
  try {
    const raw = sessionStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
}

function updateActiveCount() {
  const count = getSelectedMins().length;

  for (const status of document.querySelectorAll('[data-discount-filter-status]')) {
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

  const discountActive = getSelectedMins().length > 0;
  const alreadyActive =
    clearButton.classList.contains('lame-collection-facet-actions__clear--active') ||
    clearButton.classList.contains('lame-collection-filters-head__clear--active');

  if (discountActive) {
    clearButton.classList.add('lame-collection-facet-actions__clear--active');
    clearButton.classList.add('lame-collection-filters-head__clear--active');
    clearButton.disabled = false;
    return;
  }

  clearButton.disabled = !alreadyActive && clearButton.disabled;
}

/**
 * @param {HTMLInputElement} changedInput
 */
function syncCheckboxGroups(changedInput) {
  const min = changedInput.getAttribute('data-discount-min');
  if (!min) return;

  for (const input of getAllDiscountInputs()) {
    if (input === changedInput) continue;
    if (input.getAttribute('data-discount-min') === min) {
      input.checked = changedInput.checked;
    }
  }
}

/**
 * @param {URL} [baseUrl]
 */
function syncDiscountParamsToUrl(baseUrl = new URL(window.location.href)) {
  const mins = getSelectedMins();
  const url = new URL(baseUrl.toString());

  url.searchParams.delete(DISCOUNT_PARAM);

  if (mins.length) {
    url.searchParams.set(DISCOUNT_PARAM, mins.join(','));
  }

  history.replaceState(history.state, '', url.toString());
  persistMins(mins);
  updateClearAllButton();

  return url;
}

function restoreDiscountSelection() {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get(DISCOUNT_PARAM);
  const mins = fromUrl
    ? fromUrl
        .split(',')
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0)
    : readPersistedMins();

  const minSet = new Set(mins);

  for (const input of getAllDiscountInputs()) {
    const min = Number(input.getAttribute('data-discount-min'));
    input.checked = minSet.has(min);
  }

  if (mins.length && !fromUrl) {
    syncDiscountParamsToUrl(url);
  }

  updateActiveCount();
}

function updateEmptyState(root, visibleCount, hasFilter) {
  const emptyState = root?.querySelector('.lame-brand-filter-empty');
  if (!(emptyState instanceof HTMLElement)) return;
  if (!hasFilter) return;

  if (visibleCount > 0) {
    if (emptyState.getAttribute('data-brand-filter-error') === 'no_results') {
      emptyState.hidden = true;
      emptyState.removeAttribute('data-brand-filter-error');
    }
    return;
  }

  const brandStillHiding = Boolean(
    root.querySelector(
      `.lame-collection-products-column li.${BRAND_HIDDEN_CLASS}, .lame-collection-products-column .lame-category-shop__item.${BRAND_HIDDEN_CLASS}`
    )
  );
  if (brandStillHiding) return;

  const el = document.querySelector('lame-discount-filter');
  emptyState.hidden = false;
  emptyState.textContent =
    el?.getAttribute('data-msg-no-results') || 'No products match the selected discount.';
  emptyState.setAttribute('data-brand-filter-error', 'no_results');
  emptyState.setAttribute('role', 'alert');
  emptyState.classList.add('lame-brand-filter-empty--error');
}

export function applyDiscountFilter() {
  const root = getCollectionRoot();
  const rules = getSelectedRules();
  const hasFilter = rules.length > 0;

  if (!root) {
    updateActiveCount();
    return;
  }

  const items = root.querySelectorAll(
    '.lame-collection-products-column li[data-discount-percent], .lame-collection-products-column .lame-category-shop__item[data-discount-percent]'
  );
  const sections = root.querySelectorAll('.lame-collection-brand-section');

  let visibleCount = 0;

  for (const item of items) {
    const percent = Number(item.getAttribute('data-discount-percent') || 0);
    const show = matchesDiscount(percent, rules);
    item.classList.toggle(HIDDEN_CLASS, !show);

    const hidden =
      item.classList.contains(HIDDEN_CLASS) || item.classList.contains(BRAND_HIDDEN_CLASS);
    if (!hidden) visibleCount += 1;
  }

  for (const section of sections) {
    const kids = section.querySelectorAll('li[data-discount-percent], .lame-category-shop__item[data-discount-percent]');
    let anyVisible = false;

    for (const kid of kids) {
      if (
        !kid.classList.contains(HIDDEN_CLASS) &&
        !kid.classList.contains(BRAND_HIDDEN_CLASS)
      ) {
        anyVisible = true;
        break;
      }
    }

    section.classList.toggle(HIDDEN_CLASS, kids.length > 0 && !anyVisible);
  }

  updateEmptyState(root, visibleCount, hasFilter);
  updateActiveCount();
}

export function clearDiscountFilter() {
  for (const input of getAllDiscountInputs()) {
    input.checked = false;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(DISCOUNT_PARAM);
  history.replaceState(history.state, '', url.toString());
  persistMins([]);
  applyDiscountFilter();
}

function initDiscountFilter() {
  restoreDiscountSelection();
  applyDiscountFilter();
}

class LameDiscountFilter extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', (event) => {
      const { target } = event;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.matches('[data-discount-min]')) return;

      syncCheckboxGroups(target);
      syncDiscountParamsToUrl();
      applyDiscountFilter();
    });
  }
}

if (!customElements.get('lame-discount-filter')) {
  customElements.define('lame-discount-filter', LameDiscountFilter);
}

document.addEventListener(CLEAR_EVENT, clearDiscountFilter);
document.addEventListener(MORPH_EVENT, () => {
  restoreDiscountSelection();
  applyDiscountFilter();
});
document.addEventListener('lame:sync-brand-filter-from-url', () => {
  restoreDiscountSelection();
  applyDiscountFilter();
});
document.addEventListener('lame:apply-client-filters', applyDiscountFilter);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiscountFilter, { once: true });
} else {
  initDiscountFilter();
}
