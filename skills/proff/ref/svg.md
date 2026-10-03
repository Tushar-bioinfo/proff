# SVG kit — hand-made diagrams for `svg` slides

Style: dark card, thin white pen lines, soft colour fills, short labels. Write raw SVG. The deck's CSS styles it; **never set colours, fonts, or stroke widths inline.**

## Canvas
- `<svg viewBox="0 0 1200 640">` (up to 720 tall). Keep everything inside x 40–1160, y 40–600.
- Text is 34 units by default. Use `small` (27) for minor labels. Never smaller. ≤ 6 words per label.
- Leave empty space. 3–8 labelled things per diagram. One idea per diagram; use more diagrams, not a busier one.

## Classes
| class | does |
|---|---|
| `ln` | white stroke, no fill (add a fill class to fill it) |
| `thin` · `dash` · `arr` | thinner line · dashed · arrow head at the end |
| `f1`–`f6` | soft fill (26 % colour) for areas, cells, bars |
| `c1`–`c6` | solid fill: dots, small markers, coloured text |
| `s1`–`s6` | coloured stroke |
| `big` · `bold` · `small` | 104-unit number · bold · small muted label |
| `mid` · `end` | centre / right-align text (`text-anchor`) |
| `mono` | monospace text (formulas) |

Aurora colours: 1 teal · 2 lime · 3 violet · 4 pink · 5 sky · 6 peach. Other palettes change them, so **in captions name shapes, not colours** ("the ringed dots", "the filled area"). Use teal (`f1`) for the main area.

## Build it step by step
Add `"steps": ["caption 1", "caption 2", ...]` to the slide. Captions sit beside the diagram; arrows, space, or a click walk through them.
- `data-step="k"` on any element: appears at caption k and stays.
- `data-only="k"`: shown at caption k only. Use it for a thing that **moves** (draw it once per position).
- No attribute: always shown (the stage: axes, membrane, labels).
- Numbers match the caption numbers (1, 2, 3...). Wrap a group in `<g data-step="2">...</g>`.
- The last step must show the whole story. A moving thing's final position uses `data-step`, not `data-only`.
- Use 3–6 steps. Each caption is 1–2 STE sentences and says what just appeared.

## Patterns
Axis and curve (compute the points; do not guess a bell curve by hand):
```svg
<line class="ln" x1="110" y1="470" x2="1090" y2="470"/>
<path class="f1" d="M277 470 L... Z" data-step="2"/>   <!-- shaded area under the curve -->
<path class="ln" d="M120 465 L... "/>                    <!-- the curve on top -->
<text class="mid" x="600" y="520">true mean</text>
```
Cell, membrane, receptor, ligand:
```svg
<path class="ln f5" d="M60 400 Q600 340 1140 400 L1140 620 L60 620 Z"/>       <!-- cell, membrane on top -->
<line class="ln" x1="600" y1="372" x2="600" y2="312"/>
<path class="ln c3" d="M572 312 L628 312 L616 286 L584 286 Z"/>               <!-- receptor -->
<g data-only="1"><circle class="ln f4" cx="300" cy="150" r="70"/>
  <path class="ln thin dash arr" d="M400 200 Q500 230 560 270"/></g>          <!-- ligand approaches -->
<g data-step="2"><circle class="ln f4" cx="600" cy="190" r="70"/></g>          <!-- bound, stays -->
```
Boxes and arrows (a pathway or a pipeline):
```svg
<rect class="ln" x="80" y="260" width="240" height="110"/><text class="mid" x="200" y="325">gene</text>
<path class="ln arr" d="M330 315 L450 315"/><text class="small mid" x="390" y="295">transcribed</text>
```
Bars: `<rect class="f1" x=".." y=".." width="34" height=".."/>`, baseline `ln` on top. Dots: `<circle class="ln thin f3" r="25"/>` with a centred `small` number inside; a ring (`s2`) marks a special one.
A study interval: a `ln s2` line with short end ticks and a `c2` dot at the estimate.

## Check
`snap.py` warns when SVG text spills outside its diagram. Fix the coordinates and re-render. Look at the slide once.
