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
   LENIS — Smooth scroll
   ============================================ */

(function () {
  'use strict';

  if (typeof Lenis === 'undefined') return;

  window.lenis = new Lenis({
    duration: 2.0,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true
  });

  const lenis = window.lenis;

  // Connect Lenis to GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

})();


/* ============================================
   GSAP SCROLL ANIMATIONS
   ============================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // ----- Section headings: slide up from below with scrub -----
  document.querySelectorAll('.work-klear__heading').forEach(function (heading) {
    gsap.fromTo(heading,
      { y: 80, opacity: 0 },
      {
        y: 0, opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: heading.closest('.work-klear__slide--header'),
          start: 'top 85%',
          end: 'top 40%',
          scrub: 0.6
        }
      }
    );
  });

  // ----- Work slides: text slides in from left, image scales up -----
  document.querySelectorAll('.work-klear__slide:not(.work-klear__slide--header)').forEach(function (slide) {
    var text = slide.querySelector('.work-klear__text');
    var image = slide.querySelector('.work-klear__image');

    if (text) {
      gsap.fromTo(text,
        { x: -60, opacity: 0 },
        {
          x: 0, opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: slide,
            start: 'top 80%',
            end: 'top 30%',
            scrub: 0.6
          }
        }
      );
    }

    if (image) {
      // Scale up + fade in tied to scroll
      gsap.fromTo(image,
        { scale: 0.88, opacity: 0, borderRadius: '24px' },
        {
          scale: 1, opacity: 1, borderRadius: '16px',
          ease: 'none',
          scrollTrigger: {
            trigger: slide,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.6
          }
        }
      );

      // Continuous parallax: image moves slower than scroll
      gsap.fromTo(image,
        { yPercent: 8 },
        {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: slide,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    }
  });

  // ----- About section: word-by-word opacity + photo tilt -----
  var aboutText = document.querySelector('.about__text');
  var aboutPhoto = document.querySelector('.about__photo');

  // Split text into words and wrap each in a span
  if (aboutText) {
    var paragraphs = aboutText.querySelectorAll('p');
    var allWords = [];

    paragraphs.forEach(function (p) {
      var text = p.innerHTML;
      // Wrap each word in a span, preserving HTML tags like <em>
      var wrapped = text.replace(/(\S+)/g, '<span class="about-word-reveal">$1</span>');
      p.innerHTML = wrapped;
      p.querySelectorAll('.about-word-reveal').forEach(function (w) {
        allWords.push(w);
      });
    });

    // Set initial state
    gsap.set(allWords, { opacity: 0.15 });

    // Animate words to full opacity tied to scroll
    gsap.to(allWords, {
      opacity: 1,
      stagger: 0.02,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about',
        start: 'top 60%',
        end: 'bottom 40%',
        scrub: 0.3
      }
    });
  }

  // Photo: tilt + scale + parallax
  if (aboutPhoto) {
    var photoImg = aboutPhoto.querySelector('img');

    // Initial reveal: scale up + rotate in
    gsap.fromTo(aboutPhoto,
      { opacity: 0, scale: 0.85, rotate: 3, transformOrigin: 'center center' },
      {
        opacity: 1, scale: 1, rotate: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about',
          start: 'top 70%',
          end: 'top 20%',
          scrub: 0.6
        }
      }
    );

    // Continuous parallax on photo — moves slower than scroll
    gsap.fromTo(aboutPhoto,
      { yPercent: 10 },
      {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  }

  // ----- Illustrations: staggered scale-up on each item -----
  var illustrationItems = document.querySelectorAll('.illustrations__item');
  if (illustrationItems.length) {
    gsap.fromTo(illustrationItems,
      { scale: 0.8, opacity: 0, y: 40 },
      {
        scale: 1, opacity: 1, y: 0,
        ease: 'none',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.illustrations__grid',
          start: 'top 80%',
          end: 'top 30%',
          scrub: 0.6
        }
      }
    );
  }

  // ----- Experience rows: draw-in border + staggered columns -----
  var expRows = document.querySelectorAll('.exp__row');
  if (expRows.length) {
    expRows.forEach(function (row) {
      var year = row.querySelector('.exp__year');
      var role = row.querySelector('.exp__role');
      var company = row.querySelector('.exp__company');
      var details = row.querySelector('.exp__details');

      // Set initial states
      gsap.set([year, role, company], { opacity: 0, y: 20 });
      if (details) gsap.set(details, { opacity: 0, y: 20 });

      // Build timeline
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: row,
          start: 'top 85%',
          end: 'top 25%',
          scrub: 0.6
        }
      });

      // Stagger columns: date → role → company → details
      tl.to(year, { opacity: 1, y: 0, duration: 0.25 }, 0);
      tl.to(role, { opacity: 1, y: 0, duration: 0.25 }, 0.1);
      tl.to(company, { opacity: 1, y: 0, duration: 0.25 }, 0.2);
      if (details) tl.to(details, { opacity: 1, y: 0, duration: 0.3 }, 0.3);
    });
  }

  // ----- Footer: marquee + content rise up -----
  var footerCenter = document.querySelector('.footer__center');
  var footerBottom = document.querySelector('.footer__bottom');

  if (footerCenter) {
    gsap.fromTo(footerCenter,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.footer',
          start: 'top 70%',
          end: 'top 30%',
          scrub: 0.6
        }
      }
    );
  }

  if (footerBottom) {
    gsap.fromTo(footerBottom,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.footer',
          start: 'top 60%',
          end: 'top 20%',
          scrub: 0.6
        }
      }
    );
  }

  // ----- Case study pages -----
  var csHero = document.querySelector('.cs-hero');
  if (csHero) {

    // Hero elements: staggered fade up
    var heroEls = csHero.querySelectorAll('[data-reveal]');
    gsap.fromTo(heroEls,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      }
    );

    // Case study sections: text slides in, images scale up
    document.querySelectorAll('.cs-section').forEach(function (section) {
      var labels = section.querySelectorAll('.cs-label');
      var headings = section.querySelectorAll('.cs-heading');
      var bodies = section.querySelectorAll('.cs-body, .cs-list');
      var galleries = section.querySelectorAll('.cs-gallery');

      // Text content: slide up with scrub
      var textEls = [];
      labels.forEach(function (el) { textEls.push(el); });
      headings.forEach(function (el) { textEls.push(el); });
      bodies.forEach(function (el) { textEls.push(el); });

      if (textEls.length) {
        gsap.fromTo(textEls,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1,
            stagger: 0.06,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'top 30%',
              scrub: 0.6
            }
          }
        );
      }

      // Galleries: scale up with parallax
      galleries.forEach(function (gallery) {
        var screens = gallery.querySelectorAll('.cs-screen');

        if (screens.length) {
          gsap.fromTo(screens,
            { scale: 0.9, opacity: 0 },
            {
              scale: 1, opacity: 1,
              stagger: 0.05,
              ease: 'none',
              scrollTrigger: {
                trigger: gallery,
                start: 'top 85%',
                end: 'top 25%',
                scrub: 0.6
              }
            }
          );
        }

        // Parallax on the gallery container
        gsap.fromTo(gallery,
          { yPercent: 5 },
          {
            yPercent: -5,
            ease: 'none',
            scrollTrigger: {
              trigger: gallery,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      });
    });
  }

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




