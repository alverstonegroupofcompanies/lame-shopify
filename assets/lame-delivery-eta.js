/**
 * Keeps delivery ETA ranges (today → +N days) in sync with the visitor's local date.
 * Liquid renders a server-side fallback; this refreshes after load and cart morphs.
 */
const DEFAULT_DAYS = 7;
const LOCALE = 'en-IN';

/**
 * @param {number} days
 * @returns {string}
 */
function formatRange(days = DEFAULT_DAYS) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  const opts = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString(LOCALE, opts)} – ${end.toLocaleDateString(LOCALE, opts)}`;
}

/**
 * @param {ParentNode} [root]
 */
export function refreshDeliveryEtas(root = document) {
  root.querySelectorAll('[data-lame-delivery-eta]').forEach((el) => {
    const rangeEl = el.querySelector('[data-lame-delivery-eta-range]');
    if (!rangeEl) return;
    const days = Number(el.getAttribute('data-days') || DEFAULT_DAYS);
    rangeEl.textContent = formatRange(Number.isFinite(days) ? days : DEFAULT_DAYS);
  });
}

function scheduleRefresh() {
  requestAnimationFrame(() => refreshDeliveryEtas());
}

refreshDeliveryEtas();
document.addEventListener('cart:update', scheduleRefresh);
document.addEventListener('lame:section-morph-complete', scheduleRefresh);
