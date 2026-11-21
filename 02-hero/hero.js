(function initHero() {
  const rotatorBtn = document.getElementById('word-rotator');
  const phrases2026 = [
    'Kebiasaan Kecil ↻',
    'Audit Sampah Kelas ↻',
    'Hemat Listrik Harian ↻',
    'Kurangi Plastik Kantin ↻'
  ];
  const phrases2035 = [
    'Kota Sirkular 2035 ↻',
    '100% Energi Surya ↻',
    'Zero-Waste School ↻',
    'Transportasi Net-Zero ↻'
  ];
  let phraseIdx = 0;

  if (rotatorBtn) {
    rotatorBtn.addEventListener('click', () => {
      const activeList = document.documentElement.getAttribute('data-era') === '2035'
        ? phrases2035
        : phrases2026;
      phraseIdx = (phraseIdx + 1) % activeList.length;
      rotatorBtn.textContent = activeList[phraseIdx];
      rotatorBtn.style.transform = 'scale(0.94)';
      TactileAudio.playClick();
      setTimeout(() => {
        rotatorBtn.style.transform = '';
      }, 140);
    });
  }

  const jumpBtn = document.getElementById('hero-era-jump-btn');
  const bpQuickBtn = document.getElementById('bp-quick-toggle');

  function toggleEraFromHero() {
    const current = document.documentElement.getAttribute('data-era') || '2026';
    const next = current === '2026' ? '2035' : '2026';
    if (typeof EraManager !== 'undefined') {
      EraManager.setEra(next);
    } else {
      document.documentElement.setAttribute('data-era', next);
      window.dispatchEvent(new CustomEvent('reka:era-changed', { detail: next }));
    }
  }

  if (jumpBtn) jumpBtn.addEventListener('click', () => document.getElementById('eksplorasi')?.scrollIntoView({ behavior: 'smooth' }));
  if (bpQuickBtn) bpQuickBtn.addEventListener('click', toggleEraFromHero);

  window.addEventListener('reka:era-changed', (e) => {
    const is2035 = e.detail === '2035';

    const statusText = document.getElementById('era-status-text');
    const heroDesc = document.getElementById('hero-desc');
    const jumpLabel = document.getElementById('hero-jump-label');
    const bpFilename = document.getElementById('blueprint-filename');
    const bpStatus = document.getElementById('hero-blueprint-status');
    const bpTelemetry = document.getElementById('bp-telemetry');

    if (statusText) {
      statusText.textContent = is2035
        ? 'Visi 2035, kota sirkular'
        : 'Kondisi hari ini, 2026';
    }
    if (rotatorBtn) {
      rotatorBtn.textContent = is2035 ? phrases2035[0] : phrases2026[0];
    }
    if (heroDesc) {
      heroDesc.textContent = is2035
        ? 'Selamat datang di tahun 2035! Atap sekolah menghasilkan listrik surya mandiri, sungai kota kembali jernih dihuni ikan, dan 95% sampah terkelola dalam siklus ekonomi sirkular.'
        : 'Saat ini kota-kota Indonesia menghadapi tumpukan 68,5 juta ton sampah per tahun dan polusi udara perkotaan. Uji simulasi di bawah ini untuk melihat bagaimana aksi pelajar mengubahnya pada 2035.';
    }
    if (jumpLabel) {
      jumpLabel.textContent = is2035 ? 'Kembali ke 2026' : 'Lihat 2035';
    }
    if (bpQuickBtn) {
      bpQuickBtn.textContent = is2035 ? 'Lihat 2026 ⇄' : 'Bandingkan 2035 ⇄';
    }

    document.getElementById('metric-tag-1').textContent = is2035 ? 'Daur ulang sirkular' : 'timbulan sampah 2026';
    document.getElementById('hero-metric-1').textContent = is2035 ? '95% Terpilah' : '68,5 Jt Ton';
    document.getElementById('hero-label-1').textContent = is2035 ? 'Zero-waste ke TPA' : 'Per tahun di Indonesia';

    document.getElementById('metric-tag-2').textContent = is2035 ? 'Energi bersih sekolah' : 'bauran energi surya';
    document.getElementById('hero-metric-2').textContent = is2035 ? '100% Surya' : '< 15% EBT';
    document.getElementById('hero-label-2').textContent = is2035 ? 'Surplus listrik ke jaringan' : 'Masih dominan energi fosil';

    document.getElementById('metric-tag-3').textContent = 'Kualitas udara (AQI)';
    document.getElementById('hero-metric-3').textContent = is2035 ? '18 AQI' : '142 AQI';
    document.getElementById('hero-label-3').textContent = is2035 ? 'Udara segar & bebas asap' : 'Kategori Tidak Sehat';

    if (bpFilename) bpFilename.textContent = is2035 ? 'Kawasan kota, 2035' : 'Kawasan kota, 2026';
    if (bpStatus) bpStatus.textContent = is2035 ? '2035' : '2026';
    if (bpTelemetry) {
      bpTelemetry.textContent = is2035
        ? 'Listrik surya berlebih, sungai jernih'
        : 'Emisi tinggi, sungai tercemar';
    }

    const sceneBefore = document.getElementById('bp-scene-before');
    const sceneAfter = document.getElementById('bp-scene-after');
    if (sceneBefore) sceneBefore.setAttribute('opacity', is2035 ? '0' : '1');
    if (sceneAfter) sceneAfter.setAttribute('opacity', is2035 ? '1' : '0');
  });
})();
