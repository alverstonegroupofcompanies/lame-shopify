/**
 * Our Products mini-banner carousel
 */
class LameOpMiniBanner extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-lame-op-banner-track]');
    this.slides = Array.from(this.querySelectorAll('[data-lame-op-banner-slide]'));
    this.dots = Array.from(this.querySelectorAll('[data-lame-op-banner-dot]'));
    this.prevBtn = this.querySelector('[data-lame-op-banner-prev]');
    this.nextBtn = this.querySelector('[data-lame-op-banner-next]');
    this.index = Math.max(
      0,
      this.slides.findIndex((slide) => slide.classList.contains('is-active'))
    );
    this.timer = null;
    this.autoplayMs = Number(this.dataset.autoplay || 0);

    if (this.slides.length < 2) return;

    this.prevBtn?.addEventListener('click', () => this.goTo(this.index - 1, true));
    this.nextBtn?.addEventListener('click', () => this.goTo(this.index + 1, true));
    this.dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const next = Number(dot.dataset.index || 0);
        this.goTo(next, true);
      });
    });

    this.addEventListener('mouseenter', () => this.stop());
    this.addEventListener('mouseleave', () => this.start());
    this.addEventListener('focusin', () => this.stop());
    this.addEventListener('focusout', () => {
      if (!this.contains(document.activeElement)) this.start();
    });

    let touchX = 0;
    this.addEventListener(
      'touchstart',
      (event) => {
        touchX = event.changedTouches?.[0]?.clientX || 0;
        this.stop();
      },
      { passive: true }
    );
    this.addEventListener(
      'touchend',
      (event) => {
        const endX = event.changedTouches?.[0]?.clientX || 0;
        const delta = endX - touchX;
        if (Math.abs(delta) > 40) {
          this.goTo(delta < 0 ? this.index + 1 : this.index - 1, true);
        }
        this.start();
      },
      { passive: true }
    );

    document.addEventListener('visibilitychange', this.onVisibility);
    this.goTo(this.index, false);
    this.start();
  }

  disconnectedCallback() {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  onVisibility = () => {
    if (document.hidden) this.stop();
    else this.start();
  };

  start() {
    this.stop();
    if (this.autoplayMs <= 0 || this.slides.length < 2) return;
    this.timer = window.setInterval(() => this.goTo(this.index + 1, false), this.autoplayMs);
  }

  stop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  goTo(nextIndex, userDriven = false) {
    if (!this.slides.length) return;
    const total = this.slides.length;
    this.index = ((nextIndex % total) + total) % total;

    this.slides.forEach((slide, i) => {
      const active = i === this.index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    this.dots.forEach((dot, i) => {
      const active = i === this.index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (userDriven) this.start();
  }
}

if (!customElements.get('lame-op-mini-banner')) {
  customElements.define('lame-op-mini-banner', LameOpMiniBanner);
}
