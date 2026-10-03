# SVG kit

Style: dark card, thin white lines, soft fills, short labels. Write raw SVG; CSS supplies colours, fonts, stroke widths.

## Canvas
- `<svg viewBox="0 0 1200 640">` (up to 720 tall). Stay inside x40–1160, y40–600.
- Text: 34 units; `small`: 27. Never smaller. Labels ≤6 words.
- Leave space. 3–8 labelled objects, one question per diagram.

## Classes
| class | does |
|---|---|
| ln | white stroke, no fill; add a fill class |
| thin · dash · arr | thinner · dashed · arrowhead |
| f1–f6 | soft fills, 26% colour |
| c1–c6 | solid fills or coloured text |
| s1–s6 | coloured strokes |
| big · bold · small | 104-unit number · bold · muted label |
| mid · end | centre · right text alignment |
| mono | monospace formulas |

Aurora: 1 teal · 2 lime · 3 violet · 4 pink · 5 sky · 6 peach.
Palettes vary. Captions name shapes (“ringed dots”, “filled area”), not colours.

## Build step by step
Add `steps: ["caption 1", ...]`. Captions sit beside the diagram.
- `data-step="k"`: appears at k, stays.
- `data-only="k"`: only at k; draw a moving object once per position.
- No attribute: always visible stage, axes, labels.
- Group related objects: `<g data-step="2">...</g>`.
- Last step shows the whole story; final positions use `data-step`.
- 3–6 steps; each caption has 1–2 short sentences about the new part.

## Mechanics
Compute curve points (Python if available); never guess them. Use `ln arr` for arrows.
Put labels beside their objects. Small numbers inside dots use `small mid`.
```svg
<rect class="ln" x="80" y="260" width="240" height="110"/>
<path class="ln arr" d="M330 315 L450 315"/>
```

## Design moves
Defaults, not limits: set the stage, then add one thing per step. Compare with shared axes and scale; change one thing.
Emphasise one object with a fill or ring; keep others thin. Direct labels by default; use a legend for many series sharing colours.
Ghost the old state with `dash`. Use computed numbers. The final step shows the full story.

## Check
`snap.py` flags SVG text outside its diagram. Fix coordinates and render again. Look once at `snaps/svg.png`.
