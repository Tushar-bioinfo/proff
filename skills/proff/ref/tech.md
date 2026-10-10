# Which tool draws what

Default: **the kit (SVG)**. Move off it only for the reasons below.

| Need | Use | Why |
|---|---|---|
| Diagrams, processes, molecules, tables, small charts (< ~5,000 marks per frame) | kit, SVG scene | real text, audited, crisp, themeable |
| Many moving marks: particles, diffusion, > 5,000 points, per-frame simulation | kit with `kind: 'canvas'` | SVG slows down past a few thousand nodes; canvas holds 5k–500k |
| Quantitative plots of real or simulated data (histograms, scatter, density, heatmaps, regression) | `scripts/plot.py` (matplotlib/seaborn) → `svg/` → `g.svgfile` | correct axes, ticks, log scales, stats; returns data-unit mappers for annotations |
| Calculations on small tables | `scripts/calctrace.py` → `Proff.calc` | numbers are computed and replayed cell by cell |
| Zoom, pan, brushing, force layouts, geographic data | d3 7.9.0 inside a scene (auto-loaded when story.js uses `d3.`) | data joins and interaction behaviours; draw text with the kit so it is audited |
| Generative or physics sketches with their own loop | p5 1.9.4 (auto-loaded on `new p5`) | only when the kit's draw loop cannot express it; p5 2.x changed its API, so stay on 1.9.4 |
| A realistic context picture (a tissue, an instrument, a lab bench) with **no text** | image from Gemini or Codex (`ref/image.md`), on request or in premium | models misspell and misplace labels: draw labels with the kit on top |
| Formulas | `g.tex` (KaTeX 0.16.11) | |
| Icons of lab objects | kit `bio.js` first; then licensed icons (`ref/assets.md`) | consistent style, themeable |

Never: hand-written HTML/CSS, a chart library that draws its own text (the audit cannot see it), screenshots of other pages, or an image with numbers in it.
