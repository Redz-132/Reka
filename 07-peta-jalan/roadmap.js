(function initRoadmapAndQuiz() {
  const phases = {
    '2026': {
      pill: 'Tahap inisiasi & audit',
      title: '2026: Membangun Kebiasaan & Data Dasar',
      items: [
        '<strong>Audit Sampah & Daya Sekolah:</strong> Pemetaan volume plastik kantin dan jam puncak konsumsi listrik kelas.',
        '<strong>Gerakan Tumbler & Zero-Plastic:</strong> Mengurangi 70% sampah kemasan minuman sekali pakai di lingkungan sekolah.',
        '<strong>Peluncuran Bank Sampah QR:</strong> Integrasi poin tabungan daur ulang dengan koperasi siswa.'
      ]
    },
    '2030': {
      pill: 'Tahap transisi infrastruktur',
      title: '2030: Integrasi Panel Surya & Kantin Sirkular',
      items: [
        '<strong>Atap Surya 50% Ruang Kelas:</strong> Memangkas ketergantungan listrik fosil hingga separuh beban puncak siang hari.',
        '<strong>Komposter & Hidroponik Mandiri:</strong> 100% limbah organik kantin diolah menjadi nutrisi kebun sayur sekolah.',
        '<strong>Koridor Aman Bike-Bus:</strong> Jalur sepeda terproteksi menghubungkan sekolah dengan pemukiman dalam radius 3 km.'
      ]
    },
    '2035': {
      pill: 'Tahap ekosistem net-zero',
      title: '2035: Sekolah Mandiri Energi & Kota Sirkular',
      items: [
        '<strong>100% Energi Bersih & Surplus Daya:</strong> Ekspor kelebihan listrik surya sekolah ke jaringan mikro lingkungan.',
        '<strong>95% Sampah Terkelola Sirkular:</strong> Hampir nol residu yang dikirim ke Tempat Pemrosesan Akhir (TPA).',
        '<strong>Kualitas Udara Sehat (< 20 AQI):</strong> Suhu mikro kawasan turun hingga 7°C berkat hutan vertikal & kanopi hijau.'
      ]
    }
  };

  const phaseDisplay = document.getElementById('phase-display');
  const phaseTabs = Array.from(document.querySelectorAll('.phase-tab'));
  const phaseRail = document.querySelector('.phase-tabs');

  
  function syncTimeline(activeTab) {
    const idx = phaseTabs.indexOf(activeTab);
    phaseTabs.forEach((t, i) => {
      t.dataset.state = i < idx ? 'done' : i === idx ? 'active' : 'upcoming';
      t.setAttribute('aria-selected', String(i === idx));
    });
    if (phaseRail && phaseTabs.length > 1) phaseRail.style.setProperty('--phase-p', String(Math.max(0, idx) / (phaseTabs.length - 1)));
  }
  syncTimeline(phaseTabs.find((t) => t.classList.contains('active')) || phaseTabs[0]);

  phaseTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.phase-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      syncTimeline(tab);
      const data = phases[tab.dataset.phase];
      if (data && phaseDisplay) {
        phaseDisplay.innerHTML = `
          <span class="status-pill">${data.pill}</span>
          <h3>${data.title}</h3>
          <ul class="phase-list">${data.items.map((li) => `<li>${li}</li>`).join('')}</ul>
        `;
      }
    });
  });

  const questions = [
    {
      q: 'Mengapa sisa makanan yang menumpuk di TPA berbahaya bagi iklim?',
      right: 'Menghasilkan gas metana (CH₄) yang jauh lebih kuat memerangkap panas daripada CO₂',
      wrong: ['Membuat air hujan berubah menjadi asam sulfat', 'Menghambat sinyal seluler di kota'],
      info: 'Pembusukan tanpa oksigen di TPA melepas metana, sekitar 28 kali lebih kuat dari CO₂ dalam 100 tahun.'
    },
    {
      q: 'Berapa potensi rata-rata energi surya di Indonesia?',
      right: 'Sekitar 4,8 kWh/m² per hari',
      wrong: ['Sekitar 1,1 kWh/m² per hari', 'Sekitar 0,4 kWh/m² per hari'],
      info: 'Indonesia dilalui garis khatulistiwa, jadi atap sekolah termasuk lokasi yang bagus untuk panel surya.'
    },
    {
      q: 'Apa prinsip utama ekonomi sirkular?',
      right: 'Mengurangi, memakai ulang, dan mendaur ulang material dalam siklus tertutup',
      wrong: ['Ambil, pakai, lalu buang ke TPA', 'Membakar sampah plastik tiap akhir pekan'],
      info: 'Ekonomi sirkular menjaga material tetap beredar selama mungkin supaya limbahnya sedikit.'
    },
    {
      q: 'Untuk perjalanan ke sekolah yang jaraknya dekat, pilihan mana yang emisinya paling rendah?',
      right: 'Jalan kaki atau bersepeda',
      wrong: ['Diantar mobil pribadi', 'Naik motor sendiri'],
      info: 'Jalan kaki dan sepeda hampir tidak menghasilkan emisi, dan jalur aman membuatnya lebih mudah dipilih.'
    },
    {
      q: 'Mengapa sampah perlu dipilah dari sumbernya?',
      right: 'Sampah organik bisa dikomposkan dan material kering lebih mudah didaur ulang',
      wrong: ['Supaya tong sampah terlihat lebih penuh', 'Supaya sampah tidak perlu diangkut lagi'],
      info: 'Sampah yang bercampur sulit diolah. Dipilah sejak awal, lebih sedikit yang berakhir di TPA.'
    }
  ];

  let qIdx = 0;
  let score = 0;
  let locked = false;

  const qText = document.getElementById('quiz-question');
  const qOpts = document.getElementById('quiz-options');
  const qFeed = document.getElementById('quiz-feedback');
  const qPill = document.getElementById('quiz-progress-pill');

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function finish() {
    const total = questions.length;
    qPill.textContent = `Skor ${score} dari ${total}`;
    qText.textContent = `Selesai! Kamu menjawab benar ${score} dari ${total} pertanyaan.`;
    qOpts.innerHTML = '<button type="button" id="quiz-restart-btn" class="btn-tactile btn-accent btn-sm">Ulangi Kuis ↻</button>';
    qFeed.textContent = score === total
      ? 'Predikat: Duta Ekosistem 2035!'
      : 'Coba lagi setelah menjelajahi simulasi di atas untuk skor sempurna.';
    document.getElementById('quiz-restart-btn').addEventListener('click', () => {
      qIdx = 0;
      score = 0;
      renderQuestion();
    });
  }

  function renderQuestion() {
    if (!qText || !qOpts) return;
    locked = false;
    const item = questions[qIdx];
    const choices = shuffle([{ text: item.right, ok: true }].concat(item.wrong.map((text) => ({ text, ok: false }))));
    qPill.textContent = `Soal ${qIdx + 1} dari ${questions.length}`;
    qText.textContent = item.q;
    qFeed.textContent = '';
    qOpts.innerHTML = choices
      .map((c, idx) => `<button type="button" class="quiz-opt-btn" data-ok="${c.ok}">${String.fromCharCode(65 + idx)}. ${c.text}</button>`)
      .join('');

    qOpts.querySelectorAll('.quiz-opt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        if (btn.dataset.ok === 'true') {
          btn.classList.add('correct');
          score++;
          TactileAudio.playSuccess();
        } else {
          btn.classList.add('wrong');
          qOpts.querySelector('[data-ok="true"]').classList.add('correct');
          TactileAudio.playClick();
        }
        qFeed.textContent = item.info;

        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'btn-tactile btn-accent btn-sm quiz-next';
        next.style.marginTop = '0.75rem';
        next.textContent = qIdx + 1 < questions.length ? 'Soal berikutnya →' : 'Lihat hasil →';
        next.addEventListener('click', () => {
          qIdx++;
          if (qIdx < questions.length) renderQuestion();
          else finish();
        });
        qOpts.append(next);
        next.focus();
      });
    });
  }

  renderQuestion();
})();
