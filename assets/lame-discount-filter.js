/**
 * Discount % filter for Our Products / premium collection pages.
 * Loads every collection page, keeps products in the selected 10% bands,
 * then paginates only those matches.
 */

import { sectionRenderer } from '@theme/section-renderer';

const HIDDEN_CLASS = 'lame-discount-filter--hidden';
const BRAND_HIDDEN_CLASS = 'lame-brand-filter--hidden';
const DISCOUNT_PARAM = 'discount';
const BRAND_PARAM = 'brand';
const VENDOR_PARAM = 'filter.p.vendor';
const STORAGE_PREFIX = 'lame-discount-filter:';
const CLEAR_EVENT = 'lame:clear-brand-filter';
const MORPH_EVENT = 'lame:section-morph-complete';
const CARD_SELECTOR = 'li[data-discount-percent], .lame-category-shop__item[data-discount-percent]';

/** @type {{ key: string, items: { html: string, percent: number, id: string }[] } | null} */
let catalog = null;
let catalogRequestId = 0;
let filteredPage = 1;
let clientPagingActive = false;

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
 * @returns {HTMLElement | null}
 */
function getResultsList() {
  return document.querySelector('results-list');
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
  return document.querySelectorAll('lame-discount-filter input[type="checkbox"][data-discount-range]');
}

/**
 * @returns {HTMLElement | null}
 */
function getFilterEl() {
  return document.querySelector('lame-discount-filter');
}

/**
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function getRangeKey(input) {
  return input.getAttribute('data-discount-range') || '';
}

/**
 * @param {string} key
 * @returns {{ min: number, max: number, key: string } | null}
 */
function parseRangeKey(key) {
  if (!key || !key.includes('-')) return null;
  const [minRaw, maxRaw] = key.split('-');
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;
  return { min, max, key };
}

/**
 * @returns {{ min: number, max: number, key: string }[]}
 */
function getSelectedRules() {
  /** @type {Map<string, { min: number, max: number, key: string }>} */
  const rules = new Map();

  for (const input of getAllDiscountInputs()) {
    if (!input.checked) continue;
    const parsed = parseRangeKey(getRangeKey(input));
    if (!parsed) continue;
    rules.set(parsed.key, parsed);
  }

  return [...rules.values()].sort((a, b) => a.min - b.min);
}

/**
 * @returns {string[]}
 */
function getSelectedRangeKeys() {
  return getSelectedRules().map((rule) => rule.key);
}

/**
 * @param {number} percent
 * @param {{ min: number, max: number }[]} rules
 * @returns {boolean}
 */
function matchesDiscount(percent, rules) {
  if (!rules.length) return true;
  if (!(percent > 0)) return false;

  return rules.some((rule) => percent > rule.min && percent <= rule.max);
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function toBrandSlug(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Brand slugs from the URL and checked brand filters, so offer-banner links
 * still constrain results after the discount filter rebuilds the grid.
 * @returns {Set<string>}
 */
function getActiveBrandSlugs() {
  /** @type {Set<string>} */
  const slugs = new Set();
  const url = new URL(window.location.href);
  const brandParam = url.searchParams.get(BRAND_PARAM);

  if (brandParam) {
    for (const part of brandParam.split(',')) {
      const slug = toBrandSlug(part);
      if (slug) slugs.add(slug);
    }
  }

  for (const vendor of url.searchParams.getAll(VENDOR_PARAM)) {
    const slug = toBrandSlug(vendor);
    if (slug) slugs.add(slug);
  }

  for (const input of document.querySelectorAll(
    'lame-brand-filter input[type="checkbox"][data-brand-slug]:checked'
  )) {
    const slug = toBrandSlug(input.getAttribute('data-brand-slug'));
    if (slug) slugs.add(slug);
  }

  return slugs;
}

/**
 * @param {string | null | undefined} slug
 * @param {Set<string>} brandSlugs
 * @returns {boolean}
 */
function matchesBrand(slug, brandSlugs) {
  if (!brandSlugs.size) return true;
  const normalized = toBrandSlug(slug);
  return Boolean(normalized && brandSlugs.has(normalized));
}

/**
 * @param {string[]} keys
 */
function persistRanges(keys) {
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify(keys));
  } catch {
    // Ignore storage errors
  }
}

/**
 * @returns {string[]}
 */
function readPersistedRanges() {
  try {
    const raw = sessionStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter((key) => Boolean(parseRangeKey(key)));
  } catch {
    return [];
  }
}

function updateActiveCount() {
  const count = getSelectedRangeKeys().length;

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

  const discountActive = getSelectedRangeKeys().length > 0;
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
  const range = getRangeKey(changedInput);
  if (!range) return;

  for (const input of getAllDiscountInputs()) {
    if (input === changedInput) continue;
    if (getRangeKey(input) === range) {
      input.checked = changedInput.checked;
    }
  }
}

/**
 * @param {URL} [baseUrl]
 */
function syncDiscountParamsToUrl(baseUrl = new URL(window.location.href)) {
  const keys = getSelectedRangeKeys();
  const url = new URL(baseUrl.toString());

  url.searchParams.delete(DISCOUNT_PARAM);

  if (keys.length) {
    url.searchParams.set(DISCOUNT_PARAM, keys.join(','));
  }

  history.replaceState(history.state, '', url.toString());
  persistRanges(keys);
  updateClearAllButton();

  return url;
}

function restoreDiscountSelection() {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get(DISCOUNT_PARAM);
  const keys = fromUrl
    ? fromUrl
        .split(',')
        .map((part) => part.trim())
        .filter((key) => Boolean(parseRangeKey(key)))
    : readPersistedRanges();

  const keySet = new Set(keys);

  for (const input of getAllDiscountInputs()) {
    input.checked = keySet.has(getRangeKey(input));
  }

  if (keys.length && !fromUrl) {
    syncDiscountParamsToUrl(url);
  }

  updateActiveCount();
}

/**
 * @returns {string}
 */
function catalogKey() {
  const url = new URL(window.location.href);
  url.searchParams.delete('page');
  url.searchParams.delete(DISCOUNT_PARAM);
  url.hash = '';
  return `${url.pathname}${url.search}`;
}

/**
 * @returns {number}
 */
function getPageSize() {
  const resultsList = getResultsList();
  if (resultsList?.hasAttribute('data-lame-our-products') || resultsList?.hasAttribute('data-lame-category-shop')) {
    return 12;
  }
  return 24;
}

/**
 * @returns {number}
 */
function getServerLastPage() {
  const grid = getCollectionRoot()?.querySelector('[ref="grid"], [data-testid="product-grid"], [data-testid="product-grid-grouped"]');
  const lastPage = Number(grid instanceof HTMLElement ? grid.dataset.lastPage : 1);
  return Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1;
}

/**
 * @returns {string | null}
 */
function getSectionId() {
  return getResultsList()?.getAttribute('section-id') || getFilterEl()?.getAttribute('data-section-id') || null;
}

/**
 * @param {ParentNode} source
 * @returns {{ html: string, percent: number, brand: string, id: string }[]}
 */
function extractCards(source) {
  /** @type {Map<string, { html: string, percent: number, brand: string, id: string }>} */
  const cards = new Map();

  for (const item of source.querySelectorAll(CARD_SELECTOR)) {
    if (!(item instanceof HTMLElement)) continue;
    const id = item.getAttribute('data-product-id') || item.id || item.outerHTML.slice(0, 80);
    if (cards.has(id)) continue;
    cards.set(id, {
      html: item.outerHTML,
      percent: Number(item.getAttribute('data-discount-percent') || 0),
      brand: toBrandSlug(
        item.getAttribute('data-brand-slug') || item.getAttribute('data-vendor') || item.getAttribute('data-brand')
      ),
      id,
    });
  }

  return [...cards.values()];
}

/**
 * @param {{ percent: number, brand: string }[]} items
 * @param {{ min: number, max: number }[]} rules
 * @returns {{ percent: number, brand: string }[]}
 */
function filterCatalogItems(items, rules) {
  const brandSlugs = getActiveBrandSlugs();
  return items.filter((item) => matchesDiscount(item.percent, rules) && matchesBrand(item.brand, brandSlugs));
}

/**
 * @param {number} requestId
 */
async function ensureCatalog(requestId) {
  const key = catalogKey();
  if (catalog?.key === key && catalog.items.length) return catalog;

  const sectionId = getSectionId();
  const lastPage = getServerLastPage();
  if (!sectionId) {
    catalog = { key, items: extractCards(getCollectionRoot() || document) };
    return catalog;
  }

  /** @type {Map<string, { html: string, percent: number, id: string }>} */
  const byId = new Map();
  const currentRoot = getCollectionRoot();
  if (currentRoot) {
    for (const card of extractCards(currentRoot)) byId.set(card.id, card);
  }

  const batchSize = 4;

  for (let start = 1; start <= lastPage; start += batchSize) {
    if (requestId !== catalogRequestId) return catalog;
    const end = Math.min(start + batchSize - 1, lastPage);
    const fetches = [];

    for (let page = start; page <= end; page += 1) {
      const url = new URL(window.location.href);
      url.searchParams.delete(DISCOUNT_PARAM);
      url.searchParams.set('page', String(page));
      url.hash = '';
      fetches.push(sectionRenderer.getSectionHTML(sectionId, true, url));
    }

    const pages = await Promise.all(fetches);
    if (requestId !== catalogRequestId) return catalog;

    for (const html of pages) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      for (const card of extractCards(doc)) byId.set(card.id, card);
    }
  }

  catalog = { key, items: [...byId.values()] };
  return catalog;
}

/**
 * @param {boolean} loading
 * @param {string} [message]
 */
function setLoadingState(loading, message) {
  const root = getCollectionRoot();
  const emptyState = ensureEmptyState(root);
  if (!emptyState) return;

  if (!loading) {
    if (emptyState.getAttribute('data-brand-filter-error') === 'loading') {
      emptyState.hidden = true;
      emptyState.removeAttribute('data-brand-filter-error');
      emptyState.classList.remove('lame-brand-filter-empty--loading');
    }
    return;
  }

  emptyState.hidden = false;
  emptyState.textContent = message || getFilterEl()?.getAttribute('data-msg-loading') || 'Loading matching products...';
  emptyState.setAttribute('data-brand-filter-error', 'loading');
  emptyState.setAttribute('role', 'status');
  emptyState.classList.add('lame-brand-filter-empty--loading');
  emptyState.classList.remove('lame-brand-filter-empty--error');
}

/**
 * @param {HTMLElement | null} root
 * @returns {HTMLElement | null}
 */
function ensureEmptyState(root) {
  if (!root) return null;
  let emptyState = root.querySelector('.lame-brand-filter-empty');
  if (emptyState instanceof HTMLElement) return emptyState;

  const column = root.querySelector('.lame-collection-products-column');
  if (!column) return null;

  emptyState = document.createElement('p');
  emptyState.className = 'lame-brand-filter-empty';
  emptyState.hidden = true;
  column.append(emptyState);
  return emptyState;
}

/**
 * @param {HTMLElement | null} root
 * @returns {HTMLElement | null}
 */
function getProductGrid(root) {
  if (!root) return null;

  const flat = root.querySelector('[data-testid="product-grid"]');
  if (flat instanceof HTMLElement) return flat;

  const grouped = root.querySelector('[data-testid="product-grid-grouped"]');
  if (grouped instanceof HTMLElement) {
    let list = grouped.querySelector(':scope > ul.lame-discount-filter-grid');
    if (!(list instanceof HTMLElement)) {
      list = document.createElement('ul');
      list.className = 'product-grid lame-discount-filter-grid';
      list.setAttribute('role', 'list');
      list.setAttribute('data-testid', 'product-grid');
      grouped.prepend(list);
    }
    return list;
  }

  const fallback = root.querySelector('[ref="grid"]');
  return fallback instanceof HTMLElement ? fallback : null;
}

/**
 * @param {{ html: string, percent: number, id: string }[]} matching
 * @param {number} page
 */
function renderFilteredPage(matching, page) {
  const root = getCollectionRoot();
  const grid = getProductGrid(root);
  if (!root || !grid) return;

  const pageSize = getPageSize();
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  filteredPage = Math.min(Math.max(1, page), totalPages);
  const start = (filteredPage - 1) * pageSize;
  const slice = matching.slice(start, start + pageSize);

  for (const section of root.querySelectorAll('.lame-collection-brand-section')) {
    section.classList.add(HIDDEN_CLASS);
  }

  grid.replaceChildren();

  for (const card of slice) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = card.html.trim();
    const node = wrapper.firstElementChild;
    if (!(node instanceof HTMLElement)) continue;
    node.classList.remove(HIDDEN_CLASS, BRAND_HIDDEN_CLASS);
    node.removeAttribute('hidden');
    grid.append(node);
  }

  clientPagingActive = true;
  updateFilteredPagination(matching.length, pageSize, totalPages);
}

/**
 * @param {number} total
 * @param {number} pageSize
 * @param {number} totalPages
 */
function updateFilteredPagination(total, pageSize, totalPages) {
  const filterEl = getFilterEl();
  const from = total === 0 ? 0 : (filteredPage - 1) * pageSize + 1;
  const to = Math.min(filteredPage * pageSize, total);

  const pageOfTemplate =
    filterEl?.getAttribute('data-page-of') || 'Page __CURRENT__ of __PAGES__';
  const rangeTemplate =
    filterEl?.getAttribute('data-showing-range') || 'Showing __FROM__–__TO__ of __TOTAL__';

  const pageOf = pageOfTemplate
    .replaceAll('__CURRENT__', String(filteredPage))
    .replaceAll('__PAGES__', String(totalPages));
  const rangeText = rangeTemplate
    .replaceAll('__FROM__', String(from))
    .replaceAll('__TO__', String(to))
    .replaceAll('__TOTAL__', String(total));

  for (const status of document.querySelectorAll('.lame-collection-pagination__status')) {
    status.textContent = pageOf;
  }

  for (const meta of document.querySelectorAll('.lame-our-products-pagination-meta')) {
    const parts = [rangeText];
    if (totalPages > 1) parts.push(pageOf);
    meta.textContent = parts.join(' · ');
  }

  const nav = document.querySelector('.lame-collection-pagination');
  if (nav instanceof HTMLElement) {
    nav.dataset.currentPage = String(filteredPage);
    nav.hidden = total === 0;
  }

  updatePagingButton(
    document.querySelector('.lame-collection-pagination__btn--prev'),
    filteredPage > 1,
    'prev'
  );
  updatePagingButton(
    document.querySelector('.lame-collection-pagination__btn--next'),
    filteredPage < totalPages,
    'next'
  );

  const grid = getProductGrid(getCollectionRoot());
  if (grid instanceof HTMLElement) {
    grid.dataset.lastPage = String(totalPages);
  }
}

/**
 * @param {Element | null} button
 * @param {boolean} enabled
 * @param {'prev' | 'next'} kind
 */
function updatePagingButton(button, enabled, kind) {
  if (!(button instanceof HTMLElement)) return;

  if (enabled) {
    if (button.tagName !== 'A') {
      const link = document.createElement('a');
      copyPagingButton(button, link, kind);
      button.replaceWith(link);
      return;
    }
    button.classList.remove('lame-collection-pagination__btn--disabled');
    button.removeAttribute('aria-disabled');
    button.setAttribute('rel', kind === 'next' ? 'next' : 'prev');
    button.setAttribute('href', '#');
    return;
  }

  if (button.tagName === 'A') {
    const span = document.createElement('span');
    copyPagingButton(button, span, kind);
    span.classList.add('lame-collection-pagination__btn--disabled');
    span.setAttribute('aria-disabled', 'true');
    button.replaceWith(span);
  }
}

/**
 * @param {HTMLElement} from
 * @param {HTMLElement} to
 * @param {'prev' | 'next'} kind
 */
function copyPagingButton(from, to, kind) {
  to.className = `lame-collection-pagination__btn lame-collection-pagination__btn--${kind} button-unstyled`;
  to.innerHTML = from.innerHTML;
  if (to instanceof HTMLAnchorElement) {
    to.href = '#';
    to.rel = kind === 'next' ? 'next' : 'prev';
  }
}

/**
 * @param {HTMLElement | null} root
 * @param {number} visibleCount
 * @param {boolean} hasFilter
 */
function updateEmptyState(root, visibleCount, hasFilter) {
  const emptyState = ensureEmptyState(root);
  if (!emptyState) return;

  if (!hasFilter || visibleCount > 0) {
    emptyState.hidden = true;
    emptyState.removeAttribute('data-brand-filter-error');
    emptyState.classList.remove('lame-brand-filter-empty--error', 'lame-brand-filter-empty--loading');
    return;
  }

  emptyState.hidden = false;
  emptyState.textContent =
    getFilterEl()?.getAttribute('data-msg-no-results') || 'No products match the selected discount.';
  emptyState.setAttribute('data-brand-filter-error', 'no_results');
  emptyState.setAttribute('role', 'alert');
  emptyState.classList.add('lame-brand-filter-empty--error');
  emptyState.classList.remove('lame-brand-filter-empty--loading');
}

function applyLocalHideOnly() {
  const root = getCollectionRoot();
  const rules = getSelectedRules();
  const hasFilter = rules.length > 0;
  if (!root) {
    updateActiveCount();
    return;
  }

  const items = root.querySelectorAll(CARD_SELECTOR);
  const brandSlugs = getActiveBrandSlugs();
  let visibleCount = 0;

  for (const item of items) {
    const percent = Number(item.getAttribute('data-discount-percent') || 0);
    const brand = item.getAttribute('data-brand-slug') || item.getAttribute('data-vendor') || item.getAttribute('data-brand');
    const show = matchesDiscount(percent, rules) && matchesBrand(brand, brandSlugs);
    item.classList.toggle(HIDDEN_CLASS, !show);
    if (show && !item.classList.contains(BRAND_HIDDEN_CLASS)) visibleCount += 1;
  }

  for (const section of root.querySelectorAll('.lame-collection-brand-section')) {
    const kids = section.querySelectorAll(CARD_SELECTOR);
    let anyVisible = false;
    for (const kid of kids) {
      if (!kid.classList.contains(HIDDEN_CLASS) && !kid.classList.contains(BRAND_HIDDEN_CLASS)) {
        anyVisible = true;
        break;
      }
    }
    section.classList.toggle(HIDDEN_CLASS, kids.length > 0 && !anyVisible);
  }

  updateEmptyState(root, visibleCount, hasFilter);
  updateActiveCount();
}

async function restoreServerCollection() {
  const sectionId = getSectionId();
  const url = new URL(window.location.href);
  url.searchParams.delete(DISCOUNT_PARAM);
  url.searchParams.delete('page');
  catalog = null;
  clientPagingActive = false;
  filteredPage = 1;

  if (!sectionId) {
    applyLocalHideOnly();
    return;
  }

  await sectionRenderer.renderSection(sectionId, { cache: false, url });
  history.replaceState(history.state, '', url.toString());
  document.dispatchEvent(new CustomEvent(MORPH_EVENT));
}

export async function applyDiscountFilter() {
  const rules = getSelectedRules();
  const hasFilter = rules.length > 0;
  const root = getCollectionRoot();

  if (!hasFilter) {
    if (clientPagingActive) {
      await restoreServerCollection();
      return;
    }
    applyLocalHideOnly();
    return;
  }

  if (!root) {
    updateActiveCount();
    return;
  }

  applyLocalHideOnly();
  setLoadingState(true);

  const requestId = ++catalogRequestId;

  try {
    const loaded = await ensureCatalog(requestId);
    if (requestId !== catalogRequestId) return;

    const matching = filterCatalogItems(loaded?.items || [], rules);
    setLoadingState(false);

    if (!matching.length) {
      const grid = getProductGrid(root);
      grid?.replaceChildren();
      updateFilteredPagination(0, getPageSize(), 1);
      updateEmptyState(root, 0, true);
      updateActiveCount();
      return;
    }

    renderFilteredPage(matching, 1);
    updateEmptyState(root, matching.length, true);
    updateActiveCount();
    getCollectionRoot()?.querySelector('#ResultsList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error('[lame-discount-filter] failed to load matching products', error);
    setLoadingState(false);
    applyLocalHideOnly();
  }
}

function goToFilteredPage(page) {
  const rules = getSelectedRules();
  if (!rules.length || !catalog?.items) return;
  const matching = filterCatalogItems(catalog.items, rules);
  renderFilteredPage(matching, page);
  getCollectionRoot()?.querySelector('#ResultsList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export async function clearDiscountFilter() {
  catalogRequestId += 1;
  for (const input of getAllDiscountInputs()) {
    input.checked = false;
  }
  persistRanges([]);
  updateActiveCount();
  await restoreServerCollection();
}

function initDiscountFilter() {
  restoreDiscountSelection();
  if (getSelectedRules().length) {
    applyDiscountFilter();
    return;
  }
  applyLocalHideOnly();
}

class LameDiscountFilter extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', (event) => {
      const { target } = event;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.matches('[data-discount-range]')) return;

      syncCheckboxGroups(target);
      syncDiscountParamsToUrl();
      filteredPage = 1;
      applyDiscountFilter();
    });
  }
}

if (!customElements.get('lame-discount-filter')) {
  customElements.define('lame-discount-filter', LameDiscountFilter);
}

document.addEventListener(
  'click',
  (event) => {
    if (!clientPagingActive || !getSelectedRules().length) return;
    if (!(event.target instanceof Element)) return;

    const link = event.target.closest(
      'a.lame-collection-pagination__btn, a.pagination__link--arrow, a.pagination__link'
    );
    if (!(link instanceof HTMLElement)) return;

    const isNext =
      link.getAttribute('rel') === 'next' || link.classList.contains('lame-collection-pagination__btn--next');
    const isPrev =
      link.getAttribute('rel') === 'prev' || link.classList.contains('lame-collection-pagination__btn--prev');

    if (!isNext && !isPrev) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    goToFilteredPage(filteredPage + (isNext ? 1 : -1));
  },
  true
);

document.addEventListener(CLEAR_EVENT, () => {
  clearDiscountFilter();
});
document.addEventListener(MORPH_EVENT, () => {
  restoreDiscountSelection();
  if (getSelectedRules().length) {
    catalog = null;
    applyDiscountFilter();
    return;
  }
  clientPagingActive = false;
  applyLocalHideOnly();
});
document.addEventListener('lame:sync-brand-filter-from-url', () => {
  restoreDiscountSelection();
  applyDiscountFilter();
});
document.addEventListener('lame:apply-client-filters', () => {
  applyDiscountFilter();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiscountFilter, { once: true });
} else {
  initDiscountFilter();
}
