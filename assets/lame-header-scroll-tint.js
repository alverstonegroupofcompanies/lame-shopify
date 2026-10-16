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
    } else {
      header.dataset.lameScroll = 'away';
      if (currentScrollY > lastScrollY + 5) {
        header.dataset.scrollDirection = 'down';
        header.dataset.lameScrollDir = 'down';
      } else if (currentScrollY < lastScrollY - 5) {
        header.dataset.scrollDirection = 'up';
        header.dataset.lameScrollDir = 'up';
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

