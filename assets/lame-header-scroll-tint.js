(() => {
  const header = document.getElementById('header-component');
  if (!header?.classList.contains('header--cosmetic-luxury')) return;

  const threshold = 40;

  const update = () => {
    header.dataset.lameScroll = window.scrollY > threshold ? 'away' : 'top';
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
})();
