/**
 * LAME SMART COLLECTION — Personalized Discovery & Dynamic Random Shuffle
 * 
 * Automatically shows products based on:
 * 1. Customer search keywords (typed in search inputs, modal, or URL)
 * 2. Customer liking & affinity (viewed products, clicked brands, wishlisted/added items)
 * 3. Fresh dynamic random shuffle on each visit so collections never look static or boring
 * 4. Interactive "Shuffle / Surprise Me" button for on-demand discovery
 */

(() => {
  'use strict';

  const STORAGE_KEYS = {
    keywords: 'lame:search:keywords',
    brands: 'lame:affinity:brands',
    types: 'lame:affinity:types',
    wishlist: 'lame:wishlist:v1',
    viewed: 'viewedProducts',
    sessionSeed: 'lame:session:shuffle_seed'
  };

  /* ------------------------------------------------------------------------
     1. Storage Helpers
     ------------------------------------------------------------------------ */
  function getJson(key, defaultVal = {}) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function getKeywords() {
    const list = getJson(STORAGE_KEYS.keywords, []);
    return Array.isArray(list) ? list : [];
  }

  function saveKeyword(kw) {
    if (!kw || typeof kw !== 'string') return;
    const clean = kw.trim().toLowerCase().slice(0, 40);
    if (clean.length < 2) return;

    let list = getKeywords().filter(k => k !== clean);
    list.unshift(clean);
    if (list.length > 12) list = list.slice(0, 12);
    setJson(STORAGE_KEYS.keywords, list);
  }

  function getBrandAffinity() {
    return getJson(STORAGE_KEYS.brands, {});
  }

  function recordBrandInteraction(brand, weight = 1) {
    if (!brand || typeof brand !== 'string') return;
    const clean = brand.trim().toLowerCase();
    if (!clean) return;

    const data = getBrandAffinity();
    data[clean] = (data[clean] || 0) + weight;
    if (data[clean] > 20) data[clean] = 20; // cap
    setJson(STORAGE_KEYS.brands, data);
  }

  function getTypeAffinity() {
    return getJson(STORAGE_KEYS.types, {});
  }

  function recordTypeInteraction(type, weight = 1) {
    if (!type || typeof type !== 'string') return;
    const clean = type.trim().toLowerCase();
    if (!clean) return;

    const data = getTypeAffinity();
    data[clean] = (data[clean] || 0) + weight;
    if (data[clean] > 15) data[clean] = 15;
    setJson(STORAGE_KEYS.types, data);
  }

  function getWishlistIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.wishlist);
      if (!raw) return new Set();
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return new Set();
      return new Set(list.map(item => String(item.id || item)));
    } catch (e) {
      return new Set();
    }
  }

  /* ------------------------------------------------------------------------
     2. Global Interaction Trackers (Captures User Keywords & Liking)
     ------------------------------------------------------------------------ */
  function initGlobalTrackers() {
    // 2.1 Track Search Keyword Inputs & Submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!form || !form.matches) return;
      if (form.matches('form[action*="/search"]') || form.querySelector('input[name="q"]')) {
        const input = form.querySelector('input[name="q"], input[type="search"]');
        if (input && input.value) {
          saveKeyword(input.value);
        }
      }
    }, true);

    document.addEventListener('change', (e) => {
      const target = e.target;
      if (target && target.matches && (target.matches('input[name="q"]') || target.matches('[ref="searchInput"]'))) {
        if (target.value) {
          saveKeyword(target.value);
        }
      }
    }, true);

    // Track URL search query if landing from search
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('q')) {
        saveKeyword(url.searchParams.get('q'));
      }
    } catch (e) {}

    // 2.2 Track Clicks on Product Cards & Wishlists
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target || !target.closest) return;

      // Click on Add to Cart
      const addBtn = target.closest('.lame-cat-card__btn-add, [data-add-to-cart], [name="add"]');
      if (addBtn) {
        const card = addBtn.closest('li[data-product-id], .lame-category-shop__item');
        if (card) {
          if (card.dataset.brand || card.dataset.vendor) recordBrandInteraction(card.dataset.brand || card.dataset.vendor, 3);
          if (card.dataset.type) recordTypeInteraction(card.dataset.type, 2);
          if (card.dataset.title) saveKeyword(extractKeyTerm(card.dataset.title));
        }
      }

      // Click on Wishlist Button
      const wishBtn = target.closest('[data-wishlist-toggle], .lame-cat-card__wishlist-btn');
      if (wishBtn) {
        const card = wishBtn.closest('li[data-product-id], .lame-category-shop__item');
        if (card) {
          if (card.dataset.brand || card.dataset.vendor) recordBrandInteraction(card.dataset.brand || card.dataset.vendor, 3);
          if (card.dataset.type) recordTypeInteraction(card.dataset.type, 2);
        }
      }

      // Click on Product Link / Title / Card Image
      const cardLink = target.closest('.lame-cat-card__media-link, .lame-cat-card__title a, .product-card');
      if (cardLink) {
        const card = cardLink.closest('li[data-product-id], .lame-category-shop__item');
        if (card) {
          if (card.dataset.brand || card.dataset.vendor) recordBrandInteraction(card.dataset.brand || card.dataset.vendor, 1);
          if (card.dataset.type) recordTypeInteraction(card.dataset.type, 1);
          if (card.dataset.title) saveKeyword(extractKeyTerm(card.dataset.title));
        }
      }

      // Click on Brand Filter Tile in Band 2
      const brandTile = target.closest('.lame-brand-tile, [data-brand-slug]');
      if (brandTile) {
        const b = brandTile.dataset.vendor || brandTile.dataset.brandSlug || '';
        if (b) recordBrandInteraction(b, 2);
      }
    }, { passive: true });
  }

  function extractKeyTerm(title) {
    if (!title) return '';
    const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['with','your','pack','skin','care','ml','gm','cream'].includes(w));
    return words[0] || '';
  }

  /* ------------------------------------------------------------------------
     3. Scoring & Sorting Engine
     ------------------------------------------------------------------------ */
  function scoreCard(card, keywords, brandAffinity, typeAffinity, wishlistIds, isPureRandom = false) {
    if (isPureRandom) {
      return Math.random() * 1000;
    }

    let score = 0;
    const title = (card.dataset.title || '').toLowerCase();
    const brand = (card.dataset.brand || card.dataset.vendor || '').toLowerCase();
    const type = (card.dataset.type || '').toLowerCase();
    const tags = (card.dataset.tags || '').toLowerCase();
    const id = card.dataset.productId ? String(card.dataset.productId) : '';

    // A. Match customer search keywords (+25 pts per match)
    if (keywords.length) {
      for (const kw of keywords) {
        if (!kw || kw.length < 2) continue;
        if (title.includes(kw)) {
          score += 25;
        } else if (brand.includes(kw)) {
          score += 20;
        } else if (tags.includes(kw)) {
          score += 15;
        } else if (type.includes(kw)) {
          score += 12;
        }
      }
    }

    // B. Brand affinity (+15 pts max)
    if (brand && brandAffinity[brand]) {
      score += Math.min(brandAffinity[brand] * 5, 20);
    }

    // C. Product type / category affinity (+12 pts max)
    if (type && typeAffinity[type]) {
      score += Math.min(typeAffinity[type] * 4, 15);
    }

    // D. Wishlist boost (+20 pts)
    if (id && wishlistIds.has(id)) {
      score += 20;
    }

    // E. Dynamic Random Jitter (Math.random() * 9)
    // Ensures products with equal affinity are shuffled randomly on each visit!
    score += Math.random() * 9;

    return score;
  }

  function applySmartCollectionSort(forceMode = null) {
    const grid = document.querySelector('.lame-category-shop__grid') ||
                 document.querySelector('.product-grid') ||
                 document.querySelector('[data-testid="product-grid"]') ||
                 document.querySelector('#ResultsList');
    if (!grid) return;

    // Check if user has explicitly requested a price or date sort via URL
    let currentSort = '';
    try {
      const url = new URL(window.location.href);
      currentSort = url.searchParams.get('sort_by') || '';
    } catch (e) {}

    // If customer selected price-ascending, price-descending, or created-descending, respect their explicit choice
    if (currentSort && currentSort !== 'manual' && currentSort !== 'recommended' && currentSort !== 'random' && currentSort !== 'featured') {
      if (!forceMode) return;
    }

    const cards = Array.from(grid.querySelectorAll('li.lame-category-shop__item, li.product-grid__item, li[data-product-id]'));
    if (cards.length <= 1) return;

    const keywords = getKeywords();
    const brandAffinity = getBrandAffinity();
    const typeAffinity = getTypeAffinity();
    const wishlistIds = getWishlistIds();

    const isPureRandom = forceMode === 'random' || currentSort === 'random';

    // Score all cards
    const scored = cards.map(card => ({
      card,
      score: scoreCard(card, keywords, brandAffinity, typeAffinity, wishlistIds, isPureRandom)
    }));

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Apply smooth visual transition
    grid.style.transition = 'opacity 0.22s ease-in-out';
    grid.style.opacity = '0.5';

    setTimeout(() => {
      scored.forEach(item => {
        grid.appendChild(item.card);
      });
      grid.style.opacity = '1';
    }, 120);
  }

  /* ------------------------------------------------------------------------
     4. Shuffle Button & UI Bindings
     ------------------------------------------------------------------------ */
  function setupShuffleButtons() {
    const shuffleBtns = document.querySelectorAll('[data-filter-shuffle]');
    shuffleBtns.forEach(btn => {
      if (btn.hasAttribute('data-shuffle-bound')) return;
      btn.setAttribute('data-shuffle-bound', 'true');

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.classList.add('is-spinning');

        // Force a fresh pure random shuffle across the products
        applySmartCollectionSort('random');

        const originalText = btn.querySelector('span')?.textContent || 'Shuffle';
        const labelEl = btn.querySelector('span');
        if (labelEl) labelEl.textContent = 'Shuffled!';

        setTimeout(() => {
          btn.classList.remove('is-spinning');
          if (labelEl) labelEl.textContent = originalText;
        }, 800);
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Initialization & DOM Listeners
     ------------------------------------------------------------------------ */
  function init() {
    initGlobalTrackers();

    // Run on initial page load if on a collection page
    const isCollection = document.querySelector('.lame-op-shop-nav, results-list, .lame-category-shop__grid, .lame-collection-shell');
    if (isCollection) {
      // Delay slightly so cards are in DOM
      setTimeout(() => {
        applySmartCollectionSort();
        setupShuffleButtons();
      }, 50);
    }

    // Re-bind when filters or AJAX results swap
    const observer = new MutationObserver(() => {
      setupShuffleButtons();
    });
    const mainEl = document.querySelector('results-list') || document.querySelector('main') || document.body;
    if (mainEl) {
      observer.observe(mainEl, { childList: true, subtree: false });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export globally for integration with other theme scripts
  window.LameSmartCollection = {
    sort: applySmartCollectionSort,
    recordKeyword: saveKeyword,
    recordBrand: recordBrandInteraction,
    recordType: recordTypeInteraction
  };
})();
