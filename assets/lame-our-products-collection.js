import { CartAddEvent } from '@theme/events';

/**
 * Our Products collection: AJAX add-to-cart without PDP navigation;
 * keep cart drawer closed (icon count still updates).
 */
function initOurProductsCollectionCart() {
  const collectionRoot = document.querySelector('.collection-template-our-products');
  if (!collectionRoot) return;

  const cartDrawer = document.querySelector('cart-drawer-component');
  cartDrawer?.removeAttribute('auto-open');

  if (document.documentElement.dataset.lameOurProductsCartInit === 'true') return;
  document.documentElement.dataset.lameOurProductsCartInit = 'true';

  document.addEventListener(CartAddEvent.eventName, (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.detail?.data?.didError) return;
    if (event.detail?.data?.source !== 'product-form-component') return;

    const productForm = event.target.closest('product-form-component');
    if (!productForm?.closest('.collection-template-our-products')) return;

    queueMicrotask(() => {
      /** @type {{ close?: () => void } | null} */
      const drawer = document.querySelector('cart-drawer-component');
      drawer?.close?.();
    });
  });
}

/** Image-dot gallery on shop product cards (works after filter AJAX too) */
function initShopCardGalleries() {
  if (document.documentElement.dataset.lameShopGalleryInit === 'true') return;
  document.documentElement.dataset.lameShopGalleryInit = 'true';

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const dot = target.closest('[data-lame-shop-dot]');
    if (!dot) return;

    const card = dot.closest('.lame-shop-card');
    if (!card) return;

    event.preventDefault();
    event.stopPropagation();

    const gallery = card.querySelector('[data-lame-shop-gallery]');
    if (!gallery) return;

    const slides = [...gallery.querySelectorAll('[data-lame-shop-slide]')];
    const dots = [...card.querySelectorAll('[data-lame-shop-dot]')];
    const index = Number(dot.getAttribute('data-lame-shop-dot') || 0);

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.toggleAttribute('hidden', !active);
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    dots.forEach((item, i) => {
      const active = i === index;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  });
}

initOurProductsCollectionCart();
initShopCardGalleries();
initOurProductsFlashAtc();

document.addEventListener('shopify:section:load', initOurProductsCollectionCart);

function initOurProductsFlashAtc() {
  if (document.documentElement.dataset.lameOpFlashAtc === 'true') return;
  document.documentElement.dataset.lameOpFlashAtc = 'true';

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.hasAttribute('data-lame-home-atc')) return;
    if (!form.closest('.collection-template-our-products')) return;

    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button instanceof HTMLButtonElement && button.disabled) return;

    const formData = new FormData(form);
    try {
      if (button instanceof HTMLButtonElement) button.disabled = true;
      const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || data?.status) throw new Error(data?.message || 'Add to cart failed');

      const cartResponse = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`, {
        headers: { Accept: 'application/json' },
      });
      const cartData = await cartResponse.json();
      document.dispatchEvent(
        new CustomEvent('cart:update', {
          bubbles: true,
          detail: { resource: cartData, data: { source: 'our-products-flash-atc' } },
        })
      );
    } catch (error) {
      console.error('Add to cart failed', error);
    } finally {
      if (button instanceof HTMLButtonElement) button.disabled = false;
    }
  });
}
