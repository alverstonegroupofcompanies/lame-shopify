(() => {
  const bar = document.querySelector('.lame-nav-search-wrapper');
  if (!bar) return;

  const threshold = 24;
  let lastY = window.scrollY;
  let ticking = false;
  let hidden = false;

  const setHidden = (next) => {
    if (hidden === next) return;
    hidden = next;
    bar.classList.toggle('is-scroll-hidden', next);
    bar.setAttribute('data-scroll-hidden', next ? 'true' : 'false');

    if (next) {
      bar.querySelectorAll('[data-lame-category-dropdown].is-open').forEach((root) => {
        const trigger = root.querySelector('[data-lame-category-trigger]');
        const panel = root.querySelector('[data-lame-category-panel]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (panel) panel.hidden = true;
        root.classList.remove('is-open');
      });
    }
  };

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const delta = y - lastY;

    if (y <= threshold) {
      setHidden(false);
      lastY = y;
      return;
    }

    // Ignore tiny jitter
    if (Math.abs(delta) < 6) {
      lastY = y;
      return;
    }

    if (delta > 0) {
      setHidden(true);
    } else {
      setHidden(false);
    }

    lastY = y;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  setHidden(false);
  window.addEventListener('scroll', onScroll, { passive: true });
})();
