// =====================================================================
// Layout 2 — notebook-as-canvas hero
// Mouse parallax: each item shifts by a depth-weighted amount as the
// cursor moves across the hero. Composes with existing CSS rotates
// because we use the standalone `translate` property (applied before
// `transform`), not `transform: translate()`.
// =====================================================================

(function () {
  const hero = document.querySelector('.hero-editorial');
  const stage = document.querySelector('.hero-notebook-stage');
  if (!hero || !stage) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // depth = max pixel shift per axis. Higher = item feels closer to viewer.
  const items = [
    { el: stage.querySelector('.c-stamp'),  depth: 4  },
    { el: stage.querySelector('.c-flower'), depth: 4  },
    { el: stage.querySelector('.c-sticky'), depth: 7  },
    { el: stage.querySelector('.c-yarn'),   depth: 8  },
    { el: stage.querySelector('.c-pencil'), depth: 5 },
    { el: stage.querySelector('.c-lamp'),   depth: 14 },
  ].filter(i => i.el);

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let rafId = null;

  function updateTarget(e) {
    const rect = hero.getBoundingClientRect();
    targetX = (e.clientX - rect.left - rect.width / 2) / rect.width;
    targetY = (e.clientY - rect.top - rect.height / 2) / rect.height;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function reset() {
    targetX = 0;
    targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    currentX += (targetX - currentX) * 0.045;
    currentY += (targetY - currentY) * 0.045;

    for (const { el, depth } of items) {
      el.style.setProperty('--px', `${(currentX * depth).toFixed(2)}px`);
      el.style.setProperty('--py', `${(currentY * depth).toFixed(2)}px`);
    }

    if (Math.abs(targetX - currentX) > 0.0005 || Math.abs(targetY - currentY) > 0.0005) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  hero.addEventListener('mousemove', updateTarget);
  hero.addEventListener('mouseleave', reset);
})();

// Stamp videos: play on hover/focus, pause and rewind on leave.
(function () {
  const stamps = document.querySelectorAll('.stamp');
  stamps.forEach((stamp) => {
    const video = stamp.querySelector('video');
    if (!video) return;
    const play = () => { video.play().catch(() => {}); };
    const stop = () => { video.pause(); video.currentTime = 0; };
    stamp.addEventListener('mouseenter', play);
    stamp.addEventListener('mouseleave', stop);
    stamp.addEventListener('focus', play);
    stamp.addEventListener('blur', stop);
  });
})();
