(function initScrubber() {
  const baContainer = document.getElementById('ba-container');
  const baBefore = document.getElementById('ba-before-wrapper');
  const baHandle = document.getElementById('ba-handle');
  const focusLabel = document.getElementById('ba-focus-label');

  if (!baContainer || !baBefore || !baHandle) return;

  const MIN = 5;
  const MAX = 95;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value) => Math.max(MIN, Math.min(MAX, value));
  let currentPct = 50;
  let targetPct = currentPct;
  let isDragging = false;
  let raf = 0;
  let width = baContainer.offsetWidth;

  function updateFocus() {
    const focus = currentPct > 55 ? '2026' : currentPct < 45 ? '2035' : 'balanced';
    baContainer.dataset.focus = focus;
    if (focusLabel) {
      focusLabel.textContent = focus === 'balanced'
        ? 'Tampilan seimbang: 2026 ↔ 2035'
        : `Fokus tampilan: REKA ${focus}`;
    }
  }

  function paint() {
    baContainer.style.setProperty('--pos', `${currentPct.toFixed(3)}%`);
    baHandle.style.transform = `translateX(${((currentPct / 100) * width).toFixed(2)}px)`;
    const rounded = Math.round(currentPct);
    baHandle.setAttribute('aria-valuenow', rounded);
    baHandle.setAttribute('aria-valuetext', `Kawasan 2026 tampak ${rounded}%, kawasan 2035 ${100 - rounded}%`);
    baContainer.dataset.edge = currentPct < 24 ? 'left' : currentPct > 76 ? 'right' : '';
    updateFocus();
  }

  function tick() {
    raf = 0;
    const diff = targetPct - currentPct;
    if (reduceMotion.matches || Math.abs(diff) < 0.02) {
      currentPct = targetPct;
    } else {
      currentPct += diff * (isDragging ? 0.38 : 0.16);
      raf = requestAnimationFrame(tick);
    }
    paint();
  }

  function setTarget(pct, immediate = false) {
    targetPct = clamp(pct);
    if (immediate) currentPct = targetPct;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function pctFromClientX(clientX) {
    const rect = baContainer.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function onDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.pointerType === 'touch' && !event.target.closest('.ba-handle')) return;
    isDragging = true;
    baContainer.classList.add('is-dragging');
    try { baContainer.setPointerCapture(event.pointerId); } catch (error) {}
    setTarget(pctFromClientX(event.clientX));
    baHandle.focus({ preventScroll: true });
    if (typeof TactileAudio !== 'undefined') TactileAudio.playTick(0.5);
  }

  function onMove(event) {
    if (isDragging) setTarget(pctFromClientX(event.clientX));
  }

  function onUp() {
    if (!isDragging) return;
    isDragging = false;
    baContainer.classList.remove('is-dragging');
  }

  baContainer.addEventListener('pointerdown', onDown);
  baContainer.addEventListener('pointermove', onMove);
  baContainer.addEventListener('pointerup', onUp);
  baContainer.addEventListener('pointercancel', onUp);
  baContainer.addEventListener('lostpointercapture', onUp);

  baHandle.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 15 : 5;
    let next = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = targetPct - step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = targetPct + step;
    else if (event.key === 'PageDown') next = targetPct - 15;
    else if (event.key === 'PageUp') next = targetPct + 15;
    else if (event.key === 'Home') next = MIN;
    else if (event.key === 'End') next = MAX;
    if (next === null) return;
    event.preventDefault();
    setTarget(next);
    if (typeof TactileAudio !== 'undefined') TactileAudio.playTick(clamp(next) / 100);
  });

  document.querySelectorAll('[data-snap]').forEach((button) => {
    button.addEventListener('click', () => setTarget(Number(button.dataset.snap)));
  });

  window.addEventListener('reka:era-changed', (event) => {
    setTarget(event.detail === '2035' ? 18 : 82, true);
  });

  const syncWidth = () => {
    width = baContainer.offsetWidth;
    paint();
  };
  if ('ResizeObserver' in window) new ResizeObserver(syncWidth).observe(baContainer);
  else window.addEventListener('resize', syncWidth);

  paint();
})();
