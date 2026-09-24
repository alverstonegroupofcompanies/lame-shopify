/**
 * Keeps delivery ETA dates (today + N days) in sync with the visitor's local date.
 * Liquid renders a server-side fallback; this refreshes after load and cart morphs.
 */
const DEFAULT_DAYS = 7;
const LOCALE = 'en-IN';

/**
 * @param {number} days
 * @returns {string}
 */
function formatDeliveryDate(days = DEFAULT_DAYS) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + days);
  return end.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

/**
 * @param {ParentNode} [root]
 */
export function refreshDeliveryEtas(root = document) {
  root.querySelectorAll('[data-lame-delivery-eta]').forEach((el) => {
    const dateEl = el.querySelector('[data-lame-delivery-eta-date]');
    if (!dateEl) return;
    const days = Number(el.getAttribute('data-days') || DEFAULT_DAYS);
    dateEl.textContent = formatDeliveryDate(Number.isFinite(days) ? days : DEFAULT_DAYS);
  });
}

function scheduleRefresh() {
  requestAnimationFrame(() => refreshDeliveryEtas());
}

refreshDeliveryEtas();
document.addEventListener('cart:update', scheduleRefresh);
document.addEventListener('lame:section-morph-complete', scheduleRefresh);
