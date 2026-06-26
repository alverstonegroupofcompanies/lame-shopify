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

initOurProductsCollectionCart();

function relocateOurProductsSideImages() {
  const slot = document.querySelector('[data-lame-op-side-slot]');
  const root = document.querySelector('.lame-our-products-side-image-section .lame-op-side-images');
  if (!slot || !root || slot.contains(root)) return;

  slot.appendChild(root);

  const wrapper = slot.closest('.collection-wrapper');
  for (const name of ['--lame-op-side-width', '--lame-op-side-top', '--lame-op-side-gap']) {
    const value = root.style.getPropertyValue(name);
    if (!value) continue;
    slot.style.setProperty(name, value);
    wrapper?.style.setProperty(name, value);
  }
}

relocateOurProductsSideImages();

document.addEventListener('shopify:section:load', initOurProductsCollectionCart);
document.addEventListener('shopify:section:load', relocateOurProductsSideImages);
