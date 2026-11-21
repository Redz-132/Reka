(function initSchoolScale() {
  const slider = document.getElementById('school-size-slider');
  const sizeVal = document.getElementById('school-size-val');
  if (!slider) return;

  function updateScaleProjection() {
    const students = Number(slider.value);
    if (sizeVal) sizeVal.textContent = students.toLocaleString('id-ID');

    const co2PerStudent = typeof SimulatorState !== 'undefined' ? SimulatorState.co2Saved : 420;
    const plasticPerStudent = typeof SimulatorState !== 'undefined' ? Number(SimulatorState.plasticSaved) : 14.5;
    const kwhPerStudent = typeof SimulatorState !== 'undefined' ? SimulatorState.kwhSaved : 310;

    const totalCo2Tons1Y = (co2PerStudent * students) / 1000;
    const totalCo2Tons10Y = totalCo2Tons1Y * 10;

    const totalKwh1Y = kwhPerStudent * students;
    const rupiahMillion1Y = Math.round((totalKwh1Y * 1445) / 1000000);

    const totalPlasticKg1Y = plasticPerStudent * students;
    const totalPlasticTons10Y = (totalPlasticKg1Y * 10) / 1000;

    const forestSqm = Math.round((co2PerStudent * students) / 22) * 10;

    document.getElementById('scale-co2-10y').textContent = `${totalCo2Tons10Y.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton`;
    document.getElementById('scale-co2-1y').textContent = `${totalCo2Tons1Y.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton CO₂e / tahun`;

    document.getElementById('scale-rupiah-1y').textContent = `Rp ${rupiahMillion1Y.toLocaleString('id-ID')} Jt/thn`;
    document.getElementById('scale-kwh-1y').textContent = `${totalKwh1Y.toLocaleString('id-ID')} kWh energi dihemat`;

    document.getElementById('scale-plastic-10y').textContent = `${totalPlasticTons10Y.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton`;
    document.getElementById('scale-plastic-1y').textContent = `${Math.round(totalPlasticKg1Y).toLocaleString('id-ID')} kg / tahun bebas TPA`;

    document.getElementById('scale-forest-area').textContent = `${forestSqm.toLocaleString('id-ID')} m²`;
  }

  slider.addEventListener('input', () => {
    TactileAudio.playTick(slider.value / 1500);
    updateScaleProjection();
  });

  window.addEventListener('reka:sim-updated', updateScaleProjection);
  updateScaleProjection();
})();
