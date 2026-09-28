(() => {
  const STEP_MS = 3400;
  const HOLD = 0.38;
  const controllers = window.__lameVentureControllers || new WeakMap();
  window.__lameVentureControllers = controllers;
  let pageVisible = document.visibilityState !== 'hidden';

  const wrap = (value, total) => {
    let pos = ((value % total) + total) % total;
    if (pos > total / 2) pos -= total;
    return pos;
  };

  const smoothstep = (t) => {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  };

  const setup = (root) => {
    if (controllers.has(root)) return;

    const slides = [...root.querySelectorAll('[data-venture-slide]')];
    const total = slides.length;
    if (total === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = {
      paused: false,
      visible: true,
      raf: 0,
      startTime: 0,
      elapsed: 0,
      lastNow: 0,
    };

    const layout = (offset) => {
      const width = root.clientWidth || 1;
      const mobile = width < 750;
      const shift = width * (mobile ? 0.36 : 0.4);
      const centerScale = mobile ? 1.08 : 1.18;
      const sideScale = mobile ? 0.52 : 0.58;

      slides.forEach((slide, index) => {
        const pos = total === 1 ? 0 : wrap(index - offset, total);
        const abs = Math.abs(pos);
        const emphasis = Math.pow(Math.max(0, 1 - Math.min(abs, 1)), 1.65);
        const scale = sideScale + (centerScale - sideScale) * emphasis;
        let opacity = 1;
        if (abs > 1) opacity = Math.max(0, 1 - (abs - 1) / 0.42);

        slide.style.transform = `translate3d(calc(-50% + ${pos * shift}px), -50%, 0) scale(${scale})`;
        slide.style.opacity = opacity.toFixed(3);
        slide.style.zIndex = String(20 - Math.round(abs * 8));
        slide.style.pointerEvents = abs < 0.65 ? 'auto' : 'none';
      });
    };

    const tick = (now) => {
      state.raf = window.requestAnimationFrame(tick);
      if (!state.lastNow) state.lastNow = now;
      const dt = Math.min(48, now - state.lastNow);
      state.lastNow = now;
      if (!state.paused && state.visible && pageVisible) state.elapsed += dt;

      const steps = state.elapsed / STEP_MS;
      const whole = Math.floor(steps);
      const phase = steps - whole;
      const glide = phase <= HOLD ? 0 : smoothstep((phase - HOLD) / (1 - HOLD));
      layout(whole + glide);
    };

    const stop = () => {
      if (state.raf) window.cancelAnimationFrame(state.raf);
      state.raf = 0;
      state.lastNow = 0;
    };

    const start = () => {
      if (reducedMotion || total < 2) {
        layout(0);
        return;
      }
      if (state.raf || state.paused || !state.visible || !pageVisible) return;
      state.lastNow = 0;
      state.raf = window.requestAnimationFrame(tick);
    };

    layout(0);

    root.addEventListener('mouseenter', () => {
      state.paused = true;
    });
    root.addEventListener('mouseleave', () => {
      state.paused = false;
      start();
    });
    root.addEventListener('focusin', () => {
      state.paused = true;
    });
    root.addEventListener('focusout', () => {
      state.paused = false;
      start();
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target !== root) return;
            state.visible = entry.isIntersecting;
            if (state.visible) start();
            else stop();
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(root);
      state.observer = observer;
    } else {
      start();
    }

    root.addEventListener('lame:venture-resume', start);
    controllers.set(root, { state, stop });
  };

  if (!window.__lameVenturePageBound) {
    window.__lameVenturePageBound = true;
    document.addEventListener('visibilitychange', () => {
      pageVisible = document.visibilityState !== 'hidden';
      document.querySelectorAll('[data-venture-carousel]').forEach((carousel) => {
        if (pageVisible) carousel.dispatchEvent(new Event('lame:venture-resume'));
      });
    });
  }

  const init = (scope) => {
    const context = scope && scope.querySelectorAll ? scope : document;
    context.querySelectorAll('[data-venture-carousel]').forEach(setup);
  };

  const destroy = (scope) => {
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll('[data-venture-carousel]').forEach((root) => {
      const record = controllers.get(root);
      if (!record) return;
      record.stop();
      if (record.state.observer) record.state.observer.disconnect();
      controllers.delete(root);
    });
  };

  if (!window.__lameVentureCarouselBound) {
    window.__lameVentureCarouselBound = true;
    document.addEventListener('shopify:section:load', (event) => init(event.target));
    document.addEventListener('shopify:section:unload', (event) => destroy(event.target));
  }

  window.LameVentureCarousel = { init, destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
  }
  init(document);
})();
