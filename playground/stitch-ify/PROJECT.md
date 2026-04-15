# Stitch-ify — Image to Cross-Stitch Pattern Converter

**Location:** `/Users/ashukaur/project-ideas/stitch-ify/index.html`  
**Stack:** Single HTML file (vanilla HTML/CSS/JS, no dependencies)

## What it does
Upload any image → pixelates it → maps colors to real DMC embroidery thread colors → outputs a cross-stitch pattern with grid, symbols, axis numbers, and a thread legend.

## Core algorithms
- **Octree color quantization** — picks the best N colors from the image (smarter than frequency-based, preserves rare accent colors)
- **CIELAB color matching** — maps colors to nearest DMC thread using perceptually accurate Delta E distance (not RGB)
- **Nearest-neighbor downsampling** — `imageSmoothingEnabled = false` for crisp edges, preserves text/details
- **~400 DMC colors** in the database with RGB values

## Current UI/UX
- **Landing page:** hero section with cross-stitch icon, tagline, upload box with + icon, 3-step "how it works"
- **Pattern view:** canvas pattern on left, sidebar (sliders + grid toggle + thread legend) on right
- **Header actions:** "Download" dropdown (For Stitching / For Preview) + "New Image" ghost button
- **Stitch-by-stitch animation:** random scatter on upload (~2 seconds), cells pop in randomly
- **Smooth transitions:** fade out upload → fade in pattern, reverse on reset
- **Retina support:** canvas renders at devicePixelRatio for sharp text
- **Processing indicator:** shows "Processing..." only if image load takes >300ms
- **Downloads:** high-res render at fixed 14px cell size, always crisp with symbols regardless of screen view
- **Grid toggle:** show/hide grid lines on screen and in downloads
- **Auto-fit container:** pattern always fits viewport, no scrolling

## Slider defaults
- Grid: 60 (range 20-200)
- Colors: 20 (range 2-60)

## Design decisions made
- Kept cross-stitch theme (not generic pixel art) — unique portfolio piece, real-world utility
- Cream/light aesthetic for the pattern canvas (matches real cross-stitch patterns)
- Dark mode CSS variables exist but toggle was removed
- Subtitle removed from header for cleaner look
- Buttons moved from sidebar to header to reduce clutter
- Studied pixelartvillage.com for reference — adopted octree from them, our CIELAB matching is better

## What could be added next
- Original vs pattern side-by-side comparison
- Zoom & pan on the pattern
- Thread cost/quantity estimator
- Example images (preloaded samples)
- PDF export
