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
        const panel = document.querySelector('[data-lame-category-panel]');
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

      const row = root.closest('.header__row--bottom') || root.closest('.header__row');
      if (row) row.insertAdjacentElement('afterend', panel);

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
        if (
          event.target instanceof Element &&
          event.target.closest('[data-lame-category-dropdown], [data-lame-category-panel]')
        ) {
          return;
        }
        document.querySelectorAll('[data-lame-category-dropdown].is-open').forEach((root) => {
          const trigger = root.querySelector('[data-lame-category-trigger]');
          const panel = document.querySelector('[data-lame-category-panel]');
          if (!trigger || !panel) return;
          trigger.setAttribute('aria-expanded', 'false');
          panel.hidden = true;
          root.classList.remove('is-open');
        });
      });

      document.addEventListener('keydown', (event) => {
        const openDropdown = document.querySelector('[data-lame-category-dropdown].is-open');
        if (!openDropdown) return;
        const trigger = openDropdown.querySelector('[data-lame-category-trigger]');
        const panel = document.querySelector('[data-lame-category-panel]:not([hidden])');
        if (!trigger || !panel) return;

        if (event.key === 'Escape') {
          trigger.setAttribute('aria-expanded', 'false');
          panel.hidden = true;
          openDropdown.classList.remove('is-open');
          trigger.focus();
          return;
        }

        const links = Array.from(panel.querySelectorAll('a'));
        if (!links.length) return;
        const activeIndex = links.indexOf(document.activeElement);

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const nextIndex = activeIndex < links.length - 1 ? activeIndex + 1 : 0;
          links[nextIndex].focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prevIndex = activeIndex > 0 ? activeIndex - 1 : links.length - 1;
          links[prevIndex].focus();
        } else if (event.key === 'Home') {
          event.preventDefault();
          links[0].focus();
        } else if (event.key === 'End') {
          event.preventDefault();
          links[links.length - 1].focus();
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindRoots);
  } else {
    bindRoots();
  }
})();
