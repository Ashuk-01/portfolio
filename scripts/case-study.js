// =====================================================================
// Case study page behavior
// - nav scroll background
// - reading progress bar
// - intersection-based reveal animation
// - day/evening theme toggle (persists across pages via localStorage)
// - reading time estimate
// =====================================================================

(function () {
  // --- Nav scroll state ------------------------------------------------
  const nav = document.getElementById('topnav');
  const progress = document.getElementById('cs-progress');

  function onScroll() {
    if (nav) {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    if (progress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = pct + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Reveal on scroll -----------------------------------------------
  const revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealables.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('revealed'));
  }

  // --- Day/evening theme toggle ---------------------------------------
  const THEME_KEY = 'ashu-portfolio-theme';
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'evening') document.body.classList.add('evening');

  window.toggleEvening = function () {
    const isEvening = document.body.classList.toggle('evening');
    localStorage.setItem(THEME_KEY, isEvening ? 'evening' : 'day');
  };

  // --- Left-side TOC: active section tracking -------------------------
  const toc = document.getElementById('cs-toc');
  if (toc) {
    const tocLinks = toc.querySelectorAll('a[data-toc-target]');
    const sectionsById = new Map();
    tocLinks.forEach((link) => {
      const id = link.getAttribute('data-toc-target');
      const sec = document.getElementById(id);
      if (sec) sectionsById.set(id, { section: sec, link });
    });

    const setActive = (id) => {
      tocLinks.forEach((l) => l.classList.remove('is-active'));
      const entry = sectionsById.get(id);
      if (entry) entry.link.classList.add('is-active');
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        // Of all currently-intersecting sections, pick the one with the highest top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({ id: e.target.id, top: e.boundingClientRect.top }))
          .sort((a, b) => a.top - b.top);
        if (visible.length) setActive(visible[0].id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    sectionsById.forEach(({ section }) => sectionObserver.observe(section));
  }
})();
