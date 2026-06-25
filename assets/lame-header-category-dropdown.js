(() => {
  const roots = document.querySelectorAll('[data-lame-category-dropdown]');
  if (!roots.length) return;

  const closeAll = (except) => {
    roots.forEach((root) => {
      if (root === except) return;
      const trigger = root.querySelector('[data-lame-category-trigger]');
      const panel = root.querySelector('[data-lame-category-panel]');
      if (!trigger || !panel) return;
      trigger.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      root.classList.remove('is-open');
    });
  };

  roots.forEach((root) => {
    const trigger = root.querySelector('[data-lame-category-trigger]');
    const panel = root.querySelector('[data-lame-category-panel]');
    if (!trigger || !panel) return;

    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let closeTimer;

    const clearCloseTimer = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = undefined;
      }
    };

    const isInside = (node) => {
      if (!(node instanceof Node)) return false;
      return trigger.contains(node) || panel.contains(node);
    };

    const open = () => {
      clearCloseTimer();
      closeAll(root);
      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      root.classList.add('is-open');
    };

    const close = () => {
      clearCloseTimer();
      trigger.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      root.classList.remove('is-open');
    };

    const scheduleClose = () => {
      clearCloseTimer();
      closeTimer = setTimeout(close, 180);
    };

    const handlePointerLeave = (event) => {
      if (isInside(event.relatedTarget)) return;
      scheduleClose();
    };

    const toggle = () => {
      if (root.classList.contains('is-open')) {
        close();
      } else {
        open();
      }
    };

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    });

    if (window.matchMedia('(hover: hover)').matches) {
      trigger.addEventListener('pointerenter', open);
      panel.addEventListener('pointerenter', open);
      trigger.addEventListener('pointerleave', handlePointerLeave);
      panel.addEventListener('pointerleave', handlePointerLeave);
    }

    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', close);
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-lame-category-dropdown]')) return;
    closeAll();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
})();
