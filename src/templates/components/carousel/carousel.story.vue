<!--
  Carousel story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Default — 4 slides, autoplay OFF, manual prev/next + dots.
    2. Autoplay opt-in — 5000 ms tick + pause-on-hover + play/pause toggle.
    3. Loop=false — bounded at edges, prev/next disabled at first/last.
    4. Keyboard nav (Arrow / Home / End demo) + touch swipe explainer.
    5. Events log — wired to carousel:slide-change demonstration.

  Helpers (per S2.3a story doctrine — nested template literal avoidance):
    - carousel({ id, currentSlide, autoplayInterval, loop, slides, label, … })
    - slideBlock(quote, attrib) for testimonial-style content.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  // Wire the events log demo.
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const id = log.getAttribute('data-events-log');
    const wrap = document.getElementById(id);
    if (!wrap) continue;
    const out = log.querySelector('[data-events-out]');
    wrap.addEventListener('carousel:slide-change', (e) => {
      const d = e.detail;
      const line = document.createElement('div');
      line.textContent = `carousel:slide-change → ${d.previousSlide} → ${d.currentSlide} / ${d.totalSlides} (${d.direction})`;
      if (out) out.appendChild(line);
    });
  }
});

let _carCounter = 0;
function nextId(prefix = 'car') { return `${prefix}-${++_carCounter}`; }

function S(key) { return t('theme.carousel.story.' + key); }

function slideBlock(quote, attrib) {
  return `<blockquote class="car-story__quote">
    <p class="car-story__quote-text">« ${quote} »</p>
    <footer class="car-story__quote-attrib">— ${attrib}</footer>
  </blockquote>`;
}

function carousel({
  id,
  currentSlide = 0,
  autoplayInterval = 0,
  loop = true,
  showAutoplayToggle = null,
  slides = [],
  label = null,
}) {
  const wrapId = id || nextId('car');
  const showAuto = showAutoplayToggle != null ? showAutoplayToggle : (autoplayInterval > 0);
  const total = slides.length;
  const slidesHtml = slides.map((s, i) => {
    const isActive = i === currentSlide;
    const ariaHidden = isActive ? '' : ' aria-hidden="true"';
    return `<article id="${wrapId}-slide-${i}"
      class="cremona-carousel__slide"
      data-carousel-target="slide"
      role="group"
      aria-roledescription="${S('aria.slide-roledescription')}"
      aria-label="${i + 1} sur ${total}"
      data-state="${isActive ? 'active' : 'inactive'}"
      tabindex="${isActive ? '0' : '-1'}"${ariaHidden}>${s.content || ''}</article>`;
  }).join('');
  const dotsHtml = slides.map((s, i) => {
    const isActive = i === currentSlide;
    const cur = isActive ? ' aria-current="true"' : '';
    const dotLbl = S('aria.dot').replace('{index}', i + 1).replace('{total}', total);
    return `<button type="button" class="cremona-carousel__dot"
      data-carousel-target="dot"
      data-slide-index="${i}"
      data-action="click->carousel#goTo"
      aria-label="${dotLbl}"
      aria-controls="${wrapId}-slide-${i}"
      data-state="${isActive ? 'active' : 'inactive'}"${cur}></button>`;
  }).join('');
  const autoplayHtml = showAuto ? `<button type="button" class="cremona-carousel__autoplay-toggle"
    data-carousel-target="autoplayToggle"
    data-action="click->carousel#toggleAutoplay"
    aria-label="${S('aria.autoplay')}"
    aria-pressed="false"
    data-state="playing">
    <span class="cremona-carousel__autoplay-icon" aria-hidden="true"></span>
  </button>` : '';
  const lbl = label || S('default-label');
  return `<div id="${wrapId}" class="cremona-carousel"
    data-controller="carousel"
    data-carousel-current-slide-value="${currentSlide}"
    data-carousel-autoplay-interval-value="${autoplayInterval}"
    data-carousel-loop-value="${loop}"
    role="region"
    aria-roledescription="${S('aria.carousel-roledescription')}"
    aria-label="${lbl}">
    <div class="cremona-carousel__viewport" data-carousel-target="viewport">
      <div class="cremona-carousel__track" data-carousel-target="track">${slidesHtml}</div>
    </div>
    <div class="cremona-carousel__controls">
      <button type="button" class="cremona-carousel__nav cremona-carousel__nav--prev"
        data-carousel-target="prev"
        data-action="click->carousel#prev"
        aria-label="${S('aria.prev')}"
        aria-controls="${wrapId}">
        <span class="cremona-carousel__nav-icon" aria-hidden="true"></span>
      </button>
      <button type="button" class="cremona-carousel__nav cremona-carousel__nav--next"
        data-carousel-target="next"
        data-action="click->carousel#next"
        aria-label="${S('aria.next')}"
        aria-controls="${wrapId}">
        <span class="cremona-carousel__nav-icon" aria-hidden="true"></span>
      </button>
    </div>
    <div class="cremona-carousel__pagination">${dotsHtml}</div>
    ${autoplayHtml}
  </div>`;
}

const testimonials = [
  { content: slideBlock(S('quote.t1'), S('quote.t1-attrib')) },
  { content: slideBlock(S('quote.t2'), S('quote.t2-attrib')) },
  { content: slideBlock(S('quote.t3'), S('quote.t3-attrib')) },
  { content: slideBlock(S('quote.t4'), S('quote.t4-attrib')) },
];

const features = [
  { content: `<div class="car-story__feature"><h3>${S('feature.f1-title')}</h3><p>${S('feature.f1-body')}</p></div>` },
  { content: `<div class="car-story__feature"><h3>${S('feature.f2-title')}</h3><p>${S('feature.f2-body')}</p></div>` },
  { content: `<div class="car-story__feature"><h3>${S('feature.f3-title')}</h3><p>${S('feature.f3-body')}</p></div>` },
];

const bodyHtml = `
  <section class="car-story" data-testid="carousel-root">
    <header class="car-story__header">
      <h1>${t('theme.carousel.story.title')}</h1>
      <p>${t('theme.carousel.story.subtitle')}</p>
    </header>

    <section class="car-story__section" aria-labelledby="car-section-default">
      <h2 id="car-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="car-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      ${carousel({ slides: testimonials, label: S('aria.testimonials') })}
    </section>

    <section class="car-story__section" aria-labelledby="car-section-autoplay">
      <h2 id="car-section-autoplay" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.autoplay')}</h2>
      <p class="car-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.autoplay')}</p>
      ${carousel({ slides: features, autoplayInterval: 5000, label: S('aria.features') })}
    </section>

    <section class="car-story__section" aria-labelledby="car-section-bounded">
      <h2 id="car-section-bounded" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.bounded')}</h2>
      <p class="car-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.bounded')}</p>
      ${carousel({ slides: features, loop: false, label: S('aria.bounded') })}
    </section>

    <section class="car-story__section" aria-labelledby="car-section-keyboard">
      <h2 id="car-section-keyboard" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.keyboard')}</h2>
      <p class="car-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.keyboard')}</p>
      ${carousel({ slides: testimonials, label: S('aria.keyboard') })}
    </section>

    <section class="car-story__section" aria-labelledby="car-section-events">
      <h2 id="car-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="car-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      ${carousel({ id: 'car-events-demo', slides: testimonials, label: S('aria.events') })}
      <div class="car-story__log" data-events-log="car-events-demo">
        <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-events-out class="car-story__log-out"></div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Carousel" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="car-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="car-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.car-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.car-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.car-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.car-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.car-story__explainer { max-inline-size: 70ch; }
.car-story__quote { margin: 0; display: flex; flex-direction: column; gap: var(--spacing-3); max-inline-size: 50ch; text-align: center; }
.car-story__quote-text { font: var(--typography-h3); color: var(--color-text-primary); font-weight: var(--font-weight-medium); margin: 0; }
.car-story__quote-attrib { font: var(--typography-caption); color: var(--color-text-tertiary); }
.car-story__feature { display: flex; flex-direction: column; gap: var(--spacing-2); text-align: center; max-inline-size: 50ch; }
.car-story__feature h3 { font: var(--typography-h2); margin: 0; }
.car-story__feature p { font: var(--typography-body); color: var(--color-text-secondary); margin: 0; }
.car-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.car-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.car-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
