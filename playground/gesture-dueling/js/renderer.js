/* ============================================
   RENDERER
   Wizard sprite, spell effects, particles
   ============================================ */

const Renderer = (() => {
  let wizardCanvas, wizardCtx;
  let effectsCanvas, effectsCtx;
  let particles = [];
  let animationFrame = null;
  let wizardState = 'idle';
  let chargeStartTime = 0;

  function init() {
    wizardCanvas = document.getElementById('wizard-canvas');
    wizardCtx = wizardCanvas.getContext('2d');
    effectsCanvas = document.getElementById('effects-canvas');
    effectsCtx = effectsCanvas.getContext('2d');

    resizeEffectsCanvas();
    window.addEventListener('resize', resizeEffectsCanvas);

    startRenderLoop();
  }

  function resizeEffectsCanvas() {
    effectsCanvas.width = window.innerWidth;
    effectsCanvas.height = window.innerHeight;
  }

  // ---- PIXEL WIZARD (detailed, blue robes, amber staff) ----
  // Staff orb position (used by cast/charge effects)
  const STAFF_ORB_X = -20;
  const STAFF_ORB_Y = -108;

  function drawWizard() {
    const w = wizardCanvas.width = wizardCanvas.clientWidth;
    const h = wizardCanvas.height = wizardCanvas.clientHeight;
    const c = wizardCtx;

    c.clearRect(0, 0, w, h);

    const cx = w / 2 + 5;
    const baseY = h * 0.92;
    const scale = Math.min(w, h) / 180;
    const bobOffset = Math.sin(Date.now() / 600) * 1.5 * scale;

    // Hit shake
    let shakeX = 0, shakeY = 0;
    if (wizardState === 'hit') {
      shakeX = (Math.random() - 0.5) * 8 * scale;
      shakeY = (Math.random() - 0.5) * 4 * scale;
    }

    c.save();
    c.translate(cx + shakeX, baseY + bobOffset + shakeY);
    c.scale(scale, scale);

    // Shadow
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.ellipse(0, 2, 22, 4, 0, 0, Math.PI * 2);
    c.fill();

    // ---- STAFF (left side, held by left hand) ----
    // Staff shaft — dark wood with grain
    c.fillStyle = '#5a3820';
    c.fillRect(-21, -100, 3, 100);
    // Wood grain highlights
    c.fillStyle = '#6b4428';
    c.fillRect(-20, -90, 1, 8);
    c.fillRect(-20, -70, 1, 6);
    c.fillRect(-20, -50, 1, 10);
    c.fillRect(-20, -30, 1, 5);
    // Staff top — curved hook
    c.fillStyle = '#4a2c18';
    c.fillRect(-21, -104, 3, 5);
    c.fillRect(-19, -107, 3, 4);
    c.fillRect(-17, -109, 4, 3);
    c.fillRect(-14, -110, 3, 3);
    // Staff base — metal tip
    c.fillStyle = '#666';
    c.fillRect(-21, -1, 3, 3);
    c.fillStyle = '#888';
    c.fillRect(-20, 0, 1, 2);

    // Staff wrapping (leather bands)
    c.fillStyle = '#4a3018';
    c.fillRect(-22, -62, 5, 2);
    c.fillRect(-22, -58, 5, 2);

    // ---- STAFF ORB ----
    let orbSize = 5;
    let orbGlowSize = 10;
    let orbAlpha = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    let orbR = 240, orbG = 160, orbB = 48;

    if (wizardState === 'charging') {
      const elapsed = (Date.now() - chargeStartTime) / 3000;
      const charge = Math.min(elapsed, 1);
      orbSize = 5 + charge * 6;
      orbGlowSize = 10 + charge * 14;
      orbAlpha = 0.7 + charge * 0.3;
      orbR = 240 + charge * 15;
      orbG = 160 + charge * 60;
      orbB = 48 + charge * 30;

      if (charge > 0.5) {
        const sh = (charge - 0.5) * 3;
        c.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
      }

      if (charge > 0.2) {
        const sparkCount = Math.floor(charge * 7);
        for (let i = 0; i < sparkCount; i++) {
          const angle = (Date.now() / 180 + i * 0.9) % (Math.PI * 2);
          const radius = orbGlowSize + Math.sin(Date.now() / 100 + i) * 4;
          const sx = STAFF_ORB_X + Math.cos(angle) * radius;
          const sy = STAFF_ORB_Y + Math.sin(angle) * radius;
          c.fillStyle = `rgba(255, 200, 60, ${charge * 0.8})`;
          c.fillRect(sx - 1, sy - 1, 2, 2);
        }
      }
    }

    // Orb outer glow
    c.fillStyle = `rgba(${orbR}, ${orbG}, ${orbB}, ${orbAlpha * 0.12})`;
    c.beginPath();
    c.arc(STAFF_ORB_X, STAFF_ORB_Y, orbGlowSize + 4, 0, Math.PI * 2);
    c.fill();
    // Orb glow
    c.fillStyle = `rgba(${orbR}, ${orbG}, ${orbB}, ${orbAlpha * 0.25})`;
    c.beginPath();
    c.arc(STAFF_ORB_X, STAFF_ORB_Y, orbGlowSize, 0, Math.PI * 2);
    c.fill();
    // Orb core
    c.fillStyle = `rgba(${orbR}, ${orbG}, ${orbB}, ${orbAlpha})`;
    c.beginPath();
    c.arc(STAFF_ORB_X, STAFF_ORB_Y, orbSize, 0, Math.PI * 2);
    c.fill();
    // Orb highlight
    c.fillStyle = `rgba(255, 240, 200, ${orbAlpha * 0.5})`;
    c.beginPath();
    c.arc(STAFF_ORB_X - 1, STAFF_ORB_Y - 2, orbSize * 0.4, 0, Math.PI * 2);
    c.fill();

    // ---- BOOTS ----
    c.fillStyle = '#3a2010';
    c.fillRect(-10, -6, 8, 6);
    c.fillRect(2, -6, 8, 6);
    // Boot soles
    c.fillStyle = '#2a1808';
    c.fillRect(-11, -1, 10, 2);
    c.fillRect(1, -1, 10, 2);
    // Boot tops
    c.fillStyle = '#4a2c16';
    c.fillRect(-10, -10, 8, 4);
    c.fillRect(2, -10, 8, 4);

    // ---- ROBE — main body (dark blue inner) ----
    c.fillStyle = '#1a2a42';
    c.beginPath();
    c.moveTo(-14, -52);
    c.lineTo(-18, -10);
    c.lineTo(16, -10);
    c.lineTo(12, -52);
    c.fill();

    // Robe bottom flare
    c.fillStyle = '#162238';
    c.beginPath();
    c.moveTo(-18, -10);
    c.lineTo(-22, -1);
    c.lineTo(20, -1);
    c.lineTo(16, -10);
    c.fill();

    // Inner robe folds (lighter blue)
    c.fillStyle = '#243a58';
    c.beginPath();
    c.moveTo(-4, -52);
    c.lineTo(-8, -10);
    c.lineTo(6, -10);
    c.lineTo(4, -52);
    c.fill();

    // Fold shadow lines
    c.fillStyle = '#142030';
    c.fillRect(-12, -45, 1, 35);
    c.fillRect(8, -48, 1, 38);
    c.fillRect(-1, -50, 1, 40);

    // ---- OUTER CLOAK (slightly lighter, draped over shoulders) ----
    // Left cloak drape
    c.fillStyle = '#1e3050';
    c.beginPath();
    c.moveTo(-16, -56);
    c.lineTo(-24, -20);
    c.lineTo(-20, -10);
    c.lineTo(-14, -52);
    c.fill();

    // Right cloak drape
    c.beginPath();
    c.moveTo(14, -56);
    c.lineTo(20, -20);
    c.lineTo(18, -10);
    c.lineTo(12, -52);
    c.fill();

    // Cloak highlight edges
    c.fillStyle = '#2a4068';
    c.fillRect(-16, -54, 2, 30);
    c.fillRect(13, -54, 2, 30);

    // ---- SHOULDERS ----
    c.fillStyle = '#1e3050';
    c.beginPath();
    c.moveTo(-18, -56);
    c.quadraticCurveTo(-20, -60, -16, -62);
    c.lineTo(14, -62);
    c.quadraticCurveTo(18, -60, 16, -56);
    c.lineTo(-18, -56);
    c.fill();

    // Shoulder detail
    c.fillStyle = '#2a4068';
    c.fillRect(-16, -62, 30, 2);

    // ---- LEFT ARM (holding staff) ----
    c.fillStyle = '#1a2a42';
    c.beginPath();
    c.moveTo(-16, -58);
    c.lineTo(-24, -50);
    c.lineTo(-24, -44);
    c.lineTo(-18, -42);
    c.lineTo(-14, -52);
    c.fill();
    // Left hand (on staff)
    c.fillStyle = '#d4b896';
    c.fillRect(-23, -48, 4, 5);

    // ---- RIGHT ARM (resting) ----
    c.fillStyle = '#1a2a42';
    c.beginPath();
    c.moveTo(14, -58);
    c.lineTo(20, -48);
    c.lineTo(18, -42);
    c.lineTo(12, -46);
    c.fill();
    // Sleeve cuff
    c.fillStyle = '#2a4068';
    c.fillRect(16, -44, 4, 2);
    // Right hand
    c.fillStyle = '#d4b896';
    c.fillRect(17, -42, 3, 4);

    // ---- BELT ----
    c.fillStyle = '#5a3a1a';
    c.fillRect(-13, -32, 24, 3);
    // Belt buckle
    c.fillStyle = '#c9a84c';
    c.fillRect(-3, -33, 5, 5);
    c.fillStyle = '#a8883c';
    c.fillRect(-2, -32, 3, 3);
    // Belt pouch
    c.fillStyle = '#4a2c14';
    c.fillRect(6, -30, 5, 6);
    c.fillStyle = '#5a3820';
    c.fillRect(7, -30, 3, 2);

    // ---- HEAD ----
    c.fillStyle = '#d4b896';
    c.fillRect(-7, -72, 13, 14);
    // Cheeks (slightly pink)
    c.fillStyle = '#daa888';
    c.fillRect(-6, -64, 3, 2);
    c.fillRect(4, -64, 3, 2);

    // Ears
    c.fillStyle = '#c4a882';
    c.fillRect(-8, -68, 2, 4);
    c.fillRect(6, -68, 2, 4);

    // ---- EYES ----
    const blinkCycle = Math.floor(Date.now() / 3500) % 25;
    if (blinkCycle === 0) {
      c.fillStyle = '#1a1a2a';
      c.fillRect(-5, -67, 4, 1);
      c.fillRect(2, -67, 4, 1);
    } else {
      // Eye whites
      c.fillStyle = '#e8e8ee';
      c.fillRect(-5, -69, 4, 4);
      c.fillRect(2, -69, 4, 4);
      // Irises (blue)
      c.fillStyle = '#3366aa';
      c.fillRect(-4, -68, 3, 3);
      c.fillRect(3, -68, 3, 3);
      // Pupils
      c.fillStyle = '#111122';
      c.fillRect(-3, -67, 2, 2);
      c.fillRect(4, -67, 2, 2);
      // Eye shine
      c.fillStyle = '#ffffff';
      c.fillRect(-4, -69, 1, 1);
      c.fillRect(3, -69, 1, 1);
      // Eyebrows
      c.fillStyle = '#555566';
      c.fillRect(-6, -71, 5, 1);
      c.fillRect(2, -71, 5, 1);
    }

    // Nose
    c.fillStyle = '#c4a882';
    c.fillRect(-1, -65, 3, 3);
    c.fillStyle = '#b8987a';
    c.fillRect(0, -64, 1, 2);

    // Mouth
    c.fillStyle = '#a08060';
    c.fillRect(-2, -60, 5, 1);

    // ---- BEARD (grey, long, detailed) ----
    c.fillStyle = '#aaaaae';
    c.fillRect(-6, -59, 12, 5);
    // Beard body
    c.fillStyle = '#999';
    c.fillRect(-7, -54, 13, 5);
    c.fillStyle = '#888';
    c.fillRect(-6, -49, 11, 5);
    c.fillRect(-5, -44, 9, 4);
    c.fillRect(-4, -40, 7, 3);
    c.fillRect(-3, -37, 5, 3);
    c.fillRect(-2, -34, 3, 2);
    // Beard highlights
    c.fillStyle = '#bbbbbc';
    c.fillRect(-4, -57, 2, 3);
    c.fillRect(2, -55, 2, 4);
    c.fillRect(-2, -48, 1, 6);
    // Beard dark folds
    c.fillStyle = '#777';
    c.fillRect(3, -52, 1, 8);
    c.fillRect(-5, -50, 1, 6);

    // ---- HAT (tall, curved, dark blue) ----
    // Brim
    c.fillStyle = '#1a2540';
    c.fillRect(-15, -74, 28, 4);
    // Brim edge
    c.fillStyle = '#253555';
    c.fillRect(-15, -74, 28, 1);
    // Brim underside shadow
    c.fillStyle = '#0f1a2e';
    c.fillRect(-14, -71, 26, 1);

    // Hat body — wide base tapering to curved tip
    c.fillStyle = '#1a2540';
    c.beginPath();
    c.moveTo(-12, -74);
    c.lineTo(-9, -88);
    c.lineTo(-6, -100);
    c.lineTo(-4, -110);
    c.quadraticCurveTo(-2, -120, 4, -124);
    c.lineTo(6, -120);
    c.quadraticCurveTo(2, -112, 0, -100);
    c.lineTo(2, -90);
    c.lineTo(10, -74);
    c.fill();

    // Hat lighter panel
    c.fillStyle = '#223456';
    c.beginPath();
    c.moveTo(-8, -74);
    c.lineTo(-5, -88);
    c.lineTo(-3, -100);
    c.lineTo(-1, -108);
    c.lineTo(1, -100);
    c.lineTo(2, -88);
    c.lineTo(6, -74);
    c.fill();

    // Hat dark fold
    c.fillStyle = '#111d30';
    c.fillRect(-10, -82, 2, 8);
    c.fillRect(6, -80, 2, 6);

    // Hat band
    c.fillStyle = '#5a3a1a';
    c.fillRect(-12, -78, 22, 3);
    // Band buckle
    c.fillStyle = '#c9a84c';
    c.fillRect(2, -79, 3, 4);

    // ---- CAST — spell fires from staff orb ----
    if (wizardState === 'cast') {
      const castGlow = Math.sin(Date.now() / 80) * 0.4 + 0.6;
      // Big flash at orb
      c.fillStyle = `rgba(255, 220, 100, ${castGlow * 0.4})`;
      c.beginPath();
      c.arc(STAFF_ORB_X, STAFF_ORB_Y, 14, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = `rgba(255, 240, 180, ${castGlow})`;
      c.beginPath();
      c.arc(STAFF_ORB_X, STAFF_ORB_Y, 6, 0, Math.PI * 2);
      c.fill();
      // Burst sparks from orb
      for (let i = 0; i < 8; i++) {
        const angle = (Date.now() / 80 + i * 0.785) % (Math.PI * 2);
        const dist = 10 + Math.sin(Date.now() / 60 + i) * 6;
        const sx = STAFF_ORB_X + Math.cos(angle) * dist;
        const sy = STAFF_ORB_Y + Math.sin(angle) * dist;
        c.fillStyle = `rgba(255, 200, 60, ${castGlow * 0.8})`;
        c.fillRect(Math.floor(sx) - 1, Math.floor(sy) - 1, 2, 2);
      }
    }

    // ---- CHARGING — arm gesture + orb builds ----
    if (wizardState === 'charging') {
      const elapsed = (Date.now() - chargeStartTime) / 3000;
      const charge = Math.min(elapsed, 1);
      // Right arm lifts toward staff
      c.fillStyle = '#1a2a42';
      const armY = -48 - charge * 10;
      c.fillRect(12, armY, 10, 4);
      c.fillStyle = '#d4b896';
      c.fillRect(10, armY - 1, 3, 4);
    }

    // ---- HIT — shake + white flicker ----
    if (wizardState === 'hit') {
      // Rapid blink: every ~80ms toggle between visible and white flash
      const hitPhase = Math.floor(Date.now() / 80) % 3;
      if (hitPhase === 0) {
        // White flash over the wizard
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = '#ffffff';
        c.fillRect(-30, -130, 60, 135);
        c.globalCompositeOperation = 'source-over';
      } else if (hitPhase === 1) {
        // Invisible blink
        c.clearRect(-30, -130, 60, 135);
      }
      // phase 2 = normal (wizard visible as-is)
    }

    c.restore();
  }

  function setWizardState(newState) {
    wizardState = newState;
    if (newState === 'charging') {
      chargeStartTime = Date.now();
    } else if (newState === 'hit') {
      setTimeout(() => { wizardState = 'idle'; }, 500);
    } else if (newState === 'cast') {
      setTimeout(() => { wizardState = 'idle'; }, 1000);
    }
  }

  // ---- SPELL PARTICLES ----
  function spawnSpellEffect(spell, side) {
    const startX = side === 'left' ? window.innerWidth * 0.25 : window.innerWidth * 0.75;
    const startY = window.innerHeight * 0.45;

    const colors = {
      fire: ['#ff6b35', '#ff4500', '#ffaa00', '#ff2200'],
      shield: ['#4a9eff', '#2070ff', '#88bbff', '#ffffff'],
      lightning: ['#c77dff', '#9d4edd', '#e0aaff', '#ffffff'],
      heal: ['#50fa7b', '#00cc44', '#88ffaa', '#ffffff'],
      none: ['#555', '#333', '#666']
    };

    const spellColors = colors[spell] || colors.none;
    const count = spell === 'none' ? 8 : 25;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: startX + (Math.random() - 0.5) * 50,
        y: startY + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1.5,
        size: Math.random() * 3 + 1.5,
        color: spellColors[Math.floor(Math.random() * spellColors.length)],
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
        spell
      });
    }

    if (spell === 'fire') {
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: startX + (Math.random() - 0.5) * 25,
          y: startY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 5 - 1.5,
          size: Math.random() * 4 + 2,
          color: spellColors[Math.floor(Math.random() * spellColors.length)],
          life: 1,
          decay: 0.015,
          spell
        });
      }
    } else if (spell === 'lightning') {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2 + 1,
          color: '#c77dff',
          life: 1,
          decay: 0.03,
          spell
        });
      }
    } else if (spell === 'shield') {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        particles.push({
          x: startX + Math.cos(angle) * 35,
          y: startY + Math.sin(angle) * 35,
          vx: Math.cos(angle) * 0.3,
          vy: Math.sin(angle) * 0.3,
          size: 3,
          color: spellColors[Math.floor(Math.random() * spellColors.length)],
          life: 1,
          decay: 0.008,
          spell
        });
      }
    } else if (spell === 'heal') {
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: startX + (Math.random() - 0.5) * 40,
          y: startY + Math.random() * 30,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 2.5 - 0.8,
          size: Math.random() * 2 + 1.5,
          color: spellColors[Math.floor(Math.random() * spellColors.length)],
          life: 1,
          decay: 0.01,
          spell
        });
      }
    }
  }

  function spawnClashEffect() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.45;

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color: ['#fff', '#c77dff', '#ff6b35', '#4a9eff'][Math.floor(Math.random() * 4)],
        life: 1,
        decay: 0.02,
        spell: 'clash'
      });
    }
  }

  function spawnDamageNumber(amount, side, isHeal) {
    const x = side === 'left' ? window.innerWidth * 0.25 : window.innerWidth * 0.75;
    const y = window.innerHeight * 0.3;

    particles.push({
      x, y,
      vx: 0,
      vy: -1.5,
      size: 0,
      color: isHeal ? '#50fa7b' : '#ff4444',
      life: 1,
      decay: 0.008,
      text: isHeal ? `+${amount}` : `-${amount}`,
      isText: true
    });
  }

  // ---- RENDER LOOP ----
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

    for (const p of particles) {
      effectsCtx.globalAlpha = Math.max(0, p.life);

      if (p.isText) {
        effectsCtx.font = "bold 20px 'Press Start 2P', monospace";
        effectsCtx.fillStyle = p.color;
        effectsCtx.textAlign = 'center';
        effectsCtx.fillText(p.text, p.x, p.y);
      } else {
        effectsCtx.fillStyle = p.color;
        effectsCtx.fillRect(
          p.x - p.size / 2,
          p.y - p.size / 2,
          p.size,
          p.size
        );
      }
    }

    effectsCtx.globalAlpha = 1;
  }

  function startRenderLoop() {
    function loop() {
      drawWizard();
      updateParticles();
      drawParticles();
      animationFrame = requestAnimationFrame(loop);
    }
    loop();
  }

  function stopRenderLoop() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  }

  function clearParticles() {
    particles = [];
  }

  return {
    init, setWizardState,
    spawnSpellEffect, spawnClashEffect, spawnDamageNumber,
    clearParticles, stopRenderLoop
  };
})();
