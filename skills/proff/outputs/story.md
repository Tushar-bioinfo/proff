# story page: a few plots, each making one point

Copy `examples/story-logcounts`. Layout `walk` (one stage, one slider over all steps). No controls.

## Shape
- `make_plots.py` simulates or loads the data, draws each plot with `scripts/plot.py`, and writes `data/facts.json` with every number the captions quote.
- Each scene = one plot = one claim in its title ("Noise grows faster than the mean"). 3–5 scenes.
- Steps reveal one annotation each: a brace over a range, a leader label on one point, a reference line. Annotations are placed in **data units** with the mappers `g.svgfile` returns: `const [A] = g.svgfile('hist', 0, 0, 1200, 675); A.sx(100), A.sy(0.5)`.

## plot.py rules
- `from plot import fig, save, C`. Colours only from `C.c1..c6, C.ink, C.muted, C.grid` (they become theme variables). A raw hex colour prints a warning.
- `fig()` is 12 × 6.75 in = the 1200 × 675 stage. Label axes with units. Leave headroom (`ylim` × 1.3) where annotations will go.
- Keep SVGs small: a few hundred points show a pattern; `save` warns above 300 KB.
- Integer data on a log axis: bin edges at half-integers, or the low bins show gaps.
- Quote numbers in captions from `PROFF_DATA.facts`, never typed by hand.
