(() => {
  if (window.__lameBeautyLoveBoot) return;
  window.__lameBeautyLoveBoot = true;

  const DEFAULT_INTERVAL = 5000;
  const SWIPE_THRESHOLD = 36;
  const sliders = [];
  let sharedTimer = null;
  let intervalMs = DEFAULT_INTERVAL;
  let pausedByHover = 0;

  class BeautyBrandSlider {
    constructor(root) {
      this.root = root;
      this.media = root.querySelector('.lame-beauty-love__media');
      this.slides = [...root.querySelectorAll('[data-beauty-slide]')];
      this.copies = [...root.querySelectorAll('[data-beauty-copy]')];
      this.dots = [...root.querySelectorAll('[data-beauty-dot]')];
      this.index = 0;
      this.suppressClick = false;
      if (this.slides.length < 2) return;

      this.dots.forEach((dot) => {
        dot.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.goTo(Number(dot.dataset.index) || 0);
          restartShared();
        });
      });

      this.bindGestures();
      this.goTo(0);
    }

    bindGestures() {
      if (!this.media) return;

      let tracking = false;
      let axis = null;
      let dragged = false;
      let startX = 0;
      let startY = 0;
      let pointerId = null;

      const endGesture = (event) => {
        if (!tracking) return;
        tracking = false;
        this.media.classList.remove('is-dragging');

        if (pointerId != null && this.media.hasPointerCapture?.(pointerId)) {
          try {
            this.media.releasePointerCapture(pointerId);
          } catch (_) {
            /* ignore */
          }
        }
        pointerId = null;

        const dx = event.clientX - startX;
        if (axis === 'x' && Math.abs(dx) >= SWIPE_THRESHOLD) {
          if (dx < 0) this.next();
          else this.prev();
          this.suppressClick = true;
        } else {
          this.suppressClick = dragged;
        }

        axis = null;
        dragged = false;
        restartShared();
      };

      this.media.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (event.target.closest('[data-beauty-dot]')) return;

        tracking = true;
        axis = null;
        dragged = false;
        this.suppressClick = false;
        startX = event.clientX;
        startY = event.clientY;
        pointerId = event.pointerId;
        this.media.classList.add('is-dragging');
        stopShared();

        try {
          this.media.setPointerCapture(event.pointerId);
        } catch (_) {
          /* ignore */
        }
      });

      this.media.addEventListener(
        'pointermove',
        (event) => {
          if (!tracking) return;

          const dx = event.clientX - startX;
          const dy = event.clientY - startY;

          if (!axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            if (axis === 'y') {
              tracking = false;
              this.media.classList.remove('is-dragging');
              if (pointerId != null && this.media.hasPointerCapture?.(pointerId)) {
                try {
                  this.media.releasePointerCapture(pointerId);
                } catch (_) {
                  /* ignore */
                }
              }
              pointerId = null;
              restartShared();
              return;
            }
          }

          if (axis === 'x') {
            if (event.cancelable) event.preventDefault();
            if (Math.abs(dx) > 10) dragged = true;
          }
        },
        { passive: false }
      );

      this.media.addEventListener('pointerup', endGesture);
      this.media.addEventListener('pointercancel', endGesture);

      this.root.addEventListener(
        'click',
        (event) => {
          if (!this.suppressClick) return;
          event.preventDefault();
          event.stopPropagation();
          this.suppressClick = false;
        },
        true
      );
    }

    goTo(next) {
      const total = this.slides.length;
      if (total < 2) return;
      this.index = ((next % total) + total) % total;

      this.slides.forEach((slide, i) => {
        const active = i === this.index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        if (slide.tagName === 'A') {
          slide.tabIndex = active ? 0 : -1;
        }
      });

      this.copies.forEach((copy, i) => {
        const active = i === this.index;
        copy.classList.toggle('is-active', active);
        copy.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      this.dots.forEach((dot, i) => {
        const active = i === this.index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    next() {
      this.goTo(this.index + 1);
    }

    prev() {
      this.goTo(this.index - 1);
    }
  }

  function stopShared() {
    if (sharedTimer) {
      window.clearInterval(sharedTimer);
      sharedTimer = null;
    }
  }

  function startShared() {
    stopShared();
    if (intervalMs <= 0 || sliders.length === 0 || pausedByHover > 0) return;
    if (document.hidden) return;
    sharedTimer = window.setInterval(() => {
      sliders.forEach((slider) => slider.next());
    }, intervalMs);
  }

  function restartShared() {
    stopShared();
    startShared();
  }

  function bindSectionPause(section) {
    if (!section || section.dataset.beautyPauseBound) return;
    section.dataset.beautyPauseBound = '1';

    const refreshPause = () => {
      const anyHovered = [...document.querySelectorAll('[data-beauty-slider]')].some((card) => {
        return card.matches(':hover') || card.contains(document.activeElement);
      });
      if (anyHovered) {
        pausedByHover = 1;
        stopShared();
      } else {
        pausedByHover = 0;
        startShared();
      }
    };

    section.querySelectorAll('[data-beauty-slider]').forEach((card) => {
      card.addEventListener('mouseenter', refreshPause);
      card.addEventListener('mouseleave', refreshPause);
      card.addEventListener('focusin', refreshPause);
      card.addEventListener('focusout', () => {
        window.requestAnimationFrame(refreshPause);
      });
    });
  }

  function init() {
    const sections = [...document.querySelectorAll('[data-beauty-sync]')];
    if (!sections.length) return;

    const rawInterval = Number(sections[0].dataset.autoplay);
    intervalMs = Number.isFinite(rawInterval) ? rawInterval : DEFAULT_INTERVAL;

    sections.forEach((section) => {
      section.querySelectorAll('[data-beauty-slider]').forEach((el) => {
        if (el.dataset.beautySliderReady) return;
        el.dataset.beautySliderReady = '1';
        const slider = new BeautyBrandSlider(el);
        if (slider.slides.length >= 2) sliders.push(slider);
      });
      bindSectionPause(section);
    });

    startShared();
  }

  const rowMedia = window.matchMedia('(min-width: 750px) and (max-width: 1199px)');
  const reduceRowMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rowLoops = [];

  function bindRow(viewport) {
    if (!viewport || viewport.dataset.beautyRowReady) return;
    const track = viewport.querySelector('[data-beauty-track]');
    if (!track) return;
    viewport.dataset.beautyRowReady = '1';

    let timer = null;
    let paused = false;
    let inView = false;
    let busy = false;

    const cards = () => [...track.querySelectorAll(':scope > .lame-beauty-love__item')];

    const gapOf = () => {
      const styles = getComputedStyle(track);
      return parseFloat(styles.columnGap || styles.gap) || 0;
    };

    const overflows = () => rowMedia.matches && track.scrollWidth > viewport.clientWidth + 4;

    const release = () => {
      busy = false;
    };

    const afterScroll = (done) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        viewport.removeEventListener('scrollend', finish);
        done();
      };
      if ('onscrollend' in window) {
        viewport.addEventListener('scrollend', finish, { once: true });
      }
      window.setTimeout(finish, 700);
    };

    const step = () => {
      const items = cards();
      if (busy || !overflows() || items.length < 2) return;
      const card = items[0];
      const delta = card.offsetWidth + gapOf();
      if (delta <= 1) return;
      busy = true;
      viewport.scrollBy({ left: delta, behavior: reduceRowMotion.matches ? 'auto' : 'smooth' });
      afterScroll(() => {
        const previousBehavior = viewport.style.scrollBehavior;
        const previousSnap = viewport.style.scrollSnapType;
        viewport.style.scrollBehavior = 'auto';
        viewport.style.scrollSnapType = 'none';
        track.appendChild(card);
        viewport.scrollLeft = Math.max(0, viewport.scrollLeft - delta);
        requestAnimationFrame(() => {
          viewport.style.scrollBehavior = previousBehavior;
          viewport.style.scrollSnapType = previousSnap;
          release();
        });
      });
    };

    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const syncTimer = () => {
      stop();
      const canScroll = overflows();
      viewport.classList.toggle('is-centered', rowMedia.matches && !canScroll);
      if (!canScroll) {
        viewport.scrollLeft = 0;
        return;
      }
      if (paused || !inView || reduceRowMotion.matches || document.hidden) return;
      timer = window.setInterval(() => {
        if (document.hidden) return;
        step();
      }, 4500);
    };

    viewport.addEventListener('mouseenter', () => {
      paused = true;
      stop();
    });
    viewport.addEventListener('mouseleave', () => {
      paused = false;
      syncTimer();
    });
    viewport.addEventListener('focusin', () => {
      paused = true;
      stop();
    });
    viewport.addEventListener('focusout', () => {
      paused = false;
      syncTimer();
    });
    viewport.addEventListener(
      'touchstart',
      () => {
        paused = true;
        stop();
      },
      { passive: true }
    );
    viewport.addEventListener(
      'touchend',
      () => {
        window.setTimeout(() => {
          paused = false;
          syncTimer();
        }, 4500);
      },
      { passive: true }
    );

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            inView = entry.isIntersecting;
            syncTimer();
          });
        },
        { threshold: 0.4 }
      );
      observer.observe(viewport);
    } else {
      inView = true;
    }

    rowLoops.push({ sync: syncTimer, stop });
    syncTimer();
    window.setTimeout(syncTimer, 400);
  }

  function bootRows() {
    document.querySelectorAll('[data-beauty-row]').forEach(bindRow);
    rowLoops.forEach((loop) => loop.sync());
  }

  function boot() {
    /* Start as soon as DOM is ready so slides advance before the section is scrolled into view */
    init();
    bootRows();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopShared();
    else if (pausedByHover === 0) startShared();
    rowLoops.forEach((loop) => loop.sync());
  });

  window.addEventListener('resize', () => {
    rowLoops.forEach((loop) => loop.sync());
  });

  if (rowMedia.addEventListener) {
    rowMedia.addEventListener('change', () => {
      rowLoops.forEach((loop) => loop.sync());
    });
  }

  document.addEventListener('shopify:section:load', (event) => {
    if (!event.target.querySelector?.('[data-beauty-sync], [data-beauty-slider]')) return;
    stopShared();
    sliders.length = 0;
    pausedByHover = 0;
    document.querySelectorAll('[data-beauty-slider]').forEach((el) => {
      delete el.dataset.beautySliderReady;
    });
    document.querySelectorAll('[data-beauty-sync]').forEach((section) => {
      delete section.dataset.beautyPauseBound;
    });
    rowLoops.forEach((loop) => loop.stop());
    document.querySelectorAll('[data-beauty-row]').forEach((row) => {
      delete row.dataset.beautyRowReady;
    });
    rowLoops.length = 0;
    boot();
  });
})();
