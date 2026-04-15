/* ============================================
   MUSIC MOOD MAP — Vinyl Records Engine
   Virtual rendering + LOD + Color extraction
   ============================================ */

(function () {
  // ─── Dimensions ──────────────────────────
  const VINYL_REGULAR = 120;
  const VINYL_FEATURED = 150;
  const FEATURED_EVERY = 6;   // every 6th tile is featured
  const GRID_GAP = 250;       // base center-to-center (120px + 130px gap)
  const JITTER = 38;
  const BUFFER = 60;          // small buffer so tiles appear near viewport edge

  // ─── Physics ─────────────────────────────
  const FRICTION = 0.93;
  const LERP = 0.1;
  const FLY_LERP = 0.06;
  const MIN_ZOOM = 0.06;
  const MAX_ZOOM = 3;
  const ZOOM_SPEED = 0.0008;

  // ─── LOD thresholds ──────────────────────
  const LOD_0_THRESHOLD = 0.25;  // below: simple dots
  const LOD_1_THRESHOLD = 0.7;   // below: grooves + art, no full shine

  // ─── State ───────────────────────────────
  let panX = 0, panY = 0;
  let targetPanX = 0, targetPanY = 0;
  let zoom = 1.6;
  let targetZoom = 1.6;
  let velocityX = 0, velocityY = 0;
  let isDragging = false;
  let lastMouseX = 0, lastMouseY = 0;
  let lastDragTime = 0;
  let animatingTo = false;
  let wasDragging = false;
  let dragDistance = 0;
  let canvasW = 0, canvasH = 0;
  let currentLOD = 2;
  let highlightedSongIdx = -1;
  let infoOpen = false;
  let pushState = null; // { originX, originY, force } — stored so new tiles get pushed too

  // ─── DOM refs ────────────────────────────
  const viewport = document.getElementById('viewport');
  const canvas = document.getElementById('canvas');
  const searchInput = document.getElementById('search');
  const searchResults = document.getElementById('search-results');
  const resetBtn = document.getElementById('resetBtn');
  // Guard against missing elements
  const hasSearch = searchInput && searchResults;
  const hasReset = !!resetBtn;

  // ─── Virtual rendering map ───────────────
  const activeTiles = new Map(); // songIndex → { el, img, loaded, colored }

  // ─── Seeded random ───────────────────────
  function seededRandom(str, idx) {
    let hash = 0;
    const s = str + '_' + idx;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return ((hash & 0x7fffffff) % 10000) / 10000;
  }

  // ─── Compute staggered grid positions ────
  function computeGrid() {
    const count = SONGS.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const rowHeight = GRID_GAP * 0.86;

    const padding = GRID_GAP;
    canvasW = (cols + 0.5) * GRID_GAP + padding;
    canvasH = rows * rowHeight + padding;

    canvas.style.width = canvasW + 'px';
    canvas.style.height = canvasH + 'px';

    for (let i = 0; i < count; i++) {
      const song = SONGS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (row % 2 === 1) ? GRID_GAP * 0.5 : 0;
      const jx = (seededRandom(song.name, 0) - 0.5) * JITTER * 2;
      const jy = (seededRandom(song.name, 1) - 0.5) * JITTER * 2;

      song.x = padding / 2 + col * GRID_GAP + offsetX + jx;
      song.y = padding / 2 + row * rowHeight + jy;

      // Determine size — use seeded random so it's deterministic but scattered
      const isFeatured = seededRandom(song.name, 2) < (1 / FEATURED_EVERY);
      song.size = isFeatured ? VINYL_FEATURED : VINYL_REGULAR;
    }
  }

  // ─── Generate noise texture ──────────────
  function generateNoiseTexture() {
    const size = 150;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 18; // subtle noise
    }

    ctx.putImageData(imageData, 0, 0);
    return c.toDataURL('image/png');
  }

  // ─── Color extraction ────────────────────
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function extractColor(imgEl, vinylEl, songName) {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imgEl, 0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      const [h, s, l] = rgbToHsl(data[0], data[1], data[2]);

      // Store raw album art color for background tint on click
      const idx = SONGS.findIndex(sg => sg.name === songName);
      if (idx >= 0) SONGS[idx].artHue = h;

      // Mix: ~60% classic black, ~40% colored vinyl
      const isColored = true;
      if (isColored) {
        // Colored vinyl — rich, visible color
        vinylEl.style.setProperty('--vinyl-hue', h);
        vinylEl.style.setProperty('--vinyl-sat', Math.max(45, s * 0.8) + '%');
        vinylEl.style.setProperty('--vinyl-light', Math.max(25, Math.min(40, l * 0.5)) + '%');
      } else {
        // Classic black vinyl
        vinylEl.style.setProperty('--vinyl-hue', h);
        vinylEl.style.setProperty('--vinyl-sat', '4%');
        vinylEl.style.setProperty('--vinyl-light', '12%');
      }
    } catch (e) {
      // CORS fallback — hash-based color
      applyFallbackColor(vinylEl, songName);
    }
  }

  function applyFallbackColor(vinylEl, name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash |= 0;
    }
    vinylEl.style.setProperty('--vinyl-hue', Math.abs(hash % 360));
    vinylEl.style.setProperty('--vinyl-sat', '8%');
    vinylEl.style.setProperty('--vinyl-light', '13%');
  }

  // ─── Create vinyl tile element ───────────
  function createTileElement(song, songIdx) {
    // Outer wrapper (position + hover scale)
    const size = song.size || VINYL_REGULAR;
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (size === VINYL_FEATURED) tile.classList.add('featured');
    tile.style.left = (song.x - size / 2) + 'px';
    tile.style.top = (song.y - size / 2) + 'px';
    tile.style.width = size + 'px';
    tile.style.height = size + 'px';

    // Highlight state
    if (highlightedSongIdx >= 0) {
      tile.classList.add(songIdx === highlightedSongIdx ? 'highlighted' : 'dimmed');
    }

    // Vinyl disc
    const vinyl = document.createElement('div');
    vinyl.className = 'vinyl loading';

    // Grooves + shine handled by CSS pseudo-elements

    // Grain texture overlay
    const grain = document.createElement('div');
    grain.className = 'vinyl-grain';

    // Center label (album art)
    const label = document.createElement('div');
    label.className = 'vinyl-label';

    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.draggable = false;
    img.alt = song.name + ' by ' + song.artist;

    // Center hole
    const hole = document.createElement('div');
    hole.className = 'vinyl-hole';

    // Assemble
    label.appendChild(img);
    vinyl.appendChild(grain);
    vinyl.appendChild(label);
    vinyl.appendChild(hole);
    tile.appendChild(vinyl);

    // Events
    tile.addEventListener('mouseenter', (e) => {
      if (!wasDragging && !infoOpen) pushAway(songIdx);
    });
    tile.addEventListener('mousemove', (e) => {
      if (!tile.classList.contains('active')) handleTilt(tile, vinyl, e);
    });
    tile.addEventListener('mouseleave', (e) => {
      resetTilt(vinyl);
      if (!infoOpen) pullBack();
    });
    // Store song data on element for click detection
    tile.dataset.songIdx = songIdx;

    return { el: tile, img, vinyl, loaded: false, colored: false };
  }

  // ─── Virtual rendering ───────────────────
  function getVisibleRect() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      left: -panX / zoom,
      top: -panY / zoom,
      right: (-panX + vw) / zoom,
      bottom: (-panY + vh) / zoom,
    };
  }

  function updateVisibility() {
    const rect = getVisibleRect();
    const bufferPx = BUFFER / Math.max(zoom, 0.1);

    const visible = new Set();

    // Find visible songs
    for (let i = 0; i < SONGS.length; i++) {
      const s = SONGS[i];
      if (s.x >= rect.left - bufferPx && s.x <= rect.right + bufferPx &&
          s.y >= rect.top - bufferPx && s.y <= rect.bottom + bufferPx) {
        visible.add(i);
      }
    }

    // Remove tiles that left viewport
    for (const [idx, tile] of activeTiles) {
      if (!visible.has(idx)) {
        tile.el.remove();
        activeTiles.delete(idx);
      }
    }

    // Add new tiles with staggered reveal
    let delay = 0;
    for (const idx of visible) {
      if (!activeTiles.has(idx)) {
        const tileData = createTileElement(SONGS[idx], idx);
        canvas.appendChild(tileData.el);
        activeTiles.set(idx, tileData);

        // Staggered grow-in: each tile enters slightly after the previous
        const d = delay;
        requestAnimationFrame(() => {
          setTimeout(() => {
            tileData.el.classList.add('entered');
          }, d);
        });
        delay += 60; // 60ms stagger between each tile

        // Lazy load image
        loadTileImage(idx);

        // Apply push state to new tile if info is open
        if (pushState && idx !== pushState.clickedIdx) {
          applyPush(tileData, SONGS[idx], false);
        }
      }
    }
  }

  function loadTileImage(idx) {
    const tile = activeTiles.get(idx);
    if (!tile || tile.loaded) return;

    const song = SONGS[idx];
    tile.img.onload = () => {
      tile.img.classList.add('loaded');
      tile.vinyl.classList.remove('loading');
      tile.loaded = true;

      // Extract dominant color
      if (!tile.colored) {
        // Slight delay to ensure image is fully decoded
        requestAnimationFrame(() => {
          extractColor(tile.img, tile.vinyl, song.name);
          tile.colored = true;
        });
      }
    };

    tile.img.onerror = () => {
      tile.vinyl.classList.remove('loading');
      applyFallbackColor(tile.vinyl, song.name);
      tile.colored = true;
      tile.loaded = true;
    };

    tile.img.src = song.img;
  }

  // ─── LOD management ──────────────────────
  function updateLOD() {
    let newLOD;
    if (zoom < LOD_0_THRESHOLD) newLOD = 0;
    else if (zoom < LOD_1_THRESHOLD) newLOD = 1;
    else newLOD = 2;

    if (newLOD !== currentLOD) {
      canvas.classList.remove('lod-0', 'lod-1', 'lod-2');
      canvas.classList.add('lod-' + newLOD);
      currentLOD = newLOD;
    }
  }

  // ─── Initialize ──────────────────────────
  function init() {
    // Generate noise texture and set as CSS variable
    const noiseUrl = generateNoiseTexture();
    document.documentElement.style.setProperty('--noise-texture', `url(${noiseUrl})`);

    computeGrid();

    // Set initial LOD
    canvas.classList.add('lod-2');

    // Center view
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    targetPanX = panX = (vw / 2) - (canvasW * zoom / 2);
    targetPanY = panY = (vh / 2) - (canvasH * zoom / 2);

    bindCanvasEvents();
    if (hasReset) bindNavEvents();
    if (hasSearch) bindSearchEvents();
    bindDetailEvents();

    // Initial visibility
    updateVisibility();

    // Start render loop
    requestAnimationFrame(animate);
  }

  // ─── Canvas events ───────────────────────
  function bindCanvasEvents() {
    let pointerTarget = null;

    viewport.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#nav') || e.target.closest('#search-results') || e.target.closest('.song-info')) return;
      pointerTarget = e.target;
      isDragging = true;
      wasDragging = false;
      dragDistance = 0;
      animatingTo = false;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      lastDragTime = performance.now();
      velocityX = 0;
      velocityY = 0;
      viewport.classList.add('grabbing');
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      const now = performance.now();
      const dt = Math.max(now - lastDragTime, 1);

      dragDistance += Math.abs(dx) + Math.abs(dy);
      if (dragDistance > 5) wasDragging = true;

      const weight = Math.min(dt / 16, 1);
      velocityX = velocityX * (1 - weight) + dx * weight;
      velocityY = velocityY * (1 - weight) + dy * weight;

      targetPanX += dx;
      targetPanY += dy;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      lastDragTime = now;
    });

    viewport.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('grabbing');

      // If barely moved — treat as a click
      if (dragDistance < 5 && pointerTarget) {
        const tileEl = pointerTarget.closest('.tile');
        if (tileEl && tileEl.dataset.songIdx !== undefined) {
          const idx = parseInt(tileEl.dataset.songIdx);
          const song = SONGS[idx];
          if (song) showSongInfo(song, idx, tileEl);
        } else {
          // Clicked empty canvas — close any open info
          hideSongInfo();
        }
      } else {
        // Apply momentum
        const elapsed = performance.now() - lastDragTime;
        if (elapsed < 50) {
          velocityX *= 2.5;
          velocityY *= 2.5;
        }
      }
      pointerTarget = null;
      // Reset after a short delay so the mouseenter that fires
      // immediately on pointer-up doesn't get suppressed
      requestAnimationFrame(() => { wasDragging = false; });
    });

    // Wheel zoom toward cursor
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const mx = e.clientX, my = e.clientY;
      const cx = (mx - targetPanX) / targetZoom;
      const cy = (my - targetPanY) / targetZoom;
      const delta = -e.deltaY * ZOOM_SPEED;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom * (1 + delta)));
      targetPanX = mx - cx * newZoom;
      targetPanY = my - cy * newZoom;
      targetZoom = newZoom;
      animatingTo = false;
    }, { passive: false });

    // Touch pinch zoom
    let lastTouchDist = 0, lastTouchCX = 0, lastTouchCY = 0;

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
        lastTouchCX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastTouchCY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        if (lastTouchDist > 0) {
          const scale = dist / lastTouchDist;
          const canvX = (cx - targetPanX) / targetZoom;
          const canvY = (cy - targetPanY) / targetZoom;
          const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom * scale));
          targetPanX = cx - canvX * nz;
          targetPanY = cy - canvY * nz;
          targetZoom = nz;
          targetPanX += cx - lastTouchCX;
          targetPanY += cy - lastTouchCY;
        }
        lastTouchDist = dist;
        lastTouchCX = cx;
        lastTouchCY = cy;
      }
    }, { passive: false });

    viewport.addEventListener('touchend', () => { lastTouchDist = 0; }, { passive: true });
  }

  // ─── Pan clamping — keep canvas within viewport ───
  function clampPan() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scaledW = canvasW * targetZoom;
    const scaledH = canvasH * targetZoom;

    // X axis
    if (scaledW <= vw) {
      // Canvas smaller than viewport — center it
      targetPanX = (vw - scaledW) / 2;
    } else {
      const minX = vw - scaledW;
      const maxX = 0;
      if (targetPanX > maxX) targetPanX = maxX;
      if (targetPanX < minX) targetPanX = minX;
    }

    // Y axis
    if (scaledH <= vh) {
      targetPanY = (vh - scaledH) / 2;
    } else {
      const minY = vh - scaledH;
      const maxY = 0;
      if (targetPanY > maxY) targetPanY = maxY;
      if (targetPanY < minY) targetPanY = minY;
    }
  }

  // ─── Animation loop ──────────────────────
  let frameCount = 0;

  function animate() {
    // Momentum
    if (!isDragging && !animatingTo) {
      targetPanX += velocityX;
      targetPanY += velocityY;
      velocityX *= FRICTION;
      velocityY *= FRICTION;
      if (Math.abs(velocityX) < 0.05) velocityX = 0;
      if (Math.abs(velocityY) < 0.05) velocityY = 0;
    }

    // Clamp pan to canvas bounds
    clampPan();

    // Smooth interpolation
    const lf = animatingTo ? FLY_LERP : LERP;
    panX += (targetPanX - panX) * lf;
    panY += (targetPanY - panY) * lf;
    zoom += (targetZoom - zoom) * lf;

    // Apply transform
    canvas.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;

    // Update visibility + LOD every 6 frames
    frameCount++;
    if (frameCount % 6 === 0) {
      updateVisibility();
      updateLOD();
    }

    requestAnimationFrame(animate);
  }

  // ─── Push Away / Pull Back ────────────────
  const HOVER_PUSH_RADIUS = 350;
  const HOVER_PUSH_STRENGTH = 25;
  const CLICK_PUSH_RADIUS = 800;
  const CLICK_PUSH_STRENGTH = 250;

  function pushAway(hoveredIdx) {
    const hoveredSong = SONGS[hoveredIdx];
    if (!hoveredSong) return;

    for (const [idx, tile] of activeTiles) {
      if (idx === hoveredIdx) continue;

      const song = SONGS[idx];
      const dx = song.x - hoveredSong.x;
      const dy = song.y - hoveredSong.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < HOVER_PUSH_RADIUS && dist > 0) {
        const force = (1 - dist / HOVER_PUSH_RADIUS) * HOVER_PUSH_STRENGTH;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * force;
        const pushY = Math.sin(angle) * force;

        tile.el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        tile.el.style.transform = `translate(${pushX}px, ${pushY}px) scale(0.92)`;
      }
    }
  }

  // Radial push — ALL items move outward from clicked
  function pushAwayForInfo(clickedIdx) {
    const s = SONGS[clickedIdx];
    if (!s) return;

    // Store push state so new tiles entering viewport also get pushed
    pushState = {
      originX: s.x + 60,
      originY: s.y,
      force: 100,
      clickedIdx: clickedIdx
    };

    // Apply to all currently active tiles
    for (const [idx, tile] of activeTiles) {
      if (idx === clickedIdx) continue;
      applyPush(tile, SONGS[idx], true);
    }
  }

  // Apply push to a single tile based on stored pushState
  function applyPush(tile, song, animate) {
    if (!pushState) return;

    const dx = song.x - pushState.originX;
    const dy = song.y - pushState.originY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const angle = Math.atan2(dy, dx);
      const pushX = Math.cos(angle) * pushState.force;
      const pushY = Math.sin(angle) * pushState.force;

      if (animate) {
        tile.el.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
      } else {
        tile.el.style.transition = 'none';
      }
      tile.el.style.transform = `translate(${pushX}px, ${pushY}px) scale(0.75)`;
    }
  }

  function pullBack() {
    pushState = null;
    for (const [, tile] of activeTiles) {
      tile.el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      tile.el.style.transform = '';
    }
  }

  // ─── 3D Tilt ─────────────────────────────
  const MAX_TILT = 14; // degrees

  function handleTilt(tile, vinyl, e) {
    if (wasDragging) return;

    const rect = tile.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalized position: -1 to 1 from center
    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    // Clamp
    const clampedX = Math.max(-1, Math.min(1, normX));
    const clampedY = Math.max(-1, Math.min(1, normY));

    // Tilt: Y-axis rotates based on X position, X-axis based on Y position (inverted)
    const tiltY = clampedX * MAX_TILT;
    const tiltX = -clampedY * MAX_TILT;

    // Shadow shifts opposite to tilt direction
    const shadowX = -clampedX * 6;
    const shadowY = -clampedY * 4;

    vinyl.style.setProperty('--tilt-x', tiltX + 'deg');
    vinyl.style.setProperty('--tilt-y', tiltY + 'deg');
    vinyl.style.setProperty('--shadow-x', shadowX + 'px');
    vinyl.style.setProperty('--shadow-y', shadowY + 'px');
  }

  function resetTilt(vinyl) {
    vinyl.style.setProperty('--tilt-x', '0deg');
    vinyl.style.setProperty('--tilt-y', '0deg');
    vinyl.style.setProperty('--shadow-x', '0px');
    vinyl.style.setProperty('--shadow-y', '0px');
  }

  // ─── Fly to point ────────────────────────
  function flyTo(cx, cy, tz) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    targetZoom = tz || 0.5;
    targetPanX = (vw / 2) - cx * targetZoom;
    targetPanY = (vh / 2) - cy * targetZoom;
    velocityX = 0;
    velocityY = 0;
    animatingTo = true;
    setTimeout(() => { animatingTo = false; }, 1500);
  }

  // ─── Navigation ──────────────────────────
  function bindNavEvents() {
    resetBtn.addEventListener('click', () => {
      flyTo(canvasW / 2, canvasH / 2, 0.12);
    });
  }

  // ─── Search ──────────────────────────────
  function bindSearchEvents() {
    let debounceTimer;

    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const q = searchInput.value.trim().toLowerCase();
        if (q.length < 2) {
          searchResults.classList.remove('visible');
          clearHighlights();
          return;
        }
        const matches = SONGS
          .map((s, i) => ({ ...s, _idx: i }))
          .filter(s => s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
          .slice(0, 8);
        renderSearchResults(matches);
      }, 200);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2) searchResults.classList.add('visible');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper') && !e.target.closest('#search-results')) {
        searchResults.classList.remove('visible');
        clearHighlights();
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.blur();
        searchInput.value = '';
        searchResults.classList.remove('visible');
        clearHighlights();
      }
    });
  }

  function renderSearchResults(matches) {
    searchResults.innerHTML = '';
    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-empty">No songs found</div>';
      searchResults.classList.add('visible');
      return;
    }
    matches.forEach(song => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <img src="${song.img}" alt="" loading="lazy" />
        <div class="search-result-info">
          <div class="search-result-name">${escapeHtml(song.name)}</div>
          <div class="search-result-artist">${escapeHtml(song.artist)}</div>
        </div>`;
      item.addEventListener('click', () => {
        flyTo(song.x, song.y, 1.4);
        highlightSong(song._idx);
        searchResults.classList.remove('visible');
        searchInput.blur();
      });
      searchResults.appendChild(item);
    });
    searchResults.classList.add('visible');
  }

  function highlightSong(idx) {
    clearHighlights();
    highlightedSongIdx = idx;

    for (const [tileIdx, tile] of activeTiles) {
      tile.el.classList.add(tileIdx === idx ? 'highlighted' : 'dimmed');
    }

    setTimeout(() => clearHighlights(), 4000);
  }

  function clearHighlights() {
    highlightedSongIdx = -1;
    for (const [, tile] of activeTiles) {
      tile.el.classList.remove('highlighted', 'dimmed');
    }
  }

  // ─── In-Canvas Song Info ─────────────────
  let currentAudio = null;
  let progressRAF = null;
  let activeInfoEl = null;
  let activeTileEl = null;

  function bindDetailEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideSongInfo();
    });
  }

  function showSongInfo(song, songIdx, tileEl) {
    // Close existing
    hideSongInfo();

    // Lock push state and push away surrounding vinyls
    infoOpen = true;
    pushAwayForInfo(songIdx);

    // Mark tile as active
    tileEl.classList.add('active');
    activeTileEl = tileEl;

    // Create info panel
    const info = document.createElement('div');
    info.className = 'song-info';

    // Position it to the right of the tile, vertically centered
    const size = song.size || 130;
    info.style.left = (song.x + size / 2 + 28) + 'px';
    info.style.top = song.y + 'px';
    info.style.transform = 'translateY(-50%) translateX(-8px)';

    // Build content
    let controlsHTML = '';
    if (song.preview) {
      controlsHTML = `
        <div class="song-info-controls">
          <div class="song-info-progress"><div class="song-info-progress-bar"></div></div>
          <span class="song-info-time">0:00</span>
        </div>`;
    }

    info.innerHTML = `
      <div class="song-info-name">${escapeHtml(song.name)}</div>
      <div class="song-info-artist">${escapeHtml(song.artist)}</div>
      ${controlsHTML}`;

    // Scale font based on vinyl size
    if (size === VINYL_FEATURED) {
      info.classList.add('song-info-lg');
    }

    canvas.appendChild(info);
    activeInfoEl = info;

    // Animate in
    requestAnimationFrame(() => {
      info.classList.add('visible');
    });

    // Auto-play on click
    if (song.preview) {
      toggleAudio(song, info);
    }
  }

  function hideSongInfo() {
    infoOpen = false;
    stopAudio();

    if (activeInfoEl) {
      activeInfoEl.classList.remove('visible');
      const el = activeInfoEl;
      setTimeout(() => el.remove(), 400);
      activeInfoEl = null;
    }

    if (activeTileEl) {
      activeTileEl.classList.remove('active');
      activeTileEl = null;
    }

    pullBack();
  }

  function toggleAudio(song, infoEl) {
    const progressBar = infoEl.querySelector('.song-info-progress-bar');
    const timeEl = infoEl.querySelector('.song-info-time');

    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      cancelAnimationFrame(progressRAF);
      return;
    }

    if (!currentAudio || currentAudio.src !== song.preview) {
      stopAudio();
      currentAudio = new Audio(song.preview);
      currentAudio.volume = 0.6;
      currentAudio.addEventListener('ended', () => {
        if (progressBar) progressBar.style.width = '0%';
        if (timeEl) timeEl.textContent = '0:00';
      });
    }

    currentAudio.play().then(() => {
      updateAudioProgress(progressBar, timeEl);
    }).catch(() => {});
  }

  function updateAudioProgress(bar, timeEl) {
    if (!currentAudio || currentAudio.paused) return;
    const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
    bar.style.width = pct + '%';
    const secs = Math.floor(currentAudio.currentTime);
    timeEl.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    progressRAF = requestAnimationFrame(() => updateAudioProgress(bar, timeEl));
  }

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    }
    cancelAnimationFrame(progressRAF);
  }

  // ─── Helpers ─────────────────────────────
  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  // ─── Start ───────────────────────────────
  init();
})();
