/**
 * Mobile home hero — instant slide snap, and a swipe loop at both ends.
 * Scoped to the homepage hero carousel on phones.
 */
const MOBILE_HERO_MQ = window.matchMedia('(max-width: 599px)');
const SWIPE_THRESHOLD = 36;

/** @param {HTMLElement} scroller */
function patchMobileHeroScroller(scroller) {
  if (!MOBILE_HERO_MQ.matches || scroller.dataset.lameHeroSnapPatched === 'true') return;

  scroller.dataset.lameHeroSnapPatched = 'true';
  scroller.style.scrollBehavior = 'auto';

  const nativeScrollTo = scroller.scrollTo.bind(scroller);
  scroller.scrollTo = (options) => {
    if (typeof options === 'object' && options?.behavior === 'smooth') {
      nativeScrollTo({ ...options, behavior: 'instant' });
      return;
    }
    nativeScrollTo(options);
  };

  enableMobileHeroLoop(scroller);
}

/**
 * Native scroll stops at the first and last slide. A further swipe wraps around.
 * @param {HTMLElement} scroller
 */
function enableMobileHeroLoop(scroller) {
  const component = scroller.closest('slideshow-component');
  if (!(component instanceof HTMLElement) || scroller.dataset.lameHeroLoop === 'true') return;

  scroller.dataset.lameHeroLoop = 'true';

  /** @type {{ x: number, y: number, left: number } | null} */
  let start = null;

  scroller.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      start = { x: touch.clientX, y: touch.clientY, left: scroller.scrollLeft };
    },
    { passive: true }
  );

  scroller.addEventListener(
    'touchend',
    (event) => {
      const origin = start;
      start = null;
      const touch = event.changedTouches[0];
      if (!origin || !touch) return;

      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

      const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      const atStart = origin.left <= 8;
      const atEnd = origin.left >= maxScroll - 8;
      const slideshow = /** @type {HTMLElement & { select?: Function, slides?: HTMLElement[] }} */ (component);
      const count = slideshow.slides?.length ?? 0;
      if (count < 2 || typeof slideshow.select !== 'function') return;

      if (atEnd && dx < 0) {
        slideshow.select(count, undefined, { animate: true });
      } else if (atStart && dx > 0) {
        slideshow.select(-1, undefined, { animate: true });
      }
    },
    { passive: true }
  );
}

function initMobileHeroSnap() {
  if (!MOBILE_HERO_MQ.matches) return;

  document
    .querySelectorAll(
      '.lame-home-hero__carousel--mobile slideshow-slides, .lame-home-hero__carousel--desktop slideshow-slides'
    )
    .forEach((scroller) => {
      const frame = scroller.closest('.lame-home-hero__frame');
      if (frame instanceof HTMLElement && getComputedStyle(frame).display === 'none') return;
      patchMobileHeroScroller(/** @type {HTMLElement} */ (scroller));
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileHeroSnap, { once: true });
} else {
  initMobileHeroSnap();
}

MOBILE_HERO_MQ.addEventListener('change', initMobileHeroSnap);
