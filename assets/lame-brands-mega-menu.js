/**
 * Interactive controller for the Lamé Brands Mega Menu.
 * Handles instant search filtering, category tab switching,
 * alphabetical A-Z jump/filter, empty state management,
 * and reliable hover/click persistence (no disappearing on mouse drag).
 */

(function () {
  'use strict';

  function initBrandsMegaMenu(root) {
    if (!root || root.dataset.brandsMegaInitialized === 'true') return;
    root.dataset.brandsMegaInitialized = 'true';

    const parentListItem = root.closest('.menu-list__list-item--brands');
    const submenu = root.closest('.menu-list__submenu--brands');
    const brandsLink = parentListItem?.querySelector('.menu-list__link--brands');
    const headerComp = root.closest('header-component') || document.querySelector('header-component');

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
    let closeTimer = null;
    let isPinnedOpen = false;

    /* ----------------------------------------------------
       Robust Open / Close / Pin Management
       ---------------------------------------------------- */
    function openMenu() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (parentListItem) {
        parentListItem.classList.add('is-open');
        parentListItem.setAttribute('data-open', 'true');
      }
      if (brandsLink) {
        brandsLink.setAttribute('aria-expanded', 'true');
      }
      if (submenu) {
        submenu.setAttribute('data-active', '');
      }
      if (headerComp) {
        const h = root.offsetHeight || 560;
        headerComp.style.setProperty('--submenu-height', `${h}px`);
        const headerTopHeight = headerComp.offsetHeight || 70;
        headerComp.style.setProperty('--full-open-header-height', `${h + headerTopHeight}px`);
      }
    }

    function scheduleClose(delay = 350) {
      if (isPinnedOpen) return;
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        if (!isPinnedOpen) {
          if (parentListItem) {
            parentListItem.classList.remove('is-open');
            parentListItem.removeAttribute('data-open');
          }
          if (brandsLink) {
            brandsLink.setAttribute('aria-expanded', 'false');
          }
          if (submenu) {
            submenu.removeAttribute('data-active');
          }
        }
      }, delay);
    }

    function closeImmediate() {
      isPinnedOpen = false;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (parentListItem) {
        parentListItem.classList.remove('is-open');
        parentListItem.removeAttribute('data-open');
      }
      if (brandsLink) {
        brandsLink.setAttribute('aria-expanded', 'false');
      }
      if (submenu) {
        submenu.removeAttribute('data-active');
      }
    }

    // Toggle on click of "Brands" link so shoppers can pin it open
    if (brandsLink) {
      brandsLink.addEventListener('click', (e) => {
        if (parentListItem?.classList.contains('is-open') && isPinnedOpen) {
          closeImmediate();
        } else {
          e.preventDefault();
          e.stopPropagation();
          isPinnedOpen = true;
          openMenu();
        }
      });
    }

    // Hover intent on parent list item and submenu
    const hoverElements = [parentListItem, submenu].filter(Boolean);
    hoverElements.forEach((el) => {
      el.addEventListener('pointerenter', () => {
        openMenu();
      });
      el.addEventListener('mouseenter', () => {
        openMenu();
      });
      el.addEventListener('pointerleave', (e) => {
        const to = e.relatedTarget;
        if (to && (parentListItem?.contains(to) || root.contains(to))) {
          return;
        }
        scheduleClose(350);
      });
      el.addEventListener('mouseleave', (e) => {
        const to = e.relatedTarget;
        if (to && (parentListItem?.contains(to) || root.contains(to))) {
          return;
        }
        scheduleClose(350);
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!parentListItem?.contains(e.target) && !root.contains(e.target)) {
        closeImmediate();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeImmediate();
      }
    });

    /* ----------------------------------------------------
       Filtering & Tab Logic
       ---------------------------------------------------- */
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
        const tabsAttr = (card.dataset.brandTabs || 'popular').toLowerCase();
        const letter = (card.dataset.brandLetter || '').toUpperCase();

        let matchesSearch = !query || name.includes(query);
        let matchesTab = tabsAttr.includes(currentTab) || tabsAttr.includes('all');
        let matchesLetter = currentLetter === 'all' || letter === currentLetter;

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

    // Shopify Theme Editor live inspector integration
    function handleThemeEditorBlockSelect(e) {
      const blockId = e.detail?.blockId;
      if (!blockId) return;

      if (parentListItem) {
        parentListItem.classList.add('is-editor-open');
      }

      const targetCard = Array.from(brandCards).find((c) => {
        const attr = c.getAttribute('data-shopify-editor-block') || '';
        return attr.includes(blockId) || c.id?.includes(blockId);
      });

      if (targetCard) {
        const bTabs = (targetCard.dataset.brandTabs || 'popular').toLowerCase();
        if (!bTabs.includes(currentTab) && !bTabs.includes('all')) {
          const firstTab = bTabs.split(',')[0].trim();
          const targetTabBtn = root.querySelector(`[data-brand-tab="${firstTab}"]`);
          if (targetTabBtn) targetTabBtn.click();
        }

        targetCard.classList.remove('is-hidden');
        targetCard.classList.add('is-editor-selected');
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function handleThemeEditorBlockDeselect() {
      if (parentListItem) {
        parentListItem.classList.remove('is-editor-open');
      }
      brandCards.forEach((c) => c.classList.remove('is-editor-selected'));
    }

    document.addEventListener('shopify:block:select', handleThemeEditorBlockSelect);
    document.addEventListener('shopify:block:deselect', handleThemeEditorBlockDeselect);

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

  document.addEventListener('shopify:section:load', setup);
  window.addEventListener('load', setup);
})();
