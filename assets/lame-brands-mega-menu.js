/**
 * Interactive controller for the Lamé Brands Mega Menu.
 * Handles instant search filtering, category tab switching,
 * alphabetical A-Z jump/filter, and empty state management.
 */

(function () {
  'use strict';

  function initBrandsMegaMenu(root) {
    if (!root || root.dataset.brandsMegaInitialized === 'true') return;
    root.dataset.brandsMegaInitialized = 'true';

    const searchInput = root.querySelector('[data-brand-search-input]');
    const searchClear = root.querySelector('[data-brand-search-clear]');
    const tabs = root.querySelectorAll('[data-brand-tab]');
    const azButtons = root.querySelectorAll('[data-brand-az-strip] button');
    const brandCards = root.querySelectorAll('[data-brand-card]');
    const textItems = root.querySelectorAll('[data-brand-item]');
    const emptyState = root.querySelector('[data-brand-empty]');
    const resetBtn = root.querySelector('[data-brand-reset-btn]');
    const listScroll = root.querySelector('[data-brand-list-scroll]');

    let currentTab = 'popular';
    let currentLetter = 'all';

    function applyFilter() {
      const query = (searchInput?.value || '').trim().toLowerCase();
      let visibleCardCount = 0;

      // 1. Filter Left Sidebar Text Items
      textItems.forEach((item) => {
        const name = (item.dataset.brandName || '').toLowerCase();
        const letter = (item.dataset.brandLetter || '').toUpperCase();

        let matchesSearch = !query || name.includes(query);
        let matchesLetter = currentLetter === 'all' || letter === currentLetter;

        if (matchesSearch && (query ? true : matchesLetter)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });

      // 2. Filter Right Grid Brand Cards
      brandCards.forEach((card) => {
        const name = (card.dataset.brandName || '').toLowerCase();
        const tabsAttr = (card.dataset.brandTabs || '').toLowerCase();
        const letter = (card.dataset.brandLetter || '').toUpperCase();

        let matchesSearch = !query || name.includes(query);
        let matchesTab = currentTab === 'popular' || tabsAttr.includes(currentTab);
        let matchesLetter = currentLetter === 'all' || letter === currentLetter;

        // When a search query is active, search overrides tab/letter filter
        let show = false;
        if (query) {
          show = matchesSearch;
        } else if (currentLetter !== 'all') {
          show = matchesLetter;
        } else {
          show = matchesTab;
        }

        if (show) {
          card.classList.remove('is-hidden');
          visibleCardCount++;
        } else {
          card.classList.add('is-hidden');
        }
      });

      // 3. Update Empty State
      if (emptyState) {
        emptyState.style.display = visibleCardCount === 0 ? 'block' : 'none';
      }

      // 4. Update Clear Button Visibility
      if (searchClear) {
        searchClear.style.display = query ? 'block' : 'none';
      }
    }

    // Search Input Listener
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        applyFilter();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          applyFilter();
        }
      });
    }

    // Search Clear Button Listener
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        applyFilter();
      });
    }

    // Tab Buttons Listener
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        currentTab = tab.dataset.brandTab || 'popular';
        currentLetter = 'all';

        // Reset active AZ button
        azButtons.forEach((btn) => btn.classList.remove('is-active'));
        const allBtn = root.querySelector('[data-brand-az-strip] [data-letter="all"]');
        if (allBtn) allBtn.classList.add('is-active');

        // Clear search input if user clicks tab
        if (searchInput && searchInput.value) {
          searchInput.value = '';
        }

        applyFilter();
      });
    });

    // A-Z Strip Buttons Listener
    azButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        azButtons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        currentLetter = (btn.dataset.letter || 'all').toUpperCase();

        if (searchInput && searchInput.value) {
          searchInput.value = '';
        }

        // Scroll sidebar list to the first matching brand item
        if (currentLetter !== 'ALL' && listScroll) {
          const firstMatch = listScroll.querySelector(`[data-brand-letter="${currentLetter}"]`);
          if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else if (listScroll) {
          listScroll.scrollTo({ top: 0, behavior: 'smooth' });
        }

        applyFilter();
      });
    });

    // Empty state reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentLetter = 'all';
        currentTab = 'popular';

        tabs.forEach((t) => {
          const isPop = t.dataset.brandTab === 'popular';
          t.classList.toggle('is-active', isPop);
          t.setAttribute('aria-selected', isPop ? 'true' : 'false');
        });

        azButtons.forEach((btn) => btn.classList.remove('is-active'));
        const allBtn = root.querySelector('[data-brand-az-strip] [data-letter="all"]');
        if (allBtn) allBtn.classList.add('is-active');

        applyFilter();
      });
    }

    // Initial filter
    applyFilter();
  }

  function setup() {
    document.querySelectorAll('[data-brands-mega]').forEach(initBrandsMegaMenu);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  // Handle Shopify theme editor section reload & dynamic hydration
  document.addEventListener('shopify:section:load', setup);
  window.addEventListener('load', setup);
})();
