/**
 * Elite Pro Cart Synchronization
 * - Keeps Elite Pro quantity at 1 in the real cart (calls /cart/change.js)
 * - Removes any legacy Platform Fee line if present
 * - Refreshes cart drawer and totals
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
      const res = await fetch('/cart.js', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      if (!res.ok) return;
      const cart = await res.json();
      if (!cart || !Array.isArray(cart.items)) return;

      const eliteItems = cart.items.filter(function(item) {
        const h = (item.handle || item.product_handle || '').toLowerCase();
        const t = (item.product_title || item.title || '').toLowerCase();
        const u = (item.url || '').toLowerCase();
        return h === ELITE_PRO_HANDLE || t.indexOf('elite pro') !== -1 || u.indexOf('elite-pro') !== -1;
      });

      const platformFeeItems = cart.items.filter(function(item) {
        const h = (item.handle || item.product_handle || '').toLowerCase();
        const t = (item.product_title || item.title || '').toLowerCase();
        const vId = String(item.variant_id);
        return h === PLATFORM_FEE_HANDLE || vId === String(PLATFORM_FEE_VARIANT_ID) || t.indexOf('platform fee') !== -1;
      });

      const hasElite = eliteItems.length > 0;
      let cartChanged = false;

      // 1. Keep Elite Pro at quantity 1
      if (hasElite) {
        const totalEliteQty = eliteItems.reduce(function(sum, it) { return sum + it.quantity; }, 0);
        if (totalEliteQty > 1 || eliteItems[0].quantity > 1 || eliteItems.length > 1) {
          // Set first Elite Pro line to quantity 1
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ id: eliteItems[0].key, quantity: 1 })
          });

          // Remove any extra duplicate Elite Pro lines
          for (let i = 1; i < eliteItems.length; i++) {
            await fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify({ id: eliteItems[i].key, quantity: 0 })
            });
          }
          cartChanged = true;
        }

      }

      // 2. Remove legacy Platform Fee if present (for visitors who already have it in their cart)
      if (platformFeeItems.length > 0) {
        for (let k = 0; k < platformFeeItems.length; k++) {
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ id: platformFeeItems[k].key, quantity: 0 })
          });
        }
        cartChanged = true;
      }

      // 3. Refresh cart drawer & totals
      if (cartChanged) {
        await refreshCartUI();
      }
    } catch (err) {
      console.error('[Elite Pro Cart Sync] Error:', err);
    } finally {
      isSyncing = false;
    }
  }

  async function refreshCartUI() {
    // If on /cart page, reload
    if (window.location.pathname.endsWith('/cart') || window.location.pathname.endsWith('/cart/')) {
      window.location.reload();
      return;
    }

    const sectionIds = new Set();
    document.querySelectorAll('cart-items-component').forEach(function(el) {
      if (el.dataset.sectionId) sectionIds.add(el.dataset.sectionId);
    });
    const headerSection = document.querySelector('#shopify-section-header, .header-section');
    if (headerSection) {
      const hId = headerSection.id.replace('shopify-section-', '');
      if (hId) sectionIds.add(hId);
    }

    const sectionsParam = Array.from(sectionIds).join(',');
    const url = '/cart.js' + (sectionsParam ? '?sections=' + encodeURIComponent(sectionsParam) : '');

    try {
      const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const data = await res.json();

      document.dispatchEvent(new CustomEvent('cart:update', {
        bubbles: true,
        detail: {
          source: 'elite-pro-sync',
          resource: data,
          data: {
            itemCount: data.item_count,
            sections: data.sections || {}
          }
        }
      }));

      if (data.sections) {
        for (const [sId, sHtml] of Object.entries(data.sections)) {
          const container = document.getElementById('shopify-section-' + sId);
          if (container) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(sHtml, 'text/html');
            const newContent = doc.getElementById('shopify-section-' + sId);
            if (newContent) {
              container.innerHTML = newContent.innerHTML;
            }
          }
        }
      }
    } catch (e) {
      console.error('[Elite Pro Cart Sync] Refresh failed:', e);
    }
  }

  function triggerSync(delay) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(checkAndSyncCart, delay || 50);
  }

  // Trigger sync on load immediately
  triggerSync(0);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { triggerSync(50); });
  }

  document.addEventListener('cart:update', function(e) {
    if (e.detail?.source !== 'elite-pro-sync') {
      triggerSync(100);
    }
  });

  document.addEventListener('cart:add', function() {
    triggerSync(100);
  });

  document.addEventListener('dialog:open', function(e) {
    if (e.target && (e.target.matches('cart-drawer-component') || e.target.closest('cart-drawer-component'))) {
      triggerSync(10);
    }
  });

  window.eliteProCartSync = checkAndSyncCart;
})();
