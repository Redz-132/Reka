(function initCommitmentCard() {
  const holdBtn = document.getElementById('hold-commit-btn');
  const holdFill = document.getElementById('hold-fill');
  const holdText = document.getElementById('hold-text');
  const confettiLayer = document.getElementById('confetti-layer');
  const canvas = document.getElementById('action-canvas');
  const nameInput = document.getElementById('user-name-input');
  const schoolInput = document.getElementById('user-school-input');
  const roleSelect = document.getElementById('user-role-select');
  const downloadBtn = document.getElementById('download-card-btn');
  const shareBtn = document.getElementById('share-card-btn');

  if (!canvas) return;

  let isCommitted = false;
  let cardTheme = 'emerald';

  const themes = {
    emerald:    { header: '#1B6B3A', header2: '#0C3F22', badge: '#F8B828', bg: '#F5F8EE', tint: 'rgba(27,107,58,0.09)', accent: '#1B6B3A' },
    terracotta: { header: '#C84B31', header2: '#8F2F1B', badge: '#F8B828', bg: '#FBF6EF', tint: 'rgba(200,75,49,0.09)',  accent: '#C84B31' },
    obsidian:   { header: '#16306B', header2: '#081838', badge: '#98D848', bg: '#F4F2EB', tint: 'rgba(8,24,56,0.07)',    accent: '#0868C8' }
  };

  const INK = '#081838';
  const MAX_HABITS = 3;
  const habitChecks = Array.from(document.querySelectorAll('.habit-check'));
  const habitCounter = document.getElementById('habit-counter');
  const habitGrid = document.querySelector('.habit-options');

  function showToast(msg) {
    let t = document.getElementById('reka-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'reka-toast';
      t.className = 'reka-toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function hashId(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 6);
  }

  function fitFont(ctx, text, maxW, size, minSize, weight, family) {
    let s = size;
    do { ctx.font = `${weight} ${s}px ${family}`; s -= 1; } while (ctx.measureText(text).width > maxW && s >= minSize);
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function initials(name) {
    const parts = name.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'RE';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  function selectedHabits() {
    return habitChecks.filter((el) => el.checked).slice(0, MAX_HABITS).map((el) => el.value);
  }

  function syncHabitUI() {
    const n = habitChecks.filter((el) => el.checked).length;
    if (habitCounter) {
      habitCounter.textContent = `${n}/${MAX_HABITS} dipilih`;
      habitCounter.classList.toggle('full', n >= MAX_HABITS);
    }
    habitChecks.forEach((el) => {
      const pill = el.closest('.habit-pill');
      if (pill) pill.classList.toggle('is-locked', n >= MAX_HABITS && !el.checked);
    });
  }

  habitChecks.forEach((cb) => {
    cb.addEventListener('change', () => {
      const n = habitChecks.filter((el) => el.checked).length;
      if (cb.checked && n > MAX_HABITS) {
        cb.checked = false;
        const pill = cb.closest('.habit-pill');
        if (pill) { pill.classList.remove('shake'); void pill.offsetWidth; pill.classList.add('shake'); }
        showToast(`Maksimal ${MAX_HABITS} fokus aksi. Lepas salah satu dulu ya.`);
      } else {
        TactileAudio.playClick();
      }
      syncHabitUI();
      saveForm();
      renderActionCard();
    });
  });
  habitChecks.filter((el) => el.checked).slice(MAX_HABITS).forEach((el) => (el.checked = false));
  syncHabitUI();

  const STORE_KEY = 'reka-paspor';
  function saveForm() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        n: nameInput.value, s: schoolInput.value, r: roleSelect ? roleSelect.selectedIndex : 0,
        t: cardTheme, h: habitChecks.map((el) => el.checked)
      }));
    } catch (e) {}
  }
  function restoreForm() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!saved) return;
      nameInput.value = saved.n || '';
      schoolInput.value = saved.s || '';
      if (roleSelect && saved.r >= 0 && saved.r < roleSelect.options.length) roleSelect.selectedIndex = saved.r;
      if (themes[saved.t]) {
        cardTheme = saved.t;
        document.querySelectorAll('.theme-dot').forEach((d) => d.classList.toggle('active', d.dataset.theme === saved.t));
      }
      if (Array.isArray(saved.h) && saved.h.length === habitChecks.length) {
        let used = 0;
        habitChecks.forEach((el, i) => { el.checked = saved.h[i] && used < MAX_HABITS; if (el.checked) used++; });
      }
      syncHabitUI();
    } catch (e) {}
  }
  restoreForm();

  function packPassport(d) {
    const raw = JSON.stringify({
      i: d.id, n: d.name, s: d.school, r: d.roleIdx, h: d.habitIdx,
      c: d.co2, p: Number(d.plastic), k: d.score, e: d.readiness, l: d.committed ? 1 : 0
    });
    return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function unpackPassport(str) {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  }

  function baseUrl() {
    const meta = document.querySelector('meta[name="reka-url"]');
    const fromMeta = meta && meta.content.trim();
    if (fromMeta) return fromMeta.split('#')[0];
    const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
    if (/^https?:$/.test(location.protocol) && !local) return location.origin + location.pathname;
    return null;
  }

  function buildPayload(d) {
    const base = baseUrl();
    if (base) return `${base}#paspor=${packPassport(d)}`;
    const roleClean = d.role.replace(/[^\p{L}\p{N} ]/gu, '').trim();
    return [
      `REKA 2035 | ID ${d.id}`,
      `${d.name} - ${d.school}`,
      roleClean,
      `Fokus: ${d.habits.length ? d.habits.join(', ') : '-'}`,
      `CO2 -${d.co2}kg | Plastik -${d.plastic}kg | Skor ${d.score}/100 | Sekolah ${d.readiness}%`,
      `Status: ${d.committed ? 'Terkunci' : 'pratinjau'}`
    ].join('\n');
  }

  function drawQR(ctx, text, x, y, size) {
    const qr = window.RekaQR(text, 'M');
    const n = qr.getModuleCount();
    const quiet = 4;
    const cell = Math.max(2, Math.floor(size / (n + quiet * 2)));
    const total = (n + quiet * 2) * cell;
    const ox = x + Math.floor((size - total) / 2);
    const oy = y + Math.floor((size - total) / 2);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#111111';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(ox + (c + quiet) * cell, oy + (r + quiet) * cell, cell, cell);
      }
    }
    ctx.restore();
  }

  const logoImg = new Image();
  let logoReady = false;
  if (window.REKA_LOGO) {
    logoImg.onload = () => { logoReady = true; renderActionCard(); };
    logoImg.src = window.REKA_LOGO;
  }

  const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';
  const MONO = '"JetBrains Mono", monospace';

  function renderActionCard() {
    const ctx = canvas.getContext('2d');
    const W = 600, H = 380;
    const palette = themes[cardTheme] || themes.emerald;
    const userName = (nameInput.value.trim() || 'Pelajar Inovator').toUpperCase();
    const userSchool = (schoolInput.value.trim() || 'Sekolah Penggerak Sirkular').toUpperCase();
    const userRole = roleSelect ? roleSelect.value : 'Pionir Energi Surya';
    const habits = selectedHabits();

    const co2 = typeof SimulatorState !== 'undefined' ? SimulatorState.co2Saved : 420;
    const plastic = typeof SimulatorState !== 'undefined' ? SimulatorState.plasticSaved : 14.5;
    const score = typeof SimulatorState !== 'undefined' ? SimulatorState.score : 52;
    const readiness = typeof ReadinessState !== 'undefined' ? ReadinessState.percent : 33;
    const id = 'RE35-' + hashId(userName + userSchool + userRole + habits.join('|'));
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const sx = canvas.width / W;
    ctx.setTransform(sx, 0, 0, sx, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    rr(ctx, 4, 4, W - 8, H - 8, 20);
    ctx.clip();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = palette.tint;
    for (let gx = 12; gx < W; gx += 16) for (let gy = 70; gy < H; gy += 16) ctx.fillRect(gx, gy, 2, 2);
    ctx.strokeStyle = palette.tint;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(W + 10, H + 10, 80 + i * 26, Math.PI, Math.PI * 1.5); ctx.stroke(); }

    const hg = ctx.createLinearGradient(0, 0, W, 0);
    hg.addColorStop(0, palette.header);
    hg.addColorStop(1, palette.header2);
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, 66);
    rr(ctx, 16, 9, 82, 48, 10);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke();
    if (logoReady) {
      const lh = 40, lw = lh * (logoImg.width / logoImg.height);
      ctx.drawImage(logoImg, 16 + (82 - lw) / 2, 13, lw, lh);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 17px ${SANS}`;
    ctx.fillText('Paspor aksi REKA', 112, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = `700 10px ${MONO}`;
    ctx.fillText('Rancang hari esok · 2026 → 2035', 112, 48);

    ctx.font = `700 10.5px ${MONO}`;
    const idW = ctx.measureText(id).width + 20;
    rr(ctx, W - 24 - idW, 21, idW, 24, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(id, W - 24 - idW + 10, 37);

    const sg = ctx.createLinearGradient(0, 0, W, 0);
    sg.addColorStop(0, palette.badge); sg.addColorStop(0.5, '#FFFFFF'); sg.addColorStop(1, palette.badge);
    ctx.fillStyle = sg;
    ctx.fillRect(0, 66, W, 5);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 71, W, 1);

    ctx.fillStyle = palette.badge;
    ctx.beginPath(); ctx.arc(62, 124, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = palette.header; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(62, 124, 40, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    ctx.font = `800 26px ${SANS}`;
    ctx.fillText(initials(userName), 62, 133);
    ctx.textAlign = 'left';

    const textX = 114, textMax = 282;
    ctx.fillStyle = INK;
    fitFont(ctx, userName, textMax, 24, 13, 800, SANS);
    ctx.fillText(userName, textX, 112);
    ctx.fillStyle = '#4A5470';
    fitFont(ctx, userSchool, textMax, 12, 8, 700, MONO);
    ctx.fillText(userSchool, textX, 131);

    ctx.font = `800 11px ${MONO}`;
    const roleW = Math.min(textMax, ctx.measureText(userRole).width + 24);
    rr(ctx, textX, 141, roleW, 24, 12);
    ctx.fillStyle = palette.badge; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = INK;
    ctx.fillText(userRole, textX + 12, 157);

    const tiles = [
      { l: 'CO₂ hemat', v: `-${co2} kg`, p: null },
      { l: 'Plastik', v: `-${plastic} kg`, p: null },
      { l: 'Skor eko', v: `${score}/100`, p: score / 100 },
      { l: 'Sekolah', v: `${readiness}%`, p: readiness / 100 }
    ];
    const tw = 88, tg = 8, ty = 182, th = 54;
    tiles.forEach((t, i) => {
      const tx = 24 + i * (tw + tg);
      rr(ctx, tx, ty, tw, th, 10);
      ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#4A5470'; ctx.font = `700 8.5px ${MONO}`;
      ctx.fillText(t.l, tx + 9, ty + 16);
      ctx.fillStyle = palette.accent;
      fitFont(ctx, t.v, tw - 16, 15, 10, 800, SANS);
      ctx.fillText(t.v, tx + 9, ty + 36);
      if (t.p !== null) {
        ctx.fillStyle = 'rgba(24,24,27,0.12)'; ctx.fillRect(tx + 9, ty + 43, tw - 18, 5);
        ctx.fillStyle = palette.badge; ctx.fillRect(tx + 9, ty + 43, (tw - 18) * Math.max(0, Math.min(1, t.p)), 5);
      }
    });

    ctx.fillStyle = '#4A5470'; ctx.font = `800 9.5px ${MONO}`;
    ctx.fillText(`Fokus aksi harian (${habits.length}/${MAX_HABITS})`, 24, 258);
    ctx.fillStyle = INK;
    ctx.fillRect(24, 262, 372, 1.5);
    if (!habits.length) {
      ctx.fillStyle = '#4A5470'; ctx.font = `700 12.5px ${SANS}`;
      ctx.fillText('Belum ada fokus aksi dipilih.', 24, 284);
    } else {
      habits.forEach((h, i) => {
        const cy = 282 + i * 24;
        ctx.fillStyle = palette.badge;
        ctx.beginPath(); ctx.arc(32, cy - 4, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(28, cy - 4); ctx.lineTo(31, cy - 1); ctx.lineTo(36, cy - 8); ctx.stroke();
        ctx.fillStyle = INK;
        fitFont(ctx, h, 340, 13, 9, 700, SANS);
        ctx.fillText(h, 48, cy);
      });
    }

    const qx = 412, qy = 88, qs = 164;
    rr(ctx, qx - 6, qy - 6, qs + 12, qs + 34, 14);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    ctx.font = `800 9.5px ${MONO}`;
    ctx.fillText('Scan paspor', qx + qs / 2, qy + qs + 14);
    ctx.textAlign = 'left';

    const habitIdx = habitChecks.reduce((arr, el, i) => (el.checked && arr.length < MAX_HABITS ? arr.concat(i) : arr), []);
    const payload = buildPayload({
      id, name: userName, school: userSchool, role: userRole, roleIdx: roleSelect ? roleSelect.selectedIndex : 0,
      habits, habitIdx, co2, plastic, score, readiness, committed: isCommitted
    });
    ctx.save();
    drawQR(ctx, payload, qx * sx, qy * sx, qs * sx);
    ctx.restore();
    ctx.setTransform(sx, 0, 0, sx, 0, 0);

    ctx.save();
    ctx.translate(494, 318);
    ctx.rotate(-0.18);
    ctx.font = `800 11px ${MONO}`;
    const stampText = isCommitted ? 'TERVERIFIKASI' : 'PRATINJAU';
    const stW = ctx.measureText(stampText).width + 22;
    rr(ctx, -stW / 2, -14, stW, 28, 7);
    ctx.setLineDash(isCommitted ? [] : [5, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isCommitted ? '#1B6B3A' : '#71717A';
    ctx.fillStyle = isCommitted ? 'rgba(27,107,58,0.12)' : 'rgba(113,113,122,0.08)';
    ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isCommitted ? '#1B6B3A' : '#71717A';
    ctx.textAlign = 'center';
    ctx.fillText(stampText, 0, 4);
    ctx.restore();

    ctx.fillStyle = INK;
    ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = '#FFFFFF'; ctx.font = `700 9.5px ${MONO}`;
    ctx.fillText(`Terbit ${today} · berlaku hingga 2035`, 24, H - 11);
    ctx.textAlign = 'right';
    ctx.fillStyle = palette.badge;
    ctx.fillText(isCommitted ? 'Komitmen terkunci' : 'Tahan tombol untuk mengunci', W - 24, H - 11);
    ctx.textAlign = 'left';
    ctx.restore();

    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    rr(ctx, 4, 4, W - 8, H - 8, 20);
    ctx.stroke();
  }

  renderActionCard();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderActionCard);
  [nameInput, schoolInput].forEach((inp) => inp && inp.addEventListener('input', () => { saveForm(); renderActionCard(); }));
  if (roleSelect) roleSelect.addEventListener('change', () => { TactileAudio.playClick(); saveForm(); renderActionCard(); });

  document.querySelectorAll('.theme-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.theme-dot').forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');
      cardTheme = dot.dataset.theme;
      saveForm();
      TactileAudio.playClick();
      renderActionCard();
    });
  });

  window.addEventListener('reka:sim-updated', renderActionCard);

  function spawnLeafBurst(originX, originY) {
    if (!confettiLayer) return;
    const colors = ['#0868C8', '#98D848', '#F8B828', '#1B6B3A'];
    for (let i = 0; i < 28; i++) {
      const leaf = document.createElement('div');
      const angle = (Math.PI * 2 * i) / 28;
      const velocity = 95 + Math.random() * 145;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity - 60;
      const color = colors[i % colors.length];

      leaf.style.cssText = `
        position: fixed;
        left: ${originX}px;
        top: ${originY}px;
        width: 14px;
        height: 14px;
        background: ${color};
        border: 1px solid #081838;
        border-radius: 0 12px 0 12px;
        transition: transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.85s ease;
      `;
      confettiLayer.appendChild(leaf);

      requestAnimationFrame(() => {
        leaf.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random() * 360}deg)`;
        leaf.style.opacity = '0';
      });

      setTimeout(() => leaf.remove(), 900);
    }
  }

  const HOLD_DURATION = 1500;
  let holding = false;
  let startTime = 0;
  let rafId = null;
  let lastTickStep = 0;

  function updateHold(timestamp) {
    if (!holding) return;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / HOLD_DURATION, 1);
    const percent = Math.round(progress * 100);

    holdFill.style.width = `${percent}%`;
    holdText.textContent = `MENGUNCI KOMITMEN... ${percent}%`;

    const currentStep = Math.floor(progress * 8);
    if (currentStep > lastTickStep) {
      lastTickStep = currentStep;
      TactileAudio.playTick(progress);
    }

    if (progress < 1) {
      rafId = requestAnimationFrame(updateHold);
    } else {
      holding = false;
      isCommitted = true;
      holdBtn.classList.add('committed');
      holdText.textContent = 'Komitmen terkunci. Kartu siap diunduh';
      TactileAudio.playSuccess();
      renderActionCard();

      const rect = holdBtn.getBoundingClientRect();
      spawnLeafBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }

  function startHold(e) {
    if (isCommitted || holding) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    holding = true;
    startTime = performance.now();
    lastTickStep = 0;
    holdBtn.classList.remove('committed');
    rafId = requestAnimationFrame(updateHold);
  }

  function cancelHold() {
    if (!holding) return;
    holding = false;
    cancelAnimationFrame(rafId);
    holdFill.style.width = '0%';
    holdText.textContent = 'Tekan dan tahan 1,5 detik untuk mengunci';
  }

  holdBtn.addEventListener('pointerdown', startHold);
  window.addEventListener('pointerup', cancelHold);
  window.addEventListener('pointercancel', cancelHold);

  holdBtn.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold({ type: 'key' }); }
  });
  holdBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') cancelHold(); });
  holdBtn.addEventListener('contextmenu', (e) => e.preventDefault());

  downloadBtn.addEventListener('click', () => {
    if (!lockedOrWarn()) return;
    const link = document.createElement('a');
    const slug = (nameInput.value.trim() || 'pelajar').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    link.download = `Paspor-Aksi-Reka-Esok-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  function lockedOrWarn() {
    if (isCommitted) return true;
    showToast('Kunci komitmen dulu: tekan & tahan tombol 1,5 detik.');
    holdBtn.classList.remove('shake'); void holdBtn.offsetWidth; holdBtn.classList.add('shake');
    holdBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (!lockedOrWarn()) return;
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'paspor-aksi-reka-esok.png', { type: 'image/png' });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Paspor Aksi REKA', text: 'Ini komitmen aksiku untuk 2035.' });
            return;
          }
        } catch (e) {
          if (e && e.name === 'AbortError') return;
        }
        downloadBtn.click();
        showToast('Perangkat ini belum bisa berbagi langsung, kartu diunduh saja.');
      }, 'image/png');
    });
  }

  function showVerification(data) {
    const roles = roleSelect ? Array.from(roleSelect.options).map((o) => o.value) : [];
    const habitsAll = habitChecks.map((el) => el.value);
    const row = (label, value) => {
      const r = document.createElement('div');
      r.className = 'verify-row';
      const a = document.createElement('span'); a.textContent = label;
      const b = document.createElement('strong'); b.textContent = value;
      r.append(a, b);
      return r;
    };
    const wrap = document.createElement('div');
    wrap.className = 'verify-overlay';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Verifikasi Paspor Aksi');
    const box = document.createElement('div');
    box.className = 'verify-box';
    const tag = document.createElement('span');
    tag.className = 'mono-tag';
    tag.textContent = data.l ? 'Paspor terverifikasi' : 'paspor belum dikunci';
    const h = document.createElement('h3');
    h.textContent = String(data.n || '-');
    box.append(tag, h,
      row('Sekolah', String(data.s || '-')),
      row('Peran', roles[data.r] || '-'),
      row('Fokus aksi', (data.h || []).map((i) => habitsAll[i]).filter(Boolean).join(', ') || '-'),
      row('Dampak', `-${data.c} kg CO2, -${data.p} kg plastik`),
      row('Skor / Kesiapan', `${data.k}/100 / ${data.e}%`),
      row('ID', String(data.i || '-')));
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-tactile btn-primary btn-sm';
    close.textContent = 'Tutup & jelajahi situs';
    close.addEventListener('click', () => { wrap.remove(); history.replaceState(null, '', location.pathname + location.search); });
    box.append(close);
    wrap.append(box);
    document.body.append(wrap);
    close.focus();
  }

  if (location.hash.startsWith('#paspor=')) {
    try { showVerification(unpackPassport(location.hash.slice(8))); } catch (e) {}
  }

  canvas.addEventListener('click', () => {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
    const box = document.createElement('div');
    box.className = 'card-lightbox';
    const tip = document.createElement('p');
    tip.textContent = 'Miringkan HP ke kiri supaya kartu terbaca tegak';
    const img = document.createElement('img');
    img.alt = 'Paspor Aksi ukuran penuh';
    img.src = canvas.toDataURL('image/png');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-tactile btn-secondary btn-sm';
    btn.textContent = 'Tutup';
    btn.addEventListener('click', () => box.remove());
    box.addEventListener('click', (e) => { if (e.target === box) box.remove(); });
    box.append(tip, img, btn);
    document.body.append(box);
    btn.focus();
  });
})();
