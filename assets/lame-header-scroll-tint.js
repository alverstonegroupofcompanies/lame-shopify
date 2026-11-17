(() => {
  const header = document.getElementById('header-component');
  if (!header?.classList.contains('header--cosmetic-luxury')) return;

  const threshold = 15;
  let lastScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
  let ticking = false;

  const update = () => {
    const currentScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);

    if (currentScrollY <= threshold) {
      header.dataset.lameScroll = 'top';
      header.dataset.scrollDirection = 'top';
      header.dataset.lameScrollDir = 'top';
      header.classList.remove('is-scrolled');
      header.classList.add('is-at-top');
    } else {
      header.dataset.lameScroll = 'away';
      header.classList.add('is-scrolled');
      header.classList.remove('is-at-top');
      if (currentScrollY > lastScrollY + 5) {
        header.dataset.scrollDirection = 'down';
        header.dataset.lameScrollDir = 'down';
      } else if (currentScrollY < lastScrollY - 5) {
        header.dataset.scrollDirection = 'up';
        header.dataset.lameScrollDir = 'up';
      }
    }

    const subnav = document.querySelector('[data-lame-mobile-subnav]');
    if (subnav) {
      if (currentScrollY > threshold) {
        subnav.classList.add('is-scrolled');
      } else {
        subnav.classList.remove('is-scrolled');
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();

