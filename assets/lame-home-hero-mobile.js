/**
 * Mobile home hero — instant slide snap (no smooth-scroll animation on swipe).
 * Scoped to .lame-home-hero__carousel--mobile only.
 */
const MOBILE_HERO_MQ = window.matchMedia('(max-width: 1199px)');

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
}

function initMobileHeroSnap() {
  if (!MOBILE_HERO_MQ.matches) return;

  document
    .querySelectorAll(
      '.lame-home-hero__carousel--mobile slideshow-slides, .lame-home-hero:not(.lame-home-hero--has-mobile-banners) .lame-home-hero__carousel--desktop slideshow-slides'
    )
    .forEach((scroller) => patchMobileHeroScroller(/** @type {HTMLElement} */ (scroller)));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileHeroSnap, { once: true });
} else {
  initMobileHeroSnap();
}

MOBILE_HERO_MQ.addEventListener('change', initMobileHeroSnap);
