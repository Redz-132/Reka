(function initGlobalEnhancements() {
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  
  if (isFinePointer && !reduceMotion) {
    document.querySelectorAll('.btn-magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${relX * 0.14 - 2}px, ${relY * 0.18 - 2}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  document.querySelectorAll('[data-sfx="click"]').forEach((el) => {
    el.addEventListener('click', () => TactileAudio.playClick());
  });

  
  const sections = document.querySelectorAll('main section[id]');
  const navItems = document.querySelectorAll('.nav-links a');
  if (sections.length && navItems.length) {
    let ticking = false;
    const spy = () => {
      ticking = false;
      let currentId = '';
      sections.forEach((sec) => {
        if (window.scrollY >= sec.offsetTop - 160) {
          currentId = sec.id;
        }
      });
      navItems.forEach((link) => {
        const on = link.getAttribute('href') === `#${currentId}`;
        if (link.classList.contains('active-link') !== on) link.classList.toggle('active-link', on);
        if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(spy); }
    }, { passive: true });
    spy();
  }

  
  window.addEventListener('keydown', (e) => {
    const el = document.activeElement;
    const tag = el && el.tagName ? el.tagName.toLowerCase() : '';
    if (['input', 'textarea', 'select'].includes(tag) || (el && el.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === 'e' && typeof EraManager !== 'undefined') {
      const next = EraManager.getEra() === '2026' ? '2035' : '2026';
      EraManager.setEra(next);
    }
  });
})();
