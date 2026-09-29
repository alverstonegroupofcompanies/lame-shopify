(() => {
  if (window.__lameCategoryDropdownBound) return;
  window.__lameCategoryDropdownBound = true;

  const bindRoots = () => {
    const roots = document.querySelectorAll('[data-lame-category-dropdown]:not([data-lame-category-bound])');
    if (!roots.length) return;

    const closeAll = (except) => {
      document.querySelectorAll('[data-lame-category-dropdown]').forEach((root) => {
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
      root.setAttribute('data-lame-category-bound', '');
      const trigger = root.querySelector('[data-lame-category-trigger]');
      const panel = root.querySelector('[data-lame-category-panel]');
      if (!trigger || !panel) return;

      const open = () => {
        closeAll(root);
        trigger.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        root.classList.add('is-open');
      };

      const close = () => {
        trigger.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
        root.classList.remove('is-open');
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

      panel.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', close);
      });
    });

    if (!window.__lameCategoryDropdownDocBound) {
      window.__lameCategoryDropdownDocBound = true;

      document.addEventListener('click', (event) => {
        if (event.target instanceof Element && event.target.closest('[data-lame-category-dropdown]')) {
          return;
        }
        document.querySelectorAll('[data-lame-category-dropdown].is-open').forEach((root) => {
          const trigger = root.querySelector('[data-lame-category-trigger]');
          const panel = root.querySelector('[data-lame-category-panel]');
          if (!trigger || !panel) return;
          trigger.setAttribute('aria-expanded', 'false');
          panel.hidden = true;
          root.classList.remove('is-open');
        });
      });

      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('[data-lame-category-dropdown].is-open').forEach((root) => {
          const trigger = root.querySelector('[data-lame-category-trigger]');
          const panel = root.querySelector('[data-lame-category-panel]');
          if (!trigger || !panel) return;
          trigger.setAttribute('aria-expanded', 'false');
          panel.hidden = true;
          root.classList.remove('is-open');
        });
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindRoots);
  } else {
    bindRoots();
  }
})();
