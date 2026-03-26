/* ============================================
   HAMBURGER MENU — toggle mobile nav
   ============================================ */

(function () {
  'use strict';

  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

})();


/* ============================================
   PORTFOLIO V3 — Hero horizontal scroll
   ============================================ */

(function () {
  'use strict';

  if (window.innerWidth < 1280) return;

  const heroRow = document.getElementById('heroRow');
  const wrapper = document.querySelector('.hero-row-wrapper');

  if (!heroRow || !wrapper) return;

  window.addEventListener('load', () => {
    const rowWidth = heroRow.scrollWidth;
    const viewportWidth = wrapper.clientWidth;
    const scrollDistance = rowWidth - viewportWidth;

    setTimeout(() => {
      heroRow.style.transform = `translateX(-${scrollDistance}px)`;
    }, 1000);
  });

})();



/* ============================================
   NAV — Hide on scroll past hero
   ============================================ */

(function () {
  'use strict';

  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');
  if (!nav || !hero) return;

  function onScroll() {
    // Hide nav after scrolling past initial viewport area
    if (window.scrollY > 200) {
      nav.classList.add('nav--hidden');
    } else {
      nav.classList.remove('nav--hidden');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

})();


/* ============================================
   CUSTOM CURSOR — small circle + text mask
   ============================================ */

(function () {
  'use strict';

  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mouseX = -100;
  let mouseY = -100;
  let cursorX = -100;
  let cursorY = -100;

  // Text-bearing selectors to detect hover
  const textSelectors = 'h1, h2, h3, h4, h5, h6, p, a, span, em, strong, li, label, blockquote';

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Check if hovering over text
    const target = e.target;
    if (target.closest(textSelectors)) {
      cursor.classList.add('on-text');
    } else {
      cursor.classList.remove('on-text');
    }
  });

  // Hide cursor when mouse leaves window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });

  // Smooth follow with requestAnimationFrame
  function animate() {
    const ease = 0.15;
    cursorX += (mouseX - cursorX) * ease;
    cursorY += (mouseY - cursorY) * ease;

    cursor.style.transform = `translate(${cursorX - cursor.offsetWidth / 2}px, ${cursorY - cursor.offsetHeight / 2}px)`;

    requestAnimationFrame(animate);
  }

  animate();

})();


/* ============================================
   SCROLL REVEAL — IntersectionObserver
   ============================================ */

(function () {
  'use strict';

  const reveals = document.querySelectorAll('[data-reveal]');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px 0px 0px'
  });

  reveals.forEach((el) => {
    // Klear/editorial items handle their own internal stagger via CSS
    const selfAnimated = el.classList.contains('work-editorial__item') ||
                         el.classList.contains('work-klear__item');
    if (!selfAnimated) {
      const siblings = el.parentElement.querySelectorAll(
        '[data-reveal]:not(.work-editorial__item):not(.work-klear__item)'
      );
      const index = Array.from(siblings).indexOf(el);
      if (index > 0) {
        el.style.setProperty('--delay', `${index * 0.12}s`);
      }
    }

    observer.observe(el);
  });

})();


/* ============================================
   OPTION C — Hover image follows cursor
   ============================================ */

(function () {
  'use strict';

  const hoverImg = document.getElementById('workHoverImg');
  const items = document.querySelectorAll('.work-list__item');
  if (!hoverImg || !items.length) return;

  const img = hoverImg.querySelector('img');
  let imgX = 0;
  let imgY = 0;
  let targetX = 0;
  let targetY = 0;

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX + 20;
    targetY = e.clientY - 110;
  });

  function animateImg() {
    const ease = 0.12;
    imgX += (targetX - imgX) * ease;
    imgY += (targetY - imgY) * ease;
    hoverImg.style.left = imgX + 'px';
    hoverImg.style.top = imgY + 'px';
    requestAnimationFrame(animateImg);
  }

  animateImg();

  items.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const src = item.getAttribute('data-img');
      if (src) {
        img.src = src;
        hoverImg.classList.add('visible');
      }
    });

    item.addEventListener('mouseleave', () => {
      hoverImg.classList.remove('visible');
    });
  });

})();




/* ============================================
   EXPERIENCE — Toggle row expand/collapse
   ============================================ */

(function () {
  'use strict';

  const rows = document.querySelectorAll('.exp__row');
  if (!rows.length) return;

  rows.forEach((row) => {
    row.addEventListener('click', () => {
      // Close other open rows
      rows.forEach((r) => {
        if (r !== row) r.classList.remove('open');
      });
      // Toggle this row
      row.classList.toggle('open');
    });
  });

})();


/* ============================================
   STICKY SLIDES — Scale down + fade on cover
   (disabled below 1280px)
   ============================================ */

(function () {
  'use strict';

  if (window.innerWidth < 1280) return;

  const hero = document.querySelector('.hero');
  const stack = document.querySelector('.work-klear__stack');
  if (!hero || !stack) return;

  // Build panels in true DOM order by walking children of the stack
  // Plus the hero at the start
  const panels = [hero];
  const stackPanels = stack.querySelectorAll('.work-klear__slide, .howiai, .about, .exp, .footer');
  stackPanels.forEach((el) => panels.push(el));

  // Assign progressive z-indexes so later panels always cover earlier ones
  panels.forEach((panel, i) => {
    panel.style.zIndex = i + 1;
  });

  function onScroll() {
    const viewH = window.innerHeight;

    for (let i = 0; i < panels.length - 1; i++) {
      const current = panels[i];
      const next = panels[i + 1];

      const nextRect = next.getBoundingClientRect();

      // progress: 0 = next slide below viewport, 1 = fully covers current
      const progress = Math.min(1, Math.max(0, 1 - (nextRect.top / viewH)));

      // Scale container: 1 → 0.9
      const scale = 1 - (progress * 0.1);
      // Border radius: 0 → 24px
      const radius = progress * 24;
      // Dark overlay: 0 → 0.5
      const overlay = progress * 0.5;

      current.style.transform = `scale(${scale})`;
      current.style.borderRadius = radius + 'px';

      // Set overlay opacity via the ::after pseudo-element
      current.style.setProperty('--overlay', overlay);
    }

    // Reset last panel
    const last = panels[panels.length - 1];
    last.style.transform = 'scale(1)';
    last.style.borderRadius = '0px';
    last.style.setProperty('--overlay', 0);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

})();


