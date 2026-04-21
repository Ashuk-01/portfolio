// =====================================================================
// Home page behavior
// - nav background on scroll
// - bookshelf tooltip
// - day/evening theme toggle (persists via localStorage across pages)
// =====================================================================

// --- Nav background on scroll ---------------------------------------
(function () {
  const nav = document.getElementById('topnav');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// --- Bookshelf tooltip ----------------------------------------------
(function () {
  const shelf = document.getElementById('bookshelf');
  const tip = document.getElementById('book-tip');
  if (!shelf || !tip) return;
  const tipTitle = tip.querySelector('.tip-title');
  const rotations = ['-1.8deg', '0.9deg', '-0.6deg', '1.4deg'];

  shelf.querySelectorAll('.book-spine').forEach((spine, i) => {
    spine.addEventListener('mouseenter', () => {
      tipTitle.textContent = spine.getAttribute('data-title') || '';
      tip.style.setProperty('--tip-rot', rotations[i % rotations.length]);
      const shelfRect = shelf.getBoundingClientRect();
      const spineRect = spine.getBoundingClientRect();
      const x = spineRect.left - shelfRect.left + (spineRect.width / 2);
      tip.style.left = Math.max(0, Math.min(x - 60, shelf.offsetWidth - 120)) + 'px';
      tip.style.top = 'auto';
      tip.style.bottom = (shelf.offsetHeight - (spineRect.top - shelfRect.top) + 10) + 'px';
      tip.classList.add('is-visible');
    });
    spine.addEventListener('mouseleave', () => tip.classList.remove('is-visible'));
  });
})();

// --- Day/evening theme toggle (persisted) ---------------------------
(function () {
  const THEME_KEY = 'ashu-portfolio-theme';

  // Apply saved theme on load
  if (localStorage.getItem(THEME_KEY) === 'evening') {
    document.body.classList.add('evening');
  }

  // Sync the lamp hint text with current mode
  function refreshHint() {
    const hint = document.getElementById('lamp-hint');
    if (!hint) return;
    hint.textContent = document.body.classList.contains('evening') ? 'click to wake' : 'click to dim';
  }
  refreshHint();

  window.toggleEvening = function () {
    const isEvening = document.body.classList.toggle('evening');
    localStorage.setItem(THEME_KEY, isEvening ? 'evening' : 'day');
    refreshHint();
  };
})();
