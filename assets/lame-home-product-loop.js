(() => {
  if (window.LameHomeProductLoop) return;
  window.LameHomeProductLoop = true;

  const INTERVAL = 4000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const gapOf = (track) => {
    const styles = getComputedStyle(track);
    return parseFloat(styles.columnGap || styles.gap) || 0;
  };

  const bind = (section) => {
    if (!section || section.dataset.flashLoopReady === '1') return;

    const viewport = section.querySelector('[data-flash-viewport]');
    const track = section.querySelector('[data-flash-track]');
    const prev = section.querySelector('[data-flash-prev]');
    const next = section.querySelector('[data-flash-next]');
    const scrollEl = viewport || track;
    if (!scrollEl || !track) return;

    section.dataset.flashLoopReady = '1';

    let timer = null;
    let paused = false;
    let inView = false;
    let busy = false;

    const items = () => [...track.querySelectorAll(':scope > .lame-flash-deal__item')];

    const updateLayout = () => {
      const overflows = track.scrollWidth > scrollEl.clientWidth + 4;
      scrollEl.classList.toggle('is-scrollable', overflows);
      scrollEl.classList.toggle('is-centered', !overflows);
      prev?.toggleAttribute('hidden', !overflows);
      next?.toggleAttribute('hidden', !overflows);
      if (!overflows) scrollEl.scrollLeft = 0;
      syncTimer();
    };

    const release = () => {
      busy = false;
    };

    const afterScroll = (done) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        scrollEl.removeEventListener('scrollend', finish);
        done();
      };
      if ('onscrollend' in window) {
        scrollEl.addEventListener('scrollend', finish, { once: true });
      }
      window.setTimeout(finish, 700);
    };

    const step = (direction) => {
      const cards = items();
      if (busy || cards.length < 2) return;
      if (!scrollEl.classList.contains('is-scrollable')) return;

      const card = direction > 0 ? cards[0] : cards[cards.length - 1];
      const delta = card.offsetWidth + gapOf(track);
      if (delta <= 1) return;

      busy = true;

      if (direction < 0) {
        const previousBehavior = scrollEl.style.scrollBehavior;
        const previousSnap = scrollEl.style.scrollSnapType;
        scrollEl.style.scrollBehavior = 'auto';
        scrollEl.style.scrollSnapType = 'none';
        track.insertBefore(card, cards[0]);
        scrollEl.scrollLeft += delta;
        requestAnimationFrame(() => {
          scrollEl.style.scrollBehavior = previousBehavior;
          scrollEl.style.scrollSnapType = previousSnap;
          scrollEl.scrollBy({ left: -delta, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
          afterScroll(release);
        });
        return;
      }

      scrollEl.scrollBy({ left: delta, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      afterScroll(() => {
        const previousBehavior = scrollEl.style.scrollBehavior;
        const previousSnap = scrollEl.style.scrollSnapType;
        scrollEl.style.scrollBehavior = 'auto';
        scrollEl.style.scrollSnapType = 'none';
        track.appendChild(card);
        scrollEl.scrollLeft = Math.max(0, scrollEl.scrollLeft - delta);
        requestAnimationFrame(() => {
          scrollEl.style.scrollBehavior = previousBehavior;
          scrollEl.style.scrollSnapType = previousSnap;
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
      if (paused || !inView || reduceMotion.matches) return;
      if (!scrollEl.classList.contains('is-scrollable')) return;
      if (items().length < 2) return;
      timer = window.setInterval(() => {
        if (document.hidden) return;
        step(1);
      }, INTERVAL);
    };

    prev?.addEventListener('click', () => {
      step(-1);
      syncTimer();
    });
    next?.addEventListener('click', () => {
      step(1);
      syncTimer();
    });

    const carousel = section.querySelector('.lame-flash-deal__carousel') || scrollEl;
    carousel.addEventListener('mouseenter', () => {
      paused = true;
      stop();
    });
    carousel.addEventListener('mouseleave', () => {
      paused = false;
      syncTimer();
    });
    carousel.addEventListener('focusin', () => {
      paused = true;
      stop();
    });
    carousel.addEventListener('focusout', () => {
      paused = false;
      syncTimer();
    });
    scrollEl.addEventListener(
      'touchstart',
      () => {
        paused = true;
        stop();
      },
      { passive: true }
    );
    scrollEl.addEventListener(
      'touchend',
      () => {
        window.setTimeout(() => {
          paused = false;
          syncTimer();
        }, INTERVAL);
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
      observer.observe(scrollEl);
    } else {
      inView = true;
    }

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.setTimeout(updateLayout, 250);
  };

  const boot = () => {
    document.querySelectorAll('[data-flash-deal-carousel]').forEach(bind);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target?.matches?.('[data-flash-deal-carousel]')
      ? event.target
      : event.target?.querySelector?.('[data-flash-deal-carousel]');
    if (section) bind(section);
  });
})();
