const EraManager = (() => {
  let currentEra = document.documentElement.getAttribute('data-era') || '2026';

  document.querySelectorAll('.mode-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.era === currentEra);
    b.setAttribute('aria-pressed', String(b.dataset.era === currentEra));
  });

  function setEra(era) {
    if (era !== '2026' && era !== '2035') return;
    currentEra = era;
    document.documentElement.setAttribute('data-era', era);

    document.querySelectorAll('.mode-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.era === era);
      b.setAttribute('aria-pressed', String(b.dataset.era === era));
    });

    const ribbon = document.getElementById('era-ribbon');
    if (ribbon) {
      if (era === '2035') {
        ribbon.innerHTML = '<strong>Tampilan 2035.</strong> Panel surya menyala, sungai kembali jernih, dan perhitungan memakai pengali energi bersih 1,35.';
      } else {
        ribbon.innerHTML = '<strong>Tampilan 2026.</strong> Pindah ke 2035 lewat sakelar di kanan atas, atau tekan tombol E.';
      }
    }

    TactileAudio.playEraShift(era === '2035');
    window.dispatchEvent(new CustomEvent('reka:era-changed', { detail: era }));
  }

  function getEra() {
    return currentEra;
  }

  return { setEra, getEra };
})();

(function initNavbar() {
  const progressFill = document.getElementById('scroll-progress');
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const audioToggle = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  const audioLabel = document.getElementById('audio-label');
  const modeBtns = document.querySelectorAll('.mode-btn');

  
  if (progressFill) {
    let ticking = false;
    const paint = () => {
      ticking = false;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
      progressFill.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener('resize', paint, { passive: true });
    paint();
  }

  
  function setMenu(open) {
    if (!menuToggle || !navLinks) return;
    navLinks.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  }
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      TactileAudio.playClick();
      setMenu(!navLinks.classList.contains('open'));
    });
    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => setMenu(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    document.addEventListener('pointerdown', (e) => {
      if (navLinks.classList.contains('open') && !e.target.closest('.navbar')) setMenu(false);
    });
  }

  
  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  if (audioIcon) audioIcon.innerHTML = ICON_ON;
  if (audioToggle) {
    audioToggle.setAttribute('aria-pressed', 'true');
    audioToggle.addEventListener('click', () => {
      const isMuted = TactileAudio.toggleMute();
      audioIcon.innerHTML = isMuted ? ICON_OFF : ICON_ON;
      audioLabel.textContent = isMuted ? 'Off' : 'SFX';
      audioToggle.setAttribute('aria-pressed', String(!isMuted));
    });
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      EraManager.setEra(btn.dataset.era);
    });
  });

  
  if (navLinks) {
    const bar = document.createElement('span');
    bar.className = 'nav-indicator';
    bar.setAttribute('aria-hidden', 'true');
    navLinks.appendChild(bar);

    const place = () => {
      const active = navLinks.querySelector('a.active-link');
      if (!active || window.matchMedia('(max-width: 920px)').matches) { bar.classList.remove('on'); return; }
      const left = active.offsetLeft + 12;
      const width = Math.max(4, active.offsetWidth - 24);
      bar.style.transform = `translateX(${left}px) scaleX(${width})`;
      bar.classList.add('on');
    };
    const mo = new MutationObserver(place);
    navLinks.querySelectorAll('a').forEach((a) => mo.observe(a, { attributes: true, attributeFilter: ['class'] }));
    window.addEventListener('resize', place, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    place();
  }
})();
