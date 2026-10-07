/**
 * Lamé Festive Glow Combos
 * Handles 1-click combo additions (both products together),
 * matching item upsell additions in PDP & Cart Drawer,
 * and automatic cart drawer opening.
 */
(function () {
  'use strict';

  if (!document.getElementById('lame-combo-styles')) {
    const style = document.createElement('style');
    style.id = 'lame-combo-styles';
    style.textContent = `
      @keyframes lameSpin { to { transform: rotate(360deg); } }
      .lame-combo-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: lameSpin 0.6s linear infinite;
        vertical-align: middle;
        margin-right: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Adds an array of items to the Shopify cart and updates the drawer
   * @param {Array<{id: string|number, quantity: number}>} items
   * @param {HTMLElement|null} triggerBtn
   */
  async function addComboToCart(items, triggerBtn) {
    if (!items || !items.length) return;

    const originalHtml = triggerBtn ? triggerBtn.innerHTML : '';
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.classList.add('is-loading');
      triggerBtn.innerHTML = `
        <span class="lame-combo-spinner" aria-hidden="true"></span>
        <span>Adding Combo...</span>
      `;
    }

    try {
      // Collect cart-items-component section IDs so Shopify Section API renders new drawer
      const sectionIds = [];
      document.querySelectorAll('cart-items-component').forEach((el) => {
        if (el.dataset.sectionId) sectionIds.push(el.dataset.sectionId);
      });

      const payload = {
        items: items.map((it) => ({
          id: Number(it.id),
          quantity: Number(it.quantity) || 1,
        })),
      };

      if (sectionIds.length) {
        payload.sections = sectionIds.join(',');
        payload.sections_url = window.location.pathname;
      }

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.status) {
        throw new Error(data.message || data.description || 'Could not add items to cart');
      }

      // Fetch fresh cart JSON
      const cartRes = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      const cartData = await cartRes.json();

      // Dispatch standard cart:update event
      document.dispatchEvent(
        new CustomEvent('cart:update', {
          bubbles: true,
          detail: {
            resource: cartData,
            sourceId: 'lame-festive-combo',
            data: { source: 'lame-festive-combo', sections: data.sections },
          },
        })
      );

      // Morph sections if available
      if (data.sections && window.morphSection) {
        sectionIds.forEach((sId) => {
          if (data.sections[sId]) {
            try {
              window.morphSection(sId, data.sections[sId]);
            } catch (err) {
              console.warn('Section morph warning:', err);
            }
          }
        });
      }

      // Update button to success state
      if (triggerBtn) {
        triggerBtn.classList.remove('is-loading');
        triggerBtn.classList.add('is-success');
        triggerBtn.innerHTML = `<span>✓ Added to Cart!</span>`;
      }

      // Open cart drawer
      setTimeout(() => {
        const cartDrawer = document.querySelector('cart-drawer-component');
        if (cartDrawer && typeof cartDrawer.open === 'function') {
          cartDrawer.open();
        } else if (cartDrawer && typeof cartDrawer.showDialog === 'function') {
          cartDrawer.showDialog();
        }
      }, 150);

      // Reset button after 2.5s
      setTimeout(() => {
        if (triggerBtn) {
          triggerBtn.disabled = false;
          triggerBtn.classList.remove('is-success');
          triggerBtn.innerHTML = originalHtml;
        }
      }, 2500);

    } catch (error) {
      console.error('Festive Combo Add error:', error);
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.classList.remove('is-loading');
        triggerBtn.innerHTML = originalHtml;
      }
      alert('Could not add combo to cart right now. Please try again.');
    }
  }

  // Delegated click event for 1-click combo add buttons
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-lame-combo-add]');
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      const raw = btn.getAttribute('data-items');
      if (!raw) return;
      const items = JSON.parse(raw);
      addComboToCart(items, btn);
    } catch (err) {
      console.error('Failed to parse combo items JSON:', err);
    }
  });

  // Delegated click for applying FESTIVE199 discount code
  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-lame-apply-festive-code]');
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();

    const code = btn.getAttribute('data-lame-apply-festive-code') || 'FESTIVE199';
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Applying...';

    try {
      const sectionIds = [];
      document.querySelectorAll('cart-items-component').forEach((el) => {
        if (el.dataset.sectionId) sectionIds.push(el.dataset.sectionId);
      });

      const body = { discount: code };
      if (sectionIds.length) body.sections = sectionIds;

      const res = await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      const cartRes = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      const cart = await cartRes.json();

      document.dispatchEvent(
        new CustomEvent('cart:update', {
          bubbles: true,
          detail: { resource: cart, sourceId: 'lame-discount', data: { sections: data.sections } },
        })
      );
      btn.textContent = '✓ Applied!';
      setTimeout(() => {
        btn.textContent = oldText;
        btn.disabled = false;
      }, 3000);
    } catch (err) {
      console.error('Apply discount error:', err);
      btn.textContent = oldText;
      btn.disabled = false;
    }
  });
})();
