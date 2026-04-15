/* ============================================
   SOUND — Web Audio API synthesized effects
   ============================================ */

const Sound = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function toggle() {
    enabled = !enabled;
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  // ---- HELPERS ----
  function playTone(freq, duration, type, volume, delay) {
    if (!enabled) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.15;

    osc.connect(gain);
    gain.connect(c.destination);

    const startTime = c.currentTime + (delay || 0);
    osc.start(startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.stop(startTime + duration);
  }

  function playNoise(duration, volume) {
    if (!enabled) return;
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = c.createBufferSource();
    noise.buffer = buffer;

    const gain = c.createGain();
    gain.gain.value = volume || 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

    noise.connect(gain);
    gain.connect(c.destination);
    noise.start();
  }

  // ---- GAME SOUNDS ----

  // Countdown tick (3, 2, 1)
  function countdownTick() {
    playTone(440, 0.1, 'square', 0.1);
  }

  // Cast alert — higher pitch
  function castAlert() {
    playTone(660, 0.08, 'square', 0.12);
    playTone(880, 0.12, 'square', 0.12, 0.08);
  }

  // Spell locked in — confirmation blip
  function spellLocked() {
    playTone(520, 0.06, 'sine', 0.15);
    playTone(780, 0.1, 'sine', 0.15, 0.06);
  }

  // Spell reveal
  function spellReveal() {
    playTone(330, 0.08, 'triangle', 0.12);
    playTone(440, 0.08, 'triangle', 0.1, 0.06);
  }

  // Clash — big dramatic impact
  function clash() {
    if (!enabled) return;
    const c = getCtx();

    // Heavy bass boom
    const bass = c.createOscillator();
    const bassGain = c.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(150, c.currentTime);
    bass.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.3);
    bassGain.gain.setValueAtTime(0.25, c.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    bass.connect(bassGain);
    bassGain.connect(c.destination);
    bass.start();
    bass.stop(c.currentTime + 0.35);

    // Noise burst (explosion crunch)
    const bufferSize = c.sampleRate * 0.2;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.2, c.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    noise.connect(noiseGain);
    noiseGain.connect(c.destination);
    noise.start();

    // Sharp metallic ring
    const ring = c.createOscillator();
    const ringGain = c.createGain();
    ring.type = 'square';
    ring.frequency.setValueAtTime(800, c.currentTime);
    ring.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15);
    ringGain.gain.setValueAtTime(0.1, c.currentTime);
    ringGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    ring.connect(ringGain);
    ringGain.connect(c.destination);
    ring.start();
    ring.stop(c.currentTime + 0.2);

    // High shimmer tail
    playTone(1200, 0.15, 'sine', 0.04, 0.05);
    playTone(900, 0.2, 'sine', 0.03, 0.1);
  }

  // Damage hit
  function damage() {
    playNoise(0.1, 0.12);
    playTone(100, 0.15, 'square', 0.1);
    playTone(80, 0.2, 'square', 0.08, 0.05);
  }

  // Heal chime — pleasant ascending
  function heal() {
    playTone(440, 0.12, 'sine', 0.1);
    playTone(554, 0.12, 'sine', 0.1, 0.1);
    playTone(659, 0.15, 'sine', 0.1, 0.2);
  }

  // Win fanfare
  function win() {
    playTone(523, 0.15, 'square', 0.1);
    playTone(659, 0.15, 'square', 0.1, 0.15);
    playTone(784, 0.15, 'square', 0.1, 0.3);
    playTone(1047, 0.3, 'square', 0.12, 0.45);
  }

  // Lose sound — descending
  function lose() {
    playTone(400, 0.2, 'sawtooth', 0.1);
    playTone(300, 0.2, 'sawtooth', 0.1, 0.2);
    playTone(200, 0.4, 'sawtooth', 0.08, 0.4);
  }

  // Fizzle — failed to cast
  function fizzle() {
    playTone(200, 0.15, 'sawtooth', 0.06);
    playTone(150, 0.2, 'sawtooth', 0.05, 0.1);
  }

  return {
    toggle, isEnabled,
    countdownTick, castAlert, spellLocked, spellReveal,
    clash, damage, heal, win, lose, fizzle
  };
})();
