const ReadinessState = {
  percent: 33
};

(function initPilarCards() {
  const adopted = new Set(['1', '2']);
  const meterFill = document.getElementById('pilar-meter-fill');
  const scoreText = document.getElementById('pilar-score-text');

  function updateReadinessUI() {
    const pct = Math.round((adopted.size / 6) * 100);
    ReadinessState.percent = pct;
    if (meterFill) meterFill.style.width = `${pct}%`;
    if (scoreText) scoreText.textContent = `${pct}%`;

    [1, 2, 3, 4, 5, 6].forEach((idx) => {
      const isSelected = adopted.has(String(idx));
      const badge = document.getElementById(`pilar-badge-${idx}`);
      const btn = document.querySelector(`.adopt-btn[data-pilar-idx="${idx}"]`);
      if (badge) {
        badge.textContent = isSelected ? 'Siap dijalankan' : 'Belum dipilih';
        badge.classList.toggle('selected', isSelected);
      }
      if (btn) {
        btn.textContent = isSelected ? 'Terpilih' : '+ Pilih Aksi';
        btn.classList.toggle('active', isSelected);
      }
    });

    window.dispatchEvent(new Event('reka:sim-updated'));
  }

  document.querySelectorAll('.adopt-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = btn.dataset.pilarIdx;
      if (adopted.has(idx)) {
        adopted.delete(idx);
        TactileAudio.playClick();
      } else {
        adopted.add(idx);
        TactileAudio.playSuccess();
      }
      updateReadinessUI();
    });
  });

  document.querySelectorAll('.bento-flip-card').forEach((card) => {
    const flipAction = () => {
      card.classList.toggle('flipped');
      TactileAudio.playClick();
    };
    card.addEventListener('click', flipAction);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flipAction();
      }
    });
  });

  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;

      document.querySelectorAll('.bento-flip-card').forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden-card', !match);
      });
    });
  });

  window.addEventListener('reka:era-changed', (e) => {
    const heading = document.getElementById('pilar-heading');
    if (heading) {
      heading.textContent = e.detail === '2035'
        ? '6 Pilar Ekosistem Sekolah Sirkular (Target 2035)'
        : '6 Pilar Aksi Pelajar: Tantangan 2026 & Target 2035';
    }
    if (e.detail === '2035') {
      ['1', '2', '3', '4', '5', '6'].forEach((id) => adopted.add(id));
      updateReadinessUI();
    }
  });

  updateReadinessUI();
})();
