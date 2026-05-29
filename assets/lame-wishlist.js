(() => {
  const STORAGE_KEY = 'lame:wishlist:v1';
  const MAX_ITEMS = 40;

  /** @returns {Array<{id:number|string,handle:string,url:string,title:string,image:string,price:string}>} */
  function readItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** @param {ReturnType<typeof readItems>} items */
  function writeItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    } catch (e) {
      console.warn('[wishlist]', e);
    }
    dispatchChange();
  }

  function dispatchChange() {
    document.dispatchEvent(new CustomEvent('lame:wishlistchange', { bubbles: true }));
  }

  /** @param {string} id */
  function hasId(id) {
    return readItems().some((item) => String(item.id) === String(id));
  }

  /** @param {HTMLElement} btn */
  function snapshotFromButton(btn) {
    return {
      id: btn.dataset.productId || '',
      handle: btn.dataset.productHandle || '',
      url: btn.dataset.productUrl || '',
      title: btn.dataset.productTitle || '',
      image: btn.dataset.productImage || '',
      price: btn.dataset.productPrice || '',
    };
  }

  /** @param {HTMLElement} btn */
  function toggleButton(btn) {
    const snap = snapshotFromButton(btn);
    if (!snap.id) return;

    let items = readItems();
    const idx = items.findIndex((item) => String(item.id) === String(snap.id));
    if (idx >= 0) {
      items.splice(idx, 1);
    } else {
      items.unshift({
        id: snap.id,
        handle: snap.handle,
        url: snap.url || `/products/${snap.handle}`,
        title: snap.title,
        image: snap.image,
        price: snap.price,
      });
      items = items.slice(0, MAX_ITEMS);
    }
    writeItems(items);
    syncButtons();
    renderDrawerList();
    updateFabCount();
  }

  function syncButtons() {
    const items = readItems();
    const ids = new Set(items.map((i) => String(i.id)));

    document.querySelectorAll('[data-lame-wishlist-toggle]').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const on = ids.has(String(node.dataset.productId || ''));
      node.setAttribute('aria-pressed', on ? 'true' : 'false');
      node.classList.toggle('is-active', on);
    });
  }

  function renderDrawerList() {
    const root = document.getElementById('lame-wishlist-drawer');
    if (!root) return;

    const empty = root.querySelector('[data-wishlist-empty]');
    const list = root.querySelector('[data-wishlist-list]');
    if (!(empty instanceof HTMLElement) || !(list instanceof HTMLElement)) return;

    const items = readItems();

    if (!items.length) {
      empty.hidden = false;
      list.innerHTML = '';
      list.hidden = true;
      return;
    }

    empty.hidden = true;
    list.hidden = false;

    list.innerHTML = items
      .map(
        (item) => `
      <li class="lame-wishlist-drawer__item" data-wishlist-row="${escapeAttr(String(item.id))}">
        <a class="lame-wishlist-drawer__thumb" href="${escapeAttr(item.url)}">
          ${
            item.image
              ? `<img src="${escapeAttr(item.image)}" alt="" width="72" height="72" loading="lazy">`
              : `<span class="lame-wishlist-drawer__thumb-fallback"></span>`
          }
        </a>
        <div class="lame-wishlist-drawer__meta">
          <a class="lame-wishlist-drawer__product-title" href="${escapeAttr(item.url)}">${escapeHtml(item.title)}</a>
          ${item.price ? `<p class="lame-wishlist-drawer__price">${escapeHtml(item.price)}</p>` : ''}
        </div>
        <button type="button" class="lame-wishlist-drawer__remove" data-wishlist-remove="${escapeAttr(String(item.id))}" aria-label="${escapeHtml(strings.remove)}">
          &times;
        </button>
      </li>`
      )
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }

  /** @type {{remove:string, drawerTitle:string}} */
  const strings = {
    remove: 'Remove',
    drawerTitle: 'Wishlist',
    ...(typeof window.lameWishlistStrings === 'object' && window.lameWishlistStrings !== null
      ? window.lameWishlistStrings
      : {}),
  };

  /** @type {HTMLElement | null} */
  let fabEl = null;

  function isHomepage() {
    return document.body.classList.contains('template-index');
  }

  function updateFabCount() {
    const n = readItems().length;
    const fab = fabEl || document.querySelector('[data-lame-wishlist-open].lame-wishlist-fab');
    if (!(fab instanceof HTMLElement)) return;

    fabEl = fab;
    fab.hidden = n === 0 || isHomepage();
    fab.setAttribute('data-count', String(n));

    const badge = fab.querySelector('[data-wishlist-count]');
    if (badge instanceof HTMLElement) badge.textContent = String(n);
  }

  /** @type {HTMLElement | null} */
  let drawerPanel = null;
  /** @type {HTMLElement | null} */
  let previouslyFocused = null;

  /** @type {(() => void) | null} */
  let trapCleanup = null;

  function openDrawer() {
    const root = document.getElementById('lame-wishlist-drawer');
    if (!(root instanceof HTMLElement)) return;

    drawerPanel = root.querySelector('[data-wishlist-panel]');
    previouslyFocused = /** @type {HTMLElement} */ (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');

    renderDrawerList();

    const closeBtn = root.querySelector('[data-wishlist-close]');
    if (closeBtn instanceof HTMLElement) closeBtn.focus();

    trapCleanup = trapFocus(root);
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const root = document.getElementById('lame-wishlist-drawer');
    if (!(root instanceof HTMLElement)) return;

    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');

    if (trapCleanup) {
      trapCleanup();
      trapCleanup = null;
    }

    document.body.style.overflow = '';

    if (previouslyFocused instanceof HTMLElement && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
    drawerPanel = null;
  }

  /** @param {HTMLElement} container */
  function trapFocus(container) {
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(container.querySelectorAll(selector)).filter(
        (el) =>
          el instanceof HTMLElement &&
          !el.hasAttribute('disabled') &&
          el.offsetParent !== null &&
          container.contains(el)
      );

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const nodes = focusables();
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }

  function removeById(id) {
    const items = readItems().filter((item) => String(item.id) !== String(id));
    writeItems(items);
    syncButtons();
    renderDrawerList();
    updateFabCount();
  }

  function init() {
    syncButtons();
    renderDrawerList();
    updateFabCount();

    document.addEventListener('click', (e) => {
      const toggle = e.target instanceof Element ? e.target.closest('[data-lame-wishlist-toggle]') : null;
      if (toggle instanceof HTMLElement) {
        e.preventDefault();
        toggleButton(toggle);
        return;
      }

      const open = e.target instanceof Element ? e.target.closest('[data-lame-wishlist-open]') : null;
      if (open instanceof HTMLElement) {
        e.preventDefault();
        openDrawer();
        return;
      }

      const close = e.target instanceof Element ? e.target.closest('[data-wishlist-close], [data-wishlist-backdrop]') : null;
      if (close instanceof HTMLElement) {
        e.preventDefault();
        closeDrawer();
      }

      const rm = e.target instanceof Element ? e.target.closest('[data-wishlist-remove]') : null;
      if (rm instanceof HTMLElement && rm.dataset.wishlistRemove) {
        e.preventDefault();
        removeById(rm.dataset.wishlistRemove);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const root = document.getElementById('lame-wishlist-drawer');
      if (root instanceof HTMLElement && !root.hidden) closeDrawer();
    });

    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      syncButtons();
      renderDrawerList();
      updateFabCount();
    });

    document.addEventListener('lame:wishlistchange', () => {
      updateFabCount();
    });

    const grid = document.getElementById('ResultsList');
    if (grid && typeof MutationObserver !== 'undefined') {
      let t = 0;
      const mo = new MutationObserver(() => {
        window.clearTimeout(t);
        t = window.setTimeout(() => syncButtons(), 120);
      });
      mo.observe(grid, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
