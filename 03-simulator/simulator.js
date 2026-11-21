const SimulatorState = {
  co2Saved: 420,
  plasticSaved: 14.5,
  score: 52,
  kwhSaved: 310
};

(function initSimulator() {
  const sTransport = document.getElementById('slider-transport');
  const sPlastic = document.getElementById('slider-plastic');
  const sEnergy = document.getElementById('slider-energy');
  const sFood = document.getElementById('slider-food');
  const presetBtn = document.getElementById('preset-max-btn');
  const sceneFrame = document.getElementById('sim-scene-frame');
  const cityImage = document.getElementById('sim-city-image');

  if (!sTransport || !sPlastic || !sEnergy || !sFood || !sceneFrame || !cityImage) return;

  const labels = {
    transport: ['', 'Mobil Pribadi', 'Motor Pribadi', 'Angkutan Umum', 'Sepeda / Jalan'],
    plastic: ['', 'Plastik Harian', 'Kadang Tumbler', 'Bawa Botol', '100% Guna Ulang'],
    energy: ['', 'Boros Daya', 'Standar Rumah', 'Hemat Listrik', 'Panel Surya'],
    food: ['', 'Sering Sisa', 'Kadang Sisa', 'Habiskan Porsi', 'Kompos Aktif']
  };

  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const normalize = (value) => clamp01((Number(value) - 1) / 3);
  const smooth = (value) => {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
  };

  function updateCityVisual(values, score, is2035) {
    const { transport, plastic, energy, food } = values;
    const currentValues = { transport, energy, plastic, food };
    const qualities = Object.fromEntries(Object.entries(currentValues).map(([key, value]) => [key, normalize(value)]));
    const overallQuality = Object.values(qualities).reduce((sum, value) => sum + value, 0) / 4;
    const era = is2035 ? '2035' : '2026';
    const visualYear = is2035 && overallQuality >= 0.34 ? '2035' : '2026';
    const nextImage = visualYear === '2035' ? 'assets/city-2035-scene.webp' : 'assets/city-2026-scene.webp';
    if (cityImage.getAttribute('src') !== nextImage) {
      cityImage.classList.add('is-changing');
      cityImage.onload = () => cityImage.classList.remove('is-changing');
      cityImage.setAttribute('src', nextImage);
    }

    sceneFrame.dataset.era = era;
    sceneFrame.dataset.visualYear = visualYear;
    sceneFrame.dataset.scoreBand = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    sceneFrame.dataset.transport = String(transport);
    sceneFrame.dataset.energy = String(energy);
    sceneFrame.dataset.plastic = String(plastic);
    sceneFrame.dataset.food = String(food);
    sceneFrame.style.setProperty('--scene-quality', overallQuality.toFixed(3));
    Object.entries(qualities).forEach(([key, value]) => {
      sceneFrame.style.setProperty(`--scene-${key}`, value.toFixed(3));
    });
    sceneFrame.style.setProperty('--scene-transition', overallQuality.toFixed(3));
    sceneFrame.style.setProperty('--scene-transport', qualities.transport.toFixed(3));
    sceneFrame.style.setProperty('--scene-energy', qualities.energy.toFixed(3));
    sceneFrame.style.setProperty('--scene-plastic', qualities.plastic.toFixed(3));
    sceneFrame.style.setProperty('--scene-food', qualities.food.toFixed(3));

    cityImage.dataset.era = era;
    cityImage.dataset.visualYear = visualYear;
    cityImage.dataset.scoreBand = sceneFrame.dataset.scoreBand;
    cityImage.alt = visualYear === '2035'
      ? 'Kota sirkular 2035 dengan bus listrik, jalur sepeda, panel surya, ruang hijau, dan sungai bersih.'
      : 'Kota tahun 2026 dengan kendaraan pribadi, lalu lintas padat, dan sungai perkotaan.';

    const imageEra = document.getElementById('sim-image-era');
    const imageState = document.getElementById('sim-image-state');
    const eraChip = document.getElementById('sim-era-chip');
    const sceneEra = document.getElementById('sim-scene-era');
    const sceneDescription = document.getElementById('sim-scene-description');

    if (imageEra) imageEra.textContent = `VISUAL KOTA ${visualYear}`;
    if (eraChip) {
      eraChip.textContent = `MODE ${era}`;
      eraChip.dataset.era = era;
    }
    if (sceneEra) sceneEra.textContent = `TAMPILAN ${era}`;

    let stateText = 'Kota masih dalam tahap awal';
    if (score >= 75) stateText = 'Kota bergerak menuju sirkular';
    else if (score >= 40) stateText = 'Transisi menuju kota lebih hijau';
    if (imageState) imageState.textContent = visualYear === '2035' ? stateText : 'Kondisi kota saat ini';

    const descriptions = [
      `Mobilitas: ${labels.transport[transport]}`,
      `Energi: ${labels.energy[energy]}`,
      `Sampah: ${labels.plastic[plastic]}`,
      `Makanan: ${labels.food[food]}`
    ];
    if (sceneDescription) sceneDescription.textContent = descriptions.join(' · ');

    const impactLabels = {
      transport: { low: 'Emisi kendaraan tinggi', high: 'Sepeda / Jalan' },
      energy: { low: 'Boros listrik', high: 'Panel Surya' },
      plastic: { low: 'Plastik sekali pakai', high: 'Guna ulang' },
      food: { low: 'Sisa makanan', high: 'Kompos Aktif' }
    };
    Object.entries(currentValues).forEach(([key, value]) => {
      const card = document.querySelector(`[data-sim-impact="${key}"]`);
      const valueNode = document.getElementById(`sim-impact-${key}`);
      if (!card) return;
      card.dataset.level = String(value);
      card.style.setProperty('--impact-level', normalize(value).toFixed(3));
      card.classList.toggle('is-active', value >= 3);
      card.classList.toggle('is-strong', value === 4);
      if (valueNode) valueNode.textContent = labels[key][value];
      card.setAttribute('aria-label', `${key}: ${labels[key][value]}. ${value >= 3 ? impactLabels[key].high : impactLabels[key].low}.`);
    });

    sceneFrame.setAttribute('aria-label', `Ilustrasi kota 2D ${visualYear}, mode tahun ${era}, skor ekosistem ${score} dari 100. ${descriptions.join('. ')}.`);
  }

  function recalculate() {
    const vT = Number(sTransport.value);
    const vP = Number(sPlastic.value);
    const vE = Number(sEnergy.value);
    const vF = Number(sFood.value);
    const is2035 = document.documentElement.getAttribute('data-era') === '2035';
    const eraMultiplier = is2035 ? 1.35 : 1.0;

    document.getElementById('val-transport').textContent = labels.transport[vT];
    document.getElementById('val-plastic').textContent = labels.plastic[vP];
    document.getElementById('val-energy').textContent = labels.energy[vE];
    document.getElementById('val-food').textContent = labels.food[vF];

    const eraBonusPill = document.getElementById('era-bonus-pill');
    if (eraBonusPill) {
      eraBonusPill.textContent = is2035
        ? 'Infrastruktur 2035 · jaringan energi bersih (1,35×)'
        : 'Kondisi dasar 2026 · faktor awal (1,0×)';
    }

    const baseCo2 = (vT - 1) * 190 + (vP - 1) * 35 + (vE - 1) * 165 + (vF - 1) * 85;
    const co2 = Math.round(baseCo2 * eraMultiplier);
    const plastic = (((vP - 1) * 7.2 + (vF - 1) * 1.4) * (is2035 ? 1.2 : 1.0)).toFixed(1);
    const kwhSaved = Math.round(((vE - 1) * 210 + 95) * eraMultiplier);
    const totalPoints = vT + vP + vE + vF;
    const rawScore = Math.round(((totalPoints - 4) / 12) * 100);
    const score = Math.min(100, is2035 ? Math.round(rawScore * 1.12) : rawScore);

    SimulatorState.co2Saved = co2;
    SimulatorState.plasticSaved = plastic;
    SimulatorState.score = score;
    SimulatorState.kwhSaved = kwhSaved;

    document.getElementById('stat-co2').textContent = `${co2} kg CO₂e`;
    document.getElementById('stat-plastic').textContent = `${plastic} kg`;
    document.getElementById('stat-score').textContent = `${score}/100`;

    const scoreMeter = document.querySelector('.score-meter');
    if (scoreMeter) scoreMeter.style.setProperty('--score', score);

    const treesEq = Math.max(1, Math.round(co2 / 22));
    const bottlesEq = Math.round(Number(plastic) * 50);
    document.getElementById('stat-trees-eq').textContent = `Setara ${treesEq} pohon dewasa/thn`;
    document.getElementById('stat-bottles-eq').textContent = `± ${bottlesEq} botol plastik 600ml`;

    const badge = document.getElementById('score-badge');
    if (score >= 75) {
      badge.textContent = 'Kota lestari';
      badge.style.background = '#98D848';
    } else if (score >= 40) {
      badge.textContent = 'Transisi hijau';
      badge.style.background = '#F8B828';
    } else {
      badge.textContent = 'Emisi tinggi';
      badge.style.background = '#EE7D63';
    }

    updateCityVisual({
      transport: vT,
      plastic: vP,
      energy: vE,
      food: vF
    }, score, is2035);

    window.dispatchEvent(new Event('reka:sim-updated'));
  }

  const presets = {
    boros: [1, 1, 1, 1],
    rata2: [2, 2, 2, 3],
    adiwiyata: [3, 3, 3, 4],
    '2035': [4, 4, 4, 4]
  };

  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const vals = presets[btn.dataset.preset];
      if (!vals) return;
      [sTransport.value, sPlastic.value, sEnergy.value, sFood.value] = vals;
      document.querySelectorAll('[data-preset]').forEach((preset) => {
        preset.setAttribute('aria-pressed', String(preset === btn));
      });
      if (btn.dataset.preset === 'rata2' && typeof EraManager !== 'undefined') {
        EraManager.setEra('2026');
      } else if (btn.dataset.preset === '2035' && typeof EraManager !== 'undefined') {
        EraManager.setEra('2035');
      }
      recalculate();
    });
  });

  [sTransport, sPlastic, sEnergy, sFood].forEach((slider) => {
    slider.addEventListener('input', () => {
      document.querySelectorAll('[data-preset]').forEach((preset) => preset.setAttribute('aria-pressed', 'false'));
      if (typeof TactileAudio !== 'undefined') TactileAudio.playTick(Number(slider.value) / 4);
      recalculate();
    });
  });

  if (presetBtn) {
    presetBtn.addEventListener('click', () => {
      sTransport.value = 4;
      sPlastic.value = 4;
      sEnergy.value = 4;
      sFood.value = 4;
      document.querySelectorAll('[data-preset]').forEach((preset) => {
        preset.setAttribute('aria-pressed', String(preset.dataset.preset === '2035'));
      });
      if (typeof EraManager !== 'undefined') EraManager.setEra('2035');
      if (typeof TactileAudio !== 'undefined') TactileAudio.playSuccess();
      recalculate();
    });
  }

  window.addEventListener('reka:era-changed', recalculate);
  recalculate();
})();
