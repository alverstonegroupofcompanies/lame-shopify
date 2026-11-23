const fs = require('fs');

const liquidCode = `{% doc %}
  @prompt
    Olive Young Luxury K-Beauty Peek Carousel Banner - Image Banners Only
{% enddoc %}
{% assign ai_gen_id = block.id | replace: '_', '' | downcase %}

{%- liquid
  assign valid_slides_count = 0

  assign img_1 = block.settings.banner_image
  assign link_1 = block.settings.banner_link
  if link_1 == blank
    assign link_1 = '/collections/all'
  endif
  if img_1 != blank
    assign valid_slides_count = valid_slides_count | plus: 1
  endif

  assign img_2 = block.settings.second_banner_image
  assign link_2 = block.settings.second_banner_link
  if link_2 == blank
    assign link_2 = '/collections/all'
  endif
  if img_2 != blank
    assign valid_slides_count = valid_slides_count | plus: 1
  endif

  assign img_3 = block.settings.third_banner_image
  assign link_3 = block.settings.third_banner_link
  if link_3 == blank or link_3 == '/products/elite-pro-6-months'
    assign link_3 = '/pages/elite-pro'
  endif
  if img_3 != blank and block.settings.enable_third_banner != false
    assign valid_slides_count = valid_slides_count | plus: 1
  else
    assign img_3 = blank
  endif

  assign img_4 = block.settings.fourth_banner_image
  assign link_4 = block.settings.fourth_banner_link
  if link_4 == blank
    assign link_4 = '/collections/all'
  endif
  if img_4 != blank and block.settings.enable_fourth_banner != false
    assign valid_slides_count = valid_slides_count | plus: 1
  else
    assign img_4 = blank
  endif

  assign img_5 = block.settings.fifth_banner_image
  assign link_5 = block.settings.fifth_banner_link
  if link_5 == blank
    assign link_5 = '/collections/all'
  endif
  if img_5 != blank and block.settings.enable_fifth_banner != false
    assign valid_slides_count = valid_slides_count | plus: 1
  else
    assign img_5 = blank
  endif

  assign img_6 = block.settings.sixth_banner_image
  assign link_6 = block.settings.sixth_banner_link
  if link_6 == blank
    assign link_6 = '/collections/all'
  endif
  if img_6 != blank and block.settings.enable_sixth_banner != false
    assign valid_slides_count = valid_slides_count | plus: 1
  else
    assign img_6 = blank
  endif

  assign slide_interval_s = block.settings.slide_duration | default: 5
  assign banner_h_desktop = block.settings.banner_height | default: 380
  assign banner_h_mobile = block.settings.mobile_banner_height | default: 220
  assign slide_width_pct = block.settings.desktop_width_percent | default: 72
  assign card_radius = block.settings.border_radius | default: 18
  assign img_fit = block.settings.image_fit | default: 'cover'
-%}

<div class="ai-gif-banner-{{ ai_gen_id }} lame-oy-banner-section" style="--oy-banner-height-desktop: {{ banner_h_desktop }}px; --oy-banner-height-mobile: {{ banner_h_mobile }}px; --oy-slide-width-desktop: {{ slide_width_pct }}%; --oy-card-radius: {{ card_radius }}px; --oy-image-fit: {{ img_fit }};">
  {%- if valid_slides_count > 0 -%}
    <div class="lame-oy-carousel" id="LameOYCarousel-{{ ai_gen_id }}" data-autoplay="{{ slide_interval_s }}" data-slides-count="{{ valid_slides_count }}" role="region" aria-roledescription="carousel" aria-label="Featured Offers">
      <div class="lame-oy-viewport" data-oy-viewport>
        <div class="lame-oy-track" data-oy-track>
          {%- assign cur_idx = 0 -%}

          {%- if img_1 != blank -%}
            <div class="lame-oy-slide" data-oy-slide data-index="{{ cur_idx }}" role="group" aria-roledescription="slide" aria-label="{{ cur_idx | plus: 1 }} of {{ valid_slides_count }}">
              <div class="lame-oy-card">
                <a href="{{ link_1 }}" class="lame-oy-card__link" aria-label="{{ img_1.alt | default: 'Featured Banner' | escape }}">
                  <div class="lame-oy-card__graphic-fill">
                    <img
                      src="{{ img_1 | image_url: width: 2400 }}"
                      alt="{{ img_1.alt | default: 'Featured Banner' | escape }}"
                      class="lame-oy-card__graphic-img"
                      loading="eager"
                      decoding="async"
                      width="{{ img_1.width | default: 2400 }}"
                      height="{{ img_1.height | default: 800 }}"
                    >
                    {%- if block.settings.show_overlay -%}
                      <div class="lame-oy-card__overlay" style="background-color: {{ block.settings.overlay_color | default: '#000000' }}; opacity: {{ block.settings.overlay_opacity | default: 30 | divided_by: 100.0 }};" aria-hidden="true"></div>
                    {%- endif -%}
                    {%- if block.settings.show_content and block.settings.heading != blank or block.settings.subheading != blank -%}
                      <div class="lame-oy-card__content-layer">
                        {%- if block.settings.heading != blank -%}
                          <h2 class="lame-oy-card__heading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.heading_size | default: 48 }}px;">{{ block.settings.heading | escape }}</h2>
                        {%- endif -%}
                        {%- if block.settings.subheading != blank -%}
                          <p class="lame-oy-card__subheading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.subheading_size | default: 18 }}px;">{{ block.settings.subheading | escape }}</p>
                        {%- endif -%}
                      </div>
                    {%- endif -%}
                  </div>
                </a>
              </div>
            </div>
            {%- assign cur_idx = cur_idx | plus: 1 -%}
          {%- endif -%}

          {%- if img_2 != blank -%}
            <div class="lame-oy-slide" data-oy-slide data-index="{{ cur_idx }}" role="group" aria-roledescription="slide" aria-label="{{ cur_idx | plus: 1 }} of {{ valid_slides_count }}">
              <div class="lame-oy-card">
                <a href="{{ link_2 }}" class="lame-oy-card__link" aria-label="{{ img_2.alt | default: 'Featured Banner' | escape }}">
                  <div class="lame-oy-card__graphic-fill">
                    <img
                      src="{{ img_2 | image_url: width: 2400 }}"
                      alt="{{ img_2.alt | default: 'Featured Banner' | escape }}"
                      class="lame-oy-card__graphic-img"
                      loading="lazy"
                      decoding="async"
                      width="{{ img_2.width | default: 2400 }}"
                      height="{{ img_2.height | default: 800 }}"
                    >
                    {%- if block.settings.show_overlay -%}
                      <div class="lame-oy-card__overlay" style="background-color: {{ block.settings.overlay_color | default: '#000000' }}; opacity: {{ block.settings.overlay_opacity | default: 30 | divided_by: 100.0 }};" aria-hidden="true"></div>
                    {%- endif -%}
                    {%- if block.settings.show_content and block.settings.heading != blank or block.settings.subheading != blank -%}
                      <div class="lame-oy-card__content-layer">
                        {%- if block.settings.heading != blank -%}
                          <h2 class="lame-oy-card__heading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.heading_size | default: 48 }}px;">{{ block.settings.heading | escape }}</h2>
                        {%- endif -%}
                        {%- if block.settings.subheading != blank -%}
                          <p class="lame-oy-card__subheading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.subheading_size | default: 18 }}px;">{{ block.settings.subheading | escape }}</p>
                        {%- endif -%}
                      </div>
                    {%- endif -%}
                  </div>
                </a>
              </div>
            </div>
            {%- assign cur_idx = cur_idx | plus: 1 -%}
          {%- endif -%}

          {%- if img_3 != blank -%}
            <div class="lame-oy-slide" data-oy-slide data-index="{{ cur_idx }}" role="group" aria-roledescription="slide" aria-label="{{ cur_idx | plus: 1 }} of {{ valid_slides_count }}">
              <div class="lame-oy-card">
                <a href="{{ link_3 }}" class="lame-oy-card__link" aria-label="{{ img_3.alt | default: 'Featured Banner' | escape }}">
                  <div class="lame-oy-card__graphic-fill">
                    <img
                      src="{{ img_3 | image_url: width: 2400 }}"
                      alt="{{ img_3.alt | default: 'Featured Banner' | escape }}"
                      class="lame-oy-card__graphic-img"
                      loading="lazy"
                      decoding="async"
                      width="{{ img_3.width | default: 2400 }}"
                      height="{{ img_3.height | default: 800 }}"
                    >
                    {%- if block.settings.show_overlay -%}
                      <div class="lame-oy-card__overlay" style="background-color: {{ block.settings.overlay_color | default: '#000000' }}; opacity: {{ block.settings.overlay_opacity | default: 30 | divided_by: 100.0 }};" aria-hidden="true"></div>
                    {%- endif -%}
                    {%- if block.settings.show_content and block.settings.heading != blank or block.settings.subheading != blank -%}
                      <div class="lame-oy-card__content-layer">
                        {%- if block.settings.heading != blank -%}
                          <h2 class="lame-oy-card__heading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.heading_size | default: 48 }}px;">{{ block.settings.heading | escape }}</h2>
                        {%- endif -%}
                        {%- if block.settings.subheading != blank -%}
                          <p class="lame-oy-card__subheading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.subheading_size | default: 18 }}px;">{{ block.settings.subheading | escape }}</p>
                        {%- endif -%}
                      </div>
                    {%- endif -%}
                  </div>
                </a>
              </div>
            </div>
            {%- assign cur_idx = cur_idx | plus: 1 -%}
          {%- endif -%}

          {%- if img_4 != blank -%}
            <div class="lame-oy-slide" data-oy-slide data-index="{{ cur_idx }}" role="group" aria-roledescription="slide" aria-label="{{ cur_idx | plus: 1 }} of {{ valid_slides_count }}">
              <div class="lame-oy-card">
                <a href="{{ link_4 }}" class="lame-oy-card__link" aria-label="{{ img_4.alt | default: 'Featured Banner' | escape }}">
                  <div class="lame-oy-card__graphic-fill">
                    <img
                      src="{{ img_4 | image_url: width: 2400 }}"
                      alt="{{ img_4.alt | default: 'Featured Banner' | escape }}"
                      class="lame-oy-card__graphic-img"
                      loading="lazy"
                      decoding="async"
                      width="{{ img_4.width | default: 2400 }}"
                      height="{{ img_4.height | default: 800 }}"
                    >
                    {%- if block.settings.show_overlay -%}
                      <div class="lame-oy-card__overlay" style="background-color: {{ block.settings.overlay_color | default: '#000000' }}; opacity: {{ block.settings.overlay_opacity | default: 30 | divided_by: 100.0 }};" aria-hidden="true"></div>
                    {%- endif -%}
                    {%- if block.settings.show_content and block.settings.heading != blank or block.settings.subheading != blank -%}
                      <div class="lame-oy-card__content-layer">
                        {%- if block.settings.heading != blank -%}
                          <h2 class="lame-oy-card__heading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.heading_size | default: 48 }}px;">{{ block.settings.heading | escape }}</h2>
                        {%- endif -%}
                        {%- if block.settings.subheading != blank -%}
                          <p class="lame-oy-card__subheading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.subheading_size | default: 18 }}px;">{{ block.settings.subheading | escape }}</p>
                        {%- endif -%}
                      </div>
                    {%- endif -%}
                  </div>
                </a>
              </div>
            </div>
            {%- assign cur_idx = cur_idx | plus: 1 -%}
          {%- endif -%}

          {%- if img_5 != blank -%}
            <div class="lame-oy-slide" data-oy-slide data-index="{{ cur_idx }}" role="group" aria-roledescription="slide" aria-label="{{ cur_idx | plus: 1 }} of {{ valid_slides_count }}">
              <div class="lame-oy-card">
                <a href="{{ link_5 }}" class="lame-oy-card__link" aria-label="{{ img_5.alt | default: 'Featured Banner' | escape }}">
                  <div class="lame-oy-card__graphic-fill">
                    <img
                      src="{{ img_5 | image_url: width: 2400 }}"
                      alt="{{ img_5.alt | default: 'Featured Banner' | escape }}"
                      class="lame-oy-card__graphic-img"
                      loading="lazy"
                      decoding="async"
                      width="{{ img_5.width | default: 2400 }}"
                      height="{{ img_5.height | default: 800 }}"
                    >
                    {%- if block.settings.show_overlay -%}
                      <div class="lame-oy-card__overlay" style="background-color: {{ block.settings.overlay_color | default: '#000000' }}; opacity: {{ block.settings.overlay_opacity | default: 30 | divided_by: 100.0 }};" aria-hidden="true"></div>
                    {%- endif -%}
                    {%- if block.settings.show_content and block.settings.heading != blank or block.settings.subheading != blank -%}
                      <div class="lame-oy-card__content-layer">
                        {%- if block.settings.heading != blank -%}
                          <h2 class="lame-oy-card__heading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.heading_size | default: 48 }}px;">{{ block.settings.heading | escape }}</h2>
                        {%- endif -%}
                        {%- if block.settings.subheading != blank -%}
                          <p class="lame-oy-card__subheading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.subheading_size | default: 18 }}px;">{{ block.settings.subheading | escape }}</p>
                        {%- endif -%}
                      </div>
                    {%- endif -%}
                  </div>
                </a>
              </div>
            </div>
            {%- assign cur_idx = cur_idx | plus: 1 -%}
          {%- endif -%}

          {%- if img_6 != blank -%}
            <div class="lame-oy-slide" data-oy-slide data-index="{{ cur_idx }}" role="group" aria-roledescription="slide" aria-label="{{ cur_idx | plus: 1 }} of {{ valid_slides_count }}">
              <div class="lame-oy-card">
                <a href="{{ link_6 }}" class="lame-oy-card__link" aria-label="{{ img_6.alt | default: 'Featured Banner' | escape }}">
                  <div class="lame-oy-card__graphic-fill">
                    <img
                      src="{{ img_6 | image_url: width: 2400 }}"
                      alt="{{ img_6.alt | default: 'Featured Banner' | escape }}"
                      class="lame-oy-card__graphic-img"
                      loading="lazy"
                      decoding="async"
                      width="{{ img_6.width | default: 2400 }}"
                      height="{{ img_6.height | default: 800 }}"
                    >
                    {%- if block.settings.show_overlay -%}
                      <div class="lame-oy-card__overlay" style="background-color: {{ block.settings.overlay_color | default: '#000000' }}; opacity: {{ block.settings.overlay_opacity | default: 30 | divided_by: 100.0 }};" aria-hidden="true"></div>
                    {%- endif -%}
                    {%- if block.settings.show_content and block.settings.heading != blank or block.settings.subheading != blank -%}
                      <div class="lame-oy-card__content-layer">
                        {%- if block.settings.heading != blank -%}
                          <h2 class="lame-oy-card__heading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.heading_size | default: 48 }}px;">{{ block.settings.heading | escape }}</h2>
                        {%- endif -%}
                        {%- if block.settings.subheading != blank -%}
                          <p class="lame-oy-card__subheading" style="color: {{ block.settings.text_color | default: '#ffffff' }}; font-size: {{ block.settings.subheading_size | default: 18 }}px;">{{ block.settings.subheading | escape }}</p>
                        {%- endif -%}
                      </div>
                    {%- endif -%}
                  </div>
                </a>
              </div>
            </div>
            {%- assign cur_idx = cur_idx | plus: 1 -%}
          {%- endif -%}
        </div>
      </div>

      {%- if valid_slides_count > 1 -%}
        <!-- Navigation Arrows -->
        <button type="button" class="lame-oy-nav lame-oy-nav--prev" data-oy-nav="prev" aria-label="Previous slide">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button type="button" class="lame-oy-nav lame-oy-nav--next" data-oy-nav="next" aria-label="Next slide">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <!-- Bottom Controls (Pill Dots + Olive Young Numbered Counter) -->
        <div class="lame-oy-controls">
          <div class="lame-oy-dots" role="tablist" aria-label="Carousel pagination">
            {%- for i in (1..valid_slides_count) -%}
              {%- assign dot_idx = i | minus: 1 -%}
              <button type="button" class="lame-oy-dot{% if dot_idx == 0 %} is-active{% endif %}" data-oy-dot="{{ dot_idx }}" aria-label="Go to slide {{ i }}"></button>
            {%- endfor -%}
          </div>

          <div class="lame-oy-counter" aria-live="polite">
            <span class="lame-oy-counter__current" data-oy-current>01</span>
            <span class="lame-oy-counter__sep">/</span>
            <span class="lame-oy-counter__total" data-oy-total>{%- if valid_slides_count < 10 -%}0{%- endif -%}{{ valid_slides_count }}</span>
            <button type="button" class="lame-oy-counter__toggle" data-oy-pause aria-label="Pause slideshow">
              <svg class="lame-oy-icon-pause" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              <svg class="lame-oy-icon-play" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="display:none;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
          </div>
        </div>
      {%- endif -%}
    </div>
  {%- else -%}
    {%- if request.design_mode -%}
      <div class="lame-oy-empty-notice" style="padding: 40px 20px; text-align: center; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; margin: 20px auto; max-width: 800px;">
        <p style="margin: 0; color: #64748b; font-size: 15px;">Please add at least one banner image in block settings to display the Olive Young carousel banner.</p>
      </div>
    {%- endif -%}
  {%- endif -%}
</div>

<style>
  body.template-index .shopify-section:has(.lame-oy-banner-section),
  .shopify-section:has(.lame-oy-banner-section) {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: clip !important;
  }

  .lame-oy-banner-section {
    position: relative;
    width: calc(100% + 2 * var(--lame-homepage-side-margin, 16px)) !important;
    max-width: none !important;
    margin-inline: calc(var(--lame-homepage-side-margin, 16px) * -1) !important;
    margin-top: 0 !important;
    margin-bottom: clamp(1rem, 2vw, 1.75rem) !important;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    box-sizing: border-box;
  }

  .lame-oy-carousel {
    position: relative;
    width: 100%;
    overflow: hidden;
    touch-action: pan-y pinch-zoom;
  }

  .lame-oy-viewport {
    position: relative;
    width: 100%;
    overflow: hidden;
    padding: 6px 0 12px;
  }

  .lame-oy-track {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    will-change: transform;
    transition: transform 0.48s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .lame-oy-slide {
    flex: 0 0 var(--oy-slide-width-desktop, 72%);
    width: var(--oy-slide-width-desktop, 72%);
    max-width: var(--oy-slide-width-desktop, 72%);
    box-sizing: border-box;
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease;
    opacity: 0.88;
    transform: scale(0.985);
  }

  .lame-oy-slide.is-active {
    opacity: 1;
    transform: scale(1);
  }

  @media (max-width: 749px) {
    .lame-oy-track {
      gap: 10px;
    }
    .lame-oy-slide {
      flex: 0 0 88%;
      width: 88%;
      max-width: 88%;
      opacity: 0.92;
      transform: scale(0.99);
    }
    .lame-oy-slide.is-active {
      opacity: 1;
      transform: scale(1);
    }
  }

  .lame-oy-card {
    position: relative;
    width: 100%;
    height: var(--oy-banner-height-desktop, 380px);
    border-radius: var(--oy-card-radius, 18px);
    overflow: hidden;
    background-color: #f8fafc;
    box-shadow: 0 6px 20px -4px rgba(15, 23, 42, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.06);
  }

  @media (max-width: 749px) {
    .lame-oy-card {
      height: var(--oy-banner-height-mobile, 220px);
      border-radius: clamp(10px, 3vw, 14px);
    }
  }

  .lame-oy-card__link {
    display: block;
    width: 100%;
    height: 100%;
    text-decoration: none;
    color: inherit;
  }

  .lame-oy-card__graphic-fill {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .lame-oy-card__graphic-img {
    width: 100%;
    height: 100%;
    object-fit: var(--oy-image-fit, cover);
    object-position: center;
    display: block;
    transition: transform 0.45s ease;
  }

  .lame-oy-card:hover .lame-oy-card__graphic-img {
    transform: scale(1.02);
  }

  .lame-oy-card__overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }

  .lame-oy-card__content-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(20px, 4vw, 40px);
    pointer-events: none;
  }

  .lame-oy-card__heading {
    margin: 0 0 8px 0;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  .lame-oy-card__subheading {
    margin: 0;
    font-weight: 500;
    line-height: 1.35;
  }

  /* Frosted Glass Floating Navigation Arrows */
  .lame-oy-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    padding: 0;
  }

  .lame-oy-nav:hover {
    background: #ffffff;
    color: #0f172a;
    transform: translateY(-50%) scale(1.08);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  }

  .lame-oy-nav--prev {
    left: calc((100% - var(--oy-slide-width-desktop, 72%)) / 2 + 16px);
  }

  .lame-oy-nav--next {
    right: calc((100% - var(--oy-slide-width-desktop, 72%)) / 2 + 16px);
  }

  @media (max-width: 749px) {
    .lame-oy-nav {
      width: 34px;
      height: 34px;
    }
    .lame-oy-nav svg {
      width: 16px;
      height: 16px;
    }
    .lame-oy-nav--prev {
      left: 10px;
    }
    .lame-oy-nav--next {
      right: 10px;
    }
  }

  /* Bottom Controls: Pagination Dots + Olive Young Counter */
  .lame-oy-controls {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    padding: 0 20px;
  }

  .lame-oy-dots {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .lame-oy-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    border: none;
    background: #cbd5e1;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .lame-oy-dot:hover {
    background: #94a3b8;
  }

  .lame-oy-dot.is-active {
    width: 24px;
    background: #1e293b;
  }

  .lame-oy-counter {
    position: absolute;
    right: max(16px, calc((100% - var(--oy-slide-width-desktop, 72%)) / 2));
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(15, 23, 42, 0.72);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 3px 10px;
    border-radius: 999px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 749px) {
    .lame-oy-counter {
      right: 14px;
      font-size: 10px;
      padding: 3px 8px;
    }
  }

  .lame-oy-counter__sep {
    opacity: 0.5;
  }

  .lame-oy-counter__total {
    opacity: 0.8;
  }

  .lame-oy-counter__toggle {
    background: transparent;
    border: none;
    color: #ffffff;
    padding: 0 0 0 4px;
    margin-left: 2px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    opacity: 0.85;
    transition: opacity 0.2s;
  }

  .lame-oy-counter__toggle:hover {
    opacity: 1;
  }
</style>

<script>
  (function() {
    function initOliveYoungCarousel() {
      var container = document.getElementById('LameOYCarousel-{{ ai_gen_id }}');
      if (!container) return;

      var viewport = container.querySelector('[data-oy-viewport]');
      var track = container.querySelector('[data-oy-track]');
      if (!track || !viewport) return;

      var slides = Array.from(track.querySelectorAll('[data-oy-slide]'));
      var realCount = slides.length;
      if (realCount <= 1) {
        // Single slide: center statically without infinite loop
        track.style.justifyContent = 'center';
        if (slides[0]) slides[0].classList.add('is-active');
        return;
      }

      var prevBtn = container.querySelector('[data-oy-nav="prev"]');
      var nextBtn = container.querySelector('[data-oy-nav="next"]');
      var dots = Array.from(container.querySelectorAll('[data-oy-dot]'));
      var currentDisplay = container.querySelector('[data-oy-current]');
      var totalDisplay = container.querySelector('[data-oy-total]');
      var pauseBtn = container.querySelector('[data-oy-pause]');
      var pauseIcon = container.querySelector('.lame-oy-icon-pause');
      var playIcon = container.querySelector('.lame-oy-icon-play');

      if (totalDisplay) {
        totalDisplay.textContent = (realCount < 10 ? '0' : '') + realCount;
      }

      // Clone 2 items on left and right for seamless infinite peek looping
      var clonesBefore = [
        slides[realCount - 2].cloneNode(true),
        slides[realCount - 1].cloneNode(true)
      ];
      var clonesAfter = [
        slides[0].cloneNode(true),
        slides[1].cloneNode(true)
      ];

      clonesBefore.forEach(function(clone) {
        clone.classList.add('is-clone');
        clone.setAttribute('aria-hidden', 'true');
        track.insertBefore(clone, track.firstChild);
      });

      clonesAfter.forEach(function(clone) {
        clone.classList.add('is-clone');
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });

      var allSlides = Array.from(track.querySelectorAll('[data-oy-slide]'));
      var domOffset = 2;
      var currentDomIndex = domOffset;
      var isTransitioning = false;
      var autoInterval = parseInt(container.getAttribute('data-autoplay'), 10) || 5;
      var timer = null;
      var isPaused = false;

      function getRealIndex() {
        return (currentDomIndex - domOffset + realCount) % realCount;
      }

      function updatePosition(animate) {
        var viewportWidth = viewport.clientWidth;
        var slideWidth = allSlides[0].getBoundingClientRect().width;
        var gap = parseFloat(getComputedStyle(track).gap) || 16;

        var targetOffset = ((viewportWidth - slideWidth) / 2) - (currentDomIndex * (slideWidth + gap));

        if (animate === false) {
          track.style.transition = 'none';
        } else {
          track.style.transition = 'transform 0.48s cubic-bezier(0.25, 1, 0.5, 1)';
        }

        track.style.transform = 'translate3d(' + targetOffset + 'px, 0, 0)';

        // Update active class
        var realIdx = getRealIndex();
        allSlides.forEach(function(s, idx) {
          if (idx === currentDomIndex) {
            s.classList.add('is-active');
            s.setAttribute('aria-hidden', 'false');
          } else {
            s.classList.remove('is-active');
            s.setAttribute('aria-hidden', 'true');
          }
        });

        dots.forEach(function(dot, idx) {
          dot.classList.toggle('is-active', idx === realIdx);
        });

        if (currentDisplay) {
          currentDisplay.textContent = (realIdx + 1 < 10 ? '0' : '') + (realIdx + 1);
        }
      }

      function goTo(domIdx, animate) {
        if (isTransitioning && animate !== false) return;
        isTransitioning = animate !== false;
        currentDomIndex = domIdx;
        updatePosition(animate);
      }

      function next() {
        goTo(currentDomIndex + 1, true);
      }

      function prev() {
        goTo(currentDomIndex - 1, true);
      }

      track.addEventListener('transitionend', function(e) {
        if (e.target !== track) return;
        isTransitioning = false;

        // Snap silently if reached clones
        if (currentDomIndex >= realCount + domOffset) {
          currentDomIndex = domOffset;
          updatePosition(false);
        } else if (currentDomIndex < domOffset) {
          currentDomIndex = realCount + domOffset - 1;
          updatePosition(false);
        }
      });

      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          prev();
          restartAutoplay();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          next();
          restartAutoplay();
        });
      }

      dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
          var targetReal = parseInt(this.getAttribute('data-oy-dot'), 10);
          goTo(targetReal + domOffset, true);
          restartAutoplay();
        });
      });

      // Autoplay
      function startAutoplay() {
        if (isPaused || autoInterval <= 0) return;
        stopAutoplay();
        timer = setInterval(function() {
          next();
        }, autoInterval * 1000);
      }

      function stopAutoplay() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      function restartAutoplay() {
        if (!isPaused) {
          startAutoplay();
        }
      }

      container.addEventListener('mouseenter', stopAutoplay);
      container.addEventListener('mouseleave', function() {
        if (!isPaused) startAutoplay();
      });

      if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
          isPaused = !isPaused;
          if (isPaused) {
            stopAutoplay();
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (playIcon) playIcon.style.display = 'inline-block';
            pauseBtn.setAttribute('aria-label', 'Play slideshow');
          } else {
            startAutoplay();
            if (pauseIcon) pauseIcon.style.display = 'inline-block';
            if (playIcon) playIcon.style.display = 'none';
            pauseBtn.setAttribute('aria-label', 'Pause slideshow');
          }
        });
      }

      // Touch / Swipe
      var startX = 0;
      var isDragging = false;
      var diffX = 0;

      viewport.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        isDragging = true;
        diffX = 0;
        stopAutoplay();
      }, { passive: true });

      viewport.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        diffX = e.touches[0].clientX - startX;
      }, { passive: true });

      viewport.addEventListener('touchend', function() {
        if (!isDragging) return;
        isDragging = false;
        if (diffX < -40) {
          next();
        } else if (diffX > 40) {
          prev();
        }
        restartAutoplay();
      });

      // Resize
      var resizeTimer;
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
          updatePosition(false);
        }, 100);
      });

      // Initial Render
      updatePosition(false);
      startAutoplay();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initOliveYoungCarousel);
    } else {
      initOliveYoungCarousel();
    }
  })();
</script>

{% schema %}
{
  "name": "GIF banner",
  "tag": null,
  "settings": [
    {
      "type": "header",
      "content": "Image Banners"
    },
    {
      "type": "image_picker",
      "id": "banner_image",
      "label": "Banner image 1",
      "info": "Upload an image or GIF banner"
    },
    {
      "type": "url",
      "id": "banner_link",
      "label": "Banner 1 link",
      "info": "Optional link when clicking the first banner"
    },
    {
      "type": "image_picker",
      "id": "second_banner_image",
      "label": "Banner image 2",
      "info": "Optional second banner image"
    },
    {
      "type": "url",
      "id": "second_banner_link",
      "label": "Banner 2 link",
      "info": "Optional link when clicking the second banner"
    },
    {
      "type": "image_picker",
      "id": "third_banner_image",
      "label": "Banner image 3",
      "info": "Third image (e.g. Elite Pro Membership)"
    },
    {
      "type": "url",
      "id": "third_banner_link",
      "label": "Banner 3 link",
      "info": "Optional link when clicking the third banner"
    },
    {
      "type": "checkbox",
      "id": "enable_third_banner",
      "label": "Enable third banner",
      "default": true
    },
    {
      "type": "image_picker",
      "id": "fourth_banner_image",
      "label": "Banner image 4",
      "info": "Optional fourth banner image"
    },
    {
      "type": "url",
      "id": "fourth_banner_link",
      "label": "Banner 4 link",
      "info": "Optional link when clicking the fourth banner"
    },
    {
      "type": "checkbox",
      "id": "enable_fourth_banner",
      "label": "Enable fourth banner",
      "default": true
    },
    {
      "type": "image_picker",
      "id": "fifth_banner_image",
      "label": "Banner image 5",
      "info": "Optional fifth banner image"
    },
    {
      "type": "url",
      "id": "fifth_banner_link",
      "label": "Banner 5 link"
    },
    {
      "type": "checkbox",
      "id": "enable_fifth_banner",
      "label": "Enable fifth banner",
      "default": true
    },
    {
      "type": "image_picker",
      "id": "sixth_banner_image",
      "label": "Banner image 6",
      "info": "Optional sixth banner image"
    },
    {
      "type": "url",
      "id": "sixth_banner_link",
      "label": "Banner 6 link"
    },
    {
      "type": "checkbox",
      "id": "enable_sixth_banner",
      "label": "Enable sixth banner",
      "default": true
    },
    {
      "type": "header",
      "content": "Carousel Layout"
    },
    {
      "type": "range",
      "id": "slide_duration",
      "label": "Slide transition interval",
      "min": 3,
      "max": 20,
      "step": 1,
      "unit": "s",
      "default": 5
    },
    {
      "type": "select",
      "id": "image_fit",
      "label": "Image fit",
      "options": [
        {
          "value": "cover",
          "label": "Cover"
        },
        {
          "value": "contain",
          "label": "Contain"
        },
        {
          "value": "fill",
          "label": "Fill"
        }
      ],
      "default": "cover"
    },
    {
      "type": "range",
      "id": "banner_height",
      "label": "Desktop height",
      "min": 200,
      "max": 800,
      "step": 10,
      "unit": "px",
      "default": 380
    },
    {
      "type": "range",
      "id": "mobile_banner_height",
      "label": "Mobile height",
      "min": 150,
      "max": 600,
      "step": 10,
      "unit": "px",
      "default": 220
    },
    {
      "type": "range",
      "id": "desktop_width_percent",
      "label": "Desktop active slide width",
      "min": 50,
      "max": 100,
      "step": 2,
      "unit": "%",
      "default": 72,
      "info": "72% produces the Olive Young centered peek effect with side banners visible"
    },
    {
      "type": "range",
      "id": "border_radius",
      "label": "Border radius",
      "min": 0,
      "max": 40,
      "step": 2,
      "unit": "px",
      "default": 18
    },
    {
      "type": "header",
      "content": "Overlay"
    },
    {
      "type": "checkbox",
      "id": "show_overlay",
      "label": "Show overlay",
      "default": false
    },
    {
      "type": "color",
      "id": "overlay_color",
      "label": "Overlay color",
      "default": "#000000"
    },
    {
      "type": "range",
      "id": "overlay_opacity",
      "label": "Overlay opacity",
      "min": 0,
      "max": 100,
      "step": 5,
      "unit": "%",
      "default": 30
    },
    {
      "type": "header",
      "content": "Content"
    },
    {
      "type": "checkbox",
      "id": "show_content",
      "label": "Show content",
      "default": true
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading"
    },
    {
      "type": "range",
      "id": "heading_size",
      "label": "Heading size",
      "min": 20,
      "max": 80,
      "step": 2,
      "unit": "px",
      "default": 48
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading"
    },
    {
      "type": "range",
      "id": "subheading_size",
      "label": "Subheading size",
      "min": 12,
      "max": 32,
      "step": 2,
      "unit": "px",
      "default": 18
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text color",
      "default": "#ffffff"
    },
    {
      "type": "header",
      "content": "Button"
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button text",
      "default": "Shop now"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button link"
    },
    {
      "type": "color",
      "id": "button_background",
      "label": "Button background",
      "default": "#ffffff"
    },
    {
      "type": "color",
      "id": "button_text_color",
      "label": "Button text color",
      "default": "#000000"
    },
    {
      "type": "color",
      "id": "button_hover_background",
      "label": "Button hover background",
      "default": "#f5f5f5"
    },
    {
      "type": "color",
      "id": "button_hover_text_color",
      "label": "Button hover text color",
      "default": "#000000"
    },
    {
      "type": "range",
      "id": "button_border_radius",
      "label": "Button border radius",
      "min": 0,
      "max": 40,
      "step": 2,
      "unit": "px",
      "default": 4
    }
  ],
  "presets": [
    {
      "name": "GIF banner"
    }
  ]
}
{% endschema %}
`;

fs.writeFileSync('blocks/ai_gen_block_e2174bd.liquid', liquidCode, 'utf8');
console.log('Successfully wrote blocks/ai_gen_block_e2174bd.liquid!');
