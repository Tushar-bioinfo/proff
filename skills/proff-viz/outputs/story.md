# story page: a few figures, each making one point

Exemplar `examples/story-logcounts`. Layout `walk` (one stage, one slider over all steps). Usually no controls.

## Shape
- `make_plots.py` simulates or loads the data, draws each plot with `scripts/plot.py`, and writes `data/facts.json` with every number the captions quote.
- Each scene = one figure = one claim in its headline ("Noise grows faster than the mean"). As many scenes as the arc needs (often 3–6).
- A figure can be a `plot.py` SVG or drawn with the kit (`g.units`, `g.axes`, `g.matrix`, shapes) when the idea is a count, a proportion, or a diagram.
- Steps reveal one annotation each: a brace over a range, a leader label on one point, a reference line. Annotations are placed in **data units** with the mappers `g.svgfile` returns: `const [A] = g.svgfile('hist', 0, 0, 1200, 675); A.sx(100), A.sy(0.5)`.

## plot.py rules
- `from plot import fig, save, C`. Colours only from `C.c1..c6, C.ink, C.muted, C.grid` (they become theme variables). A raw hex colour prints a warning.
- Mono theme: `C.c2` for the series that matters now, `C.muted` for the rest. Tell a third series apart by hatch, dash or marker, not by a hue. The audit cannot see colours inside a plot SVG, so check this yourself.
- One line per tick label. Put a second line in the axis title or a `g.note`; the audit reads stacked tick lines as an overlap.
- `fig()` is 12 × 6.75 in = the 1200 × 675 stage, one axes per figure (no `ncols`/`nrows` subplots; a second plot is its own SVG on the next step). Label axes with units. Leave headroom (`ylim` × 1.3) where annotations will go.
- Keep SVGs small: a few hundred points show a pattern; `save` warns above 300 KB.
- Integer data on a log axis: bin edges at half-integers, or the low bins show gaps.
- Quote numbers in captions from `PROFF_DATA.facts`, never typed by hand.
