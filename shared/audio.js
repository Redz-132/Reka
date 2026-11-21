const TactileAudio = (() => {
  let ctx = null;
  let muted = false;

  function initContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freq, duration, type = 'triangle', gainVal = 0.08) {
    if (muted) return;
    initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playClick() {
    playTone(340, 0.055, 'triangle', 0.09);
  }

  function playEraShift(to2035) {
    if (to2035) {
      playTone(440, 0.1, 'sine', 0.09);
      setTimeout(() => playTone(660, 0.18, 'triangle', 0.1), 80);
    } else {
      playTone(480, 0.1, 'triangle', 0.08);
      setTimeout(() => playTone(320, 0.16, 'triangle', 0.08), 80);
    }
  }

  function playTick(progressRatio = 0.5) {
    playTone(260 + progressRatio * 340, 0.04, 'sine', 0.05);
  }

  function playSuccess() {
    playTone(523.25, 0.12, 'triangle', 0.1);
    setTimeout(() => playTone(659.25, 0.14, 'triangle', 0.1), 90);
    setTimeout(() => playTone(783.99, 0.22, 'triangle', 0.11), 180);
  }

  function toggleMute() {
    muted = !muted;
    if (!muted) playClick();
    return muted;
  }

  return { playClick, playEraShift, playTick, playSuccess, toggleMute };
})();
