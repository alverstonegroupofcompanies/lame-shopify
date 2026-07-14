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

document.addEventListener('shopify:section:load', initOurProductsCollectionCart);
