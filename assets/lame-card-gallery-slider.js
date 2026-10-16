/**
 * Lamé Product Card Auto-Gallery Slider
 * Automatically transitions product card images every 5 seconds
 */
(() => {
  if (window.LameCardGallerySliderInit) return;
  window.LameCardGallerySliderInit = true;

  const DEFAULT_INTERVAL = 5000; // 5 seconds
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const initGallery = (gallery, index) => {
    if (!gallery || gallery.dataset.galleryReady === '1') return;
    gallery.dataset.galleryReady = '1';

    const track = gallery.querySelector('.lame-flash-card__gallery-track');
    const slides = track ? Array.from(track.querySelectorAll('.lame-flash-card__gallery-img')) : [];
    const dots = Array.from(gallery.querySelectorAll('.lame-flash-card__gallery-dot'));

    if (!track || slides.length <= 1) return;

    let currentIndex = 0;
    let timer = null;
    let isVisible = false;
    let isHovered = false;
    const total = slides.length;
    const interval = parseInt(gallery.dataset.interval, 10) || DEFAULT_INTERVAL;

    const updateSlide = (newIndex) => {
      currentIndex = (newIndex + total) % total;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      if (dots.length > 0) {
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === currentIndex);
        });
      }
    };

    const startTimer = (delay = interval) => {
      stopTimer();
      if (prefersReducedMotion.matches || !isVisible || isHovered || document.visibilityState === 'hidden') return;
      timer = setTimeout(() => {
        updateSlide(currentIndex + 1);
        startTimer(interval);
      }, delay);
    };

    const stopTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    // Pause on hover so shopper can view details
    const card = gallery.closest('.lame-flash-card') || gallery;
    card.addEventListener('mouseenter', () => {
      isHovered = true;
      stopTimer();
    });
    card.addEventListener('mouseleave', () => {
      isHovered = false;
      startTimer(interval);
    });

    // Tap/Click dots to switch (if dots present)
    if (dots.length > 0) {
      dots.forEach((dot, i) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          updateSlide(i);
          startTimer(interval);
        });
      });
    }

    // Touch swipe support on phones
    let touchStartX = 0;
    let touchStartY = 0;
    gallery.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    gallery.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault();
        if (diffX < 0) {
          updateSlide(currentIndex + 1);
        } else {
          updateSlide(currentIndex - 1);
        }
        startTimer(interval);
      }
    });

    // Viewport IntersectionObserver: Only runs timer when card is in view
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            // Elegant stagger based on position so cards don't all flip at the exact same millisecond
            const stagger = (index % 4) * 450;
            startTimer(interval + stagger);
          } else {
            stopTimer();
          }
        });
      }, { threshold: 0.12 });
      observer.observe(card);
    } else {
      isVisible = true;
      startTimer(interval + (index % 4) * 450);
    }
  };

  const scanAndInit = () => {
    document.querySelectorAll('[data-lame-card-gallery]').forEach((el, idx) => {
      initGallery(el, idx);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndInit);
  } else {
    scanAndInit();
  }

  // Handle tab visibility
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scanAndInit();
    }
  });

  // Support dynamic loads
  document.addEventListener('shopify:section:load', scanAndInit);
  window.addEventListener('lame:products:updated', scanAndInit);
})();
