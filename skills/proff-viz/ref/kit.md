# Kit API (story.js)

`story.js` is plain JavaScript. `build.py` puts the runtime, theme, data, and figures around it. Numbers come from `PROFF_DATA.<file stem>` (your `data/*.json`).

## Page
```js
Proff.page({ title, sub, eyebrow, layout: 'walk' | 'article', palette: 'lab' | 'neon', foot });
```
- `walk` (default): one stage, one slider over every step of every scene. For stories and processes.
- `article`: scrolling page; each scene has its own steps and controls; study blocks allowed between scenes.
- Default palette "blockframe" (Block Frame pastels on black: blue, yellow, pink, green, cream). `palette` only when the user asks for another.

## Scene
```js
Proff.scene({
  title, phase, acc: 1..6,          // phase = short tag (design, cut, analysis); acc = accent colour of the card
  w: 1200, h: 675,                  // stage units; keep 1200 wide
  kind: 'canvas',                   // only for > ~5k marks per frame (see ref/tech.md)
  controls: [{ name, label, min, max, step, value, unit, fmt }, { type: 'button', name: 'reseed', label: 'new samples' }],
  panels: [{ id: 'data', from: 0, w: 1.2 }, { id: 'fit', from: 2 }],   // optional, see below
  steps: ['caption', { cap, info }],  // cap <= 28 words, shown at the top of the i sidebar (never under the figure); info = more sidebar
  info,                             // sidebar for every step of the scene
  draw(g, k, t, p, s) { ... }       // k = step index, t = 0..1 progress into step k, p = control values
});
```
The runtime draws the chrome: a thin step strip under the figure (click a segment, or use the keys), arrows on the figure edges on hover, and one line of controls. Each control shows as `label value`; the reader drags the value sideways or uses the hidden slider. You never place controls yourself.
Keys come free on every page: ← → step back and forth (also while a slider is focused; on an article page they move the figure last touched, or the one in the middle of the screen), ↑ ↓ nudge a focused slider, `i` opens the sidebar. Never add your own `keydown` handlers or stop key events: they break this.

**Sidebar (`info`).** The i button opens a panel on the right. Scene `info` and step `info` merge (step keys win; notation tables join):
```js
info: { see: ['Arrow: the gap between the averages'],          // what you see, ≤ 3 points
        notation: { SE: ['standard error: how much the gap wobbles', 'the right bar, 0.51 at the start'],   // [meaning, example from the figure]
                    'p_{(k)}': ['k-th smallest p-value', 'p_{(1)} = 0.0004, the leftmost dot'] },  // ≤ 6 rows; keys with \ _ ^ { render as maths
        read: ['More samples, smaller SE'],                      // how to read it, ≤ 3 points
        try: 'Set **true effect** to 0 and press *new samples*.', // one line
        more: 'longer background, collapsed under "Deeper"' }
```
Each notation row shows as `symbol : meaning` with `e.g. example` on the next line. Write every row as `[meaning, example]`, the example taken from the figure at its starting values; the audit fails a row without one. Operators count too: write `'\\sum_i': ['add up over every gene', '120 + 30 + 850 = 1,000']`. A plain `info` string also works (one paragraph). Keep each step ≤ 120 words (examples do not count); the audit counts.

**Panels: one figure per step.** List the panels and the step each arrives at (`from`, optional `to`). Draw each one with `g.panel(id, box => { ... })`: it runs only while that panel is on screen, fades it in on arrival and out on leaving, and `box = { x, y, w, h }` is already animated between steps, with room for tick labels inside. Pass it straight to axes: `g.axes({ ...box, xd, yd })`.
Only one panel is on screen at a time: when the next arrives, the current one slides away and the new one takes the whole stage. Give each panel its own `from`; two panels starting on the same step fail the audit. The audit also fails any step with more than one plot (including a two-axes `svgfile` or axes split by hand), any plot under 440 stage units wide (`minPlotW`) or 300 tall (`minPlotH`), and any text above size 36. Size marks inside a panel (dot jitter, average lines, bar widths) in stage units, not data units. Options: `panelPad` ({ l: 90, r: 30, t: 70, b: 80 }), per-panel `pad`.
```js
panels: [{ id: 'data', from: 0 }, { id: 'bars', from: 2 }, { id: 't', from: 3 }],   // steps 1–2 'data', step 3 'bars', step 4 't'
draw(g, k, t, p) { g.panel('data', D => { const A = g.axes({ ...D, xd: [0, 2], yd: [0, 10] }); ... }); g.panel('t', P => { ... }); }
```
`draw` is called for every frame. Draw the whole picture each time from `k`, `t`, `p`. Keep it pure: no state between calls. For randomness create `const r = Proff.rng(seed)` inside `draw` (bump the seed from `s.seed`, which the `reseed` button increments), so every frame redraws the same data.

Reveal helper used in the exemplars: `const on = (k, j, t) => k > j ? 1 : k === j ? t : 0;` then `g.fade(on(k, 2, t), g => { ... })`.

## Study blocks (layout 'article')
`Proff.section(name)` · `Proff.tiles([{ tag, big, h, text, acc }])` · `Proff.compare(head, rows)` · `Proff.quiz([{ q, a, tag }])` · `Proff.prose(text)`. Text is markdown-lite: `**bold**`, `*italic*`, `` `code` ``, blank line = new paragraph, `- ` = list.

## Drawing (`g`, same on SVG and Canvas)
Colours: `'c1'..'c6'` accents, `'f1'..'f6'` soft fills of the same hues, `'ink' 'muted' 'dim' 'line' 'grid' 'fig' 'surf' 'surf2'`. Never hex.
Common options: `fill, stroke, sw` (stroke width), `op` (opacity), `dash: true`, `r` (corner radius).

| Call | Notes |
|---|---|
| `g.rect(x, y, w, h, o)` · `g.circle(cx, cy, r, o)` · `g.ellipse(cx, cy, rx, ry, o)` | filled shapes are registered for the audit |
| `g.line(x1, y1, x2, y2, o)` · `g.poly(pts, o)` (`close: true`) · `g.path(d, o)` | lines are audited against text |
| `g.arrow(x1, y1, x2, y2, o)` | `bend`, `pad` (trim ends), `head`; the head takes the `stroke` colour |
| `g.text(x, y, s, o)` | `size` (labels 20; minimum 18, tick labels and table headers 16; maximum 36), `weight`, `anchor: 'start'|'middle'|'end'`, `mono`, `halo` (outline so it reads over lines), `\n` for lines |
| `g.label(x, y, s, { to: [x, y], lc })` | text with a leader line to the thing it names; use instead of text squeezed next to a shape |
| `g.tex(x, y, latex, o)` | KaTeX formula (SVG scenes only) |
| `g.brace(x1, y1, x2, y2, label, o)` | curly brace; label on the outside |
| `g.axes({ x, y, w, h, xd, yd, xt, yt, xl, yl, fmtx, fmty, log, grid })` | returns `ax` with `ax.sx(v)`, `ax.sy(v)`, `ax.x/y/w/h`; fix `xd`/`yd` to the full control range. `xl` sits below the tick labels (~2.6 × size under the axis); `yl` sits above the top-left corner (~1.2 × size above `y`), so leave room above a stacked panel |
| `g.curve(f, ax, a, b, o)` · `g.area(f, ax, a, b, o)` · `g.bars([[x, v]], ax, o)` · `g.dots(pts, ax, o)` | quick charts on `ax` |
| `g.matrix(x, y, data, { cw, ch, rows, cols, fmt, cell(i, j, v) => ({ fill, text }), title })` | numeric table |
| `g.svgfile(name, x, y, w, h)` | a `plot.py` figure; returns `[A]` mappers per axes: `A.sx(v)`, `A.sy(v)` in data units |
| `g.img(file, x, y, w, h)` | an image from `img/` |
| `g.group({ x, y, s, op }, g => ...)` · `g.fade(op, g => ...)` | move/scale/fade a group |

`free: true` removes a shape from the audit. Use it only for containers that are meant to hold text (a cell, a box behind a label). **Never use it to silence a warning**: move the text instead.

## Biology (`kit/bio.js`, loads automatically)
| Call | Returns / notes |
|---|---|
| `g.dna(x, y, { seq, bw, hi: [[from, to, colour]], cut, cutShift, open: [a, b], sep, single, ends })` | `{ x(i), cx(i), top, bot, mid, w, h }`; letters coloured by base (A c4, C c1, G c2, T c3); `open` + `sep` part the strands; `cut` splits at index |
| `g.rna(x, y, o)` | single strand, T → U |
| `g.guide(x, y, { seq, bw, color, scaffold, ss })` | sgRNA: spacer letters + folded scaffold; `{ x(i), cx(i), end, w }` |
| `g.cas9(cx, cy, { w, h, label })` | one soft protein body the DNA passes through; put its edges between letters |
| `g.cell(cx, cy, r, { nucleus, dna, fill, stroke })` · `g.nucleus(cx, cy, r)` | |
| `g.virus(cx, cy, r)` · `g.plasmid(cx, cy, r, { parts: [{ from, to, color }] })` | plasmid returns `at(f, k)`: point at fraction `f` of the ring, `k` × radius |
| `g.tube(x, y, h, { level, fill })` · `g.dish(cx, cy, r, { cells, seed, color })` · `g.flowcell(x, y, w, h, { lanes, n })` | lab objects |
| `g.read(x, y, { w, h, parts: [{ len, color, text }] })` | a sequencing read as labelled segments; `parts[i].x0/x1` for braces. Segment text is audited: never put your own label on top of a segment, use `g.brace` above or below |

## Maths helpers
`Proff.rng(seed)` → uniform 0–1 generator · `Proff.stat.{normPdf, normCdf, tPdf, binomPmf, poisPmf, nbPmf, gammaPdf, betaPdf, normal(r) → normal-sample generator, mean, sd, lgamma, erf}` · `Proff.lerp, ease, clamp, range(a, b, n), fmt(v)`.
