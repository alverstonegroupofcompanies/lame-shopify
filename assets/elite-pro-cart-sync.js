/**
 * Elite Pro & Platform Fee Cart Synchronization
 * - Keeps Elite Pro quantity at 1 (resets to 1 if > 1)
 * - Auto-adds Platform Fee (handle: platform-fee, variant ID: 67905718648934, qty 1) when Elite Pro is in cart
 * - Removes Platform Fee when Elite Pro is removed
 * - Ensures Platform Fee cannot go above qty 1
 * - Refreshes cart drawer and totals after changes
 */
(function() {
  const ELITE_PRO_HANDLE = 'elite-pro-6-months';
  const PLATFORM_FEE_HANDLE = 'platform-fee';
  const PLATFORM_FEE_VARIANT_ID = 67905718648934;

  let isSyncing = false;
  let syncTimeout = null;

  async function checkAndSyncCart() {
    if (isSyncing) return;
    isSyncing = true;

    try {
      const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const cart = await res.json();
      if (!cart || !Array.isArray(cart.items)) return;

      const eliteItems = cart.items.filter(function(item) {
        const h = (item.handle || '').toLowerCase();
        const t = (item.product_title || item.title || '').toLowerCase();
        return h === ELITE_PRO_HANDLE || t.indexOf('elite pro') !== -1;
      });

      const platformFeeItems = cart.items.filter(function(item) {
        const h = (item.handle || '').toLowerCase();
        return h === PLATFORM_FEE_HANDLE || item.variant_id === PLATFORM_FEE_VARIANT_ID;
      });

      const hasElite = eliteItems.length > 0;
      let needsRefresh = false;

      // Rule 1: Clamp Elite Pro to quantity 1
      for (let i = 0; i < eliteItems.length; i++) {
        const eliteItem = eliteItems[i];
        if (eliteItem.quantity > 1) {
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ id: eliteItem.key, quantity: 1 })
          });
          needsRefresh = true;
        }
      }

      // Rule 2: When Elite Pro is in cart, auto-add Platform Fee (qty 1)
      if (hasElite) {
        if (platformFeeItems.length === 0) {
          await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ id: PLATFORM_FEE_VARIANT_ID, quantity: 1 })
          });
          needsRefresh = true;
        } else {
          // Rule 3: Platform Fee must never go above qty 1
          for (let j = 0; j < platformFeeItems.length; j++) {
            const feeItem = platformFeeItems[j];
            if (feeItem.quantity > 1) {
              await fetch('/cart/change.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ id: feeItem.key, quantity: 1 })
              });
              needsRefresh = true;
            }
          }
        }
      } else {
        // Rule 4: Remove Platform Fee when Elite Pro is removed
        if (platformFeeItems.length > 0) {
          for (let k = 0; k < platformFeeItems.length; k++) {
            const feeItem = platformFeeItems[k];
            await fetch('/cart/change.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ id: feeItem.key, quantity: 0 })
            });
            needsRefresh = true;
          }
        }
      }

      // Rule 5: After each change, refresh cart drawer and totals
      if (needsRefresh) {
        await refreshCart();
      }
    } catch (err) {
      console.error('Error during Elite Pro / Platform Fee cart sync:', err);
    } finally {
      isSyncing = false;
    }
  }

  async function refreshCart() {
    const cartComponents = Array.from(document.querySelectorAll('cart-items-component'));
    const sectionIds = new Set();
    cartComponents.forEach(function(c) {
      if (c.dataset.sectionId) sectionIds.add(c.dataset.sectionId);
    });

    const headerSection = document.querySelector('#shopify-section-header, .header-section');
    if (headerSection) {
      const hId = headerSection.id.replace('shopify-section-', '');
      if (hId) sectionIds.add(hId);
    }

    const mainCart = document.querySelector('[data-section-type="main-cart"], .main-cart-section');
    if (mainCart && mainCart.dataset.sectionId) {
      sectionIds.add(mainCart.dataset.sectionId);
    }

    const sectionsParam = Array.from(sectionIds).join(',');
    const url = '/cart.js' + (sectionsParam ? '?sections=' + encodeURIComponent(sectionsParam) : '');

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const cartData = await res.json();

    document.dispatchEvent(new CustomEvent('cart:update', {
      bubbles: true,
      detail: {
        source: 'elite-pro-sync',
        resource: cartData,
        data: {
          itemCount: cartData.item_count,
          sections: cartData.sections || {}
        }
      }
    }));

    if (window.location.pathname.includes('/cart')) {
      if (!cartData.sections || Object.keys(cartData.sections).length === 0) {
        window.location.reload();
      }
    }
  }

  function scheduleSync(delay) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(checkAndSyncCart, delay || 150);
  }

  document.addEventListener('cart:update', function(e) {
    if (e.detail?.source !== 'elite-pro-sync') {
      scheduleSync(100);
    }
  });

  document.addEventListener('cart:add', function() {
    scheduleSync(150);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { scheduleSync(200); });
  } else {
    scheduleSync(200);
  }

  document.addEventListener('dialog:open', function(e) {
    if (e.target && (e.target.matches('cart-drawer-component') || e.target.closest('cart-drawer-component'))) {
      scheduleSync(50);
    }
  });
})();
