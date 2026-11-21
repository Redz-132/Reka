
(function initPolish() {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  
  const REVEAL = [
    '.hero-content > *', '.hero-visual-card',
    '.section-head > *',
    '.preset-bar', '.sim-stage-card', '.sim-controls-card',
    '.scrubber-toolbar', '#ba-container', '.delta-card',
    '.scale-card',
    '.pilar-dashboard-bar', '.bento-flip-card',
    '.roadmap-card', '.quiz-card',
    '.commit-form-card', '.canvas-preview-card',
    '.method-card',
    '.footer-inner > *'
  ];

  function initReveal() {
    if (reduce.matches || !('IntersectionObserver' in window)) return;
    const groups = new Map();
    document.querySelectorAll(REVEAL.join(',')).forEach((el) => {
      if (el.classList.contains('rv')) return;
      const key = el.parentElement;
      const n = groups.get(key) || 0;
      groups.set(key, n + 1);
      el.style.setProperty('--i', String(Math.min(n, 8)));
      el.classList.add('rv');
    });
    void document.body.offsetHeight;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.rv').forEach((el) => io.observe(el));

    
    setTimeout(() => {
      document.querySelectorAll('.rv:not(.in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 2500);
  }

  
  const NUM_SELECTORS = [
    '#stat-score', '#stat-co2', '#stat-plastic', '#stat-trees-eq', '#stat-bottles-eq',
    '#hero-metric-1', '#hero-metric-2', '#hero-metric-3',
    '#school-size-val',
    '#scale-co2-10y', '#scale-co2-1y', '#scale-rupiah-1y', '#scale-kwh-1y',
    '#scale-plastic-10y', '#scale-plastic-1y', '#scale-forest-area',
    '#pilar-score-text'
  ];
  const NUM_RE = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/;

  const parseNum = (tok) => parseFloat(tok.replace(/\./g, '').replace(',', '.'));
  const decimals = (tok) => (tok.indexOf(',') >= 0 ? tok.length - tok.indexOf(',') - 1 : 0);
  const fmt = (v, dec) => v.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function trackNumber(el) {
    let shown = el.textContent;
    let raf = 0;
    let own = false;

    const mo = new MutationObserver(() => {
      if (own) { own = false; return; }
      const to = el.textContent;
      if (to === shown && !raf) return;
      cancelAnimationFrame(raf);
      raf = 0;

      const mTo = to.match(NUM_RE);
      const mFrom = shown.match(NUM_RE);
      if (reduce.matches || !mTo || !mFrom) { shown = to; return; }

      const dec = decimals(mTo[0]);
      const a = parseNum(mFrom[0]);
      const b = parseNum(mTo[0]);
      if (!isFinite(a) || !isFinite(b) || a === b) { shown = to; return; }

      const t0 = performance.now();
      const dur = clamp(Math.abs(b - a) < 5 ? 380 : 700, 300, 900);
      const step = (now) => {
        const k = clamp((now - t0) / dur, 0, 1);
        const text = k >= 1 ? to : to.replace(mTo[0], fmt(a + (b - a) * easeOutExpo(k), dec));
        own = true;
        el.textContent = text;
        mo.takeRecords();
        own = false;
        shown = text;
        raf = k < 1 ? requestAnimationFrame(step) : 0;
      };
      raf = requestAnimationFrame(step);
    });
    mo.observe(el, { childList: true, characterData: true, subtree: true });
  }

  function initNumbers() {
    NUM_SELECTORS.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) trackNumber(el);
    });
  }

  
  function initSliders() {
    const sliders = Array.from(document.querySelectorAll('input[type="range"].tactile-slider'));
    if (!sliders.length) return;

    const paint = (s) => {
      const min = Number(s.min || 0), max = Number(s.max || 100), v = Number(s.value);
      const r = max > min ? clamp((v - min) / (max - min), 0, 1) : 0;
      s.style.setProperty('--p', `calc(var(--half, 12px) + (100% - var(--half, 12px) * 2) * ${r.toFixed(4)})`);
      if (max - min === 3) {
        const ticks = s.parentElement.querySelectorAll('.slider-ticks span');
        ticks.forEach((t, i) => t.classList.toggle('is-active', i === v - min));
      }
    };
    const paintAll = () => sliders.forEach(paint);

    sliders.forEach((s) => s.addEventListener('input', () => paint(s)));
    window.addEventListener('reka:sim-updated', paintAll);
    window.addEventListener('reka:era-changed', () => requestAnimationFrame(paintAll));
    paintAll();
  }

  
  function initSpines() {
    const spines = Array.from(document.querySelectorAll('[data-spine]'));
    if (!spines.length) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      spines.forEach((sec) => {
        const r = sec.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = clamp((vh * 0.62 - r.top) / Math.max(1, r.height - vh * 0.1), 0, 1);
        sec.style.setProperty('--sp', p.toFixed(4));
      });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req, { passive: true });
    update();
  }

  
  function initScoreMeter() {
    const card = document.querySelector('.sim-stage-card');
    if (!card) return;
    const sync = () => {
      if (typeof SimulatorState !== 'undefined') card.style.setProperty('--score', String(clamp(Number(SimulatorState.score) || 0, 0, 100)));
    };
    window.addEventListener('reka:sim-updated', sync);
    sync();
  }

  initReveal();
  initNumbers();
  initSliders();
  initSpines();
  initScoreMeter();
})();
