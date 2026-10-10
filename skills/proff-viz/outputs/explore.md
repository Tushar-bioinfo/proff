# explore page: move a parameter, watch everything respond

Copy `examples/explore-ttest`. Layout `article`. One page = 1–3 scenes; each scene = linked panels driven by the same controls.

## Shape of a scene
- 2–4 **controls** (`{name, label, min, max, step, value}` sliders; `{type:'button', name:'reseed', label:'new samples'}` for new random data; each press adds 1 to `s.seed`, so draw with `Proff.rng(1000 + s.seed)`). Slider for a continuous quantity; button for a discrete switch.
- 2–3 **panels** that all read the same `p` (params), never more than 2 on screen at once (`panels` retires the oldest; see `ref/kit.md`): e.g. raw data → summary → where it lands on a distribution. One control should move several pictures.
- 3–5 **steps** that add one layer each: data, then the signal, then the noise, then the statistic, then the p-value. The page must still teach with nobody touching it.
- Numbers on the figure are computed in `draw` from `p` with `Proff.stat` (`normPdf, normCdf, tPdf, binomPmf, poisPmf, nbPmf, gammaPdf, betaPdf, normal, mean, sd`) and `Proff.rng(seed)`. Never hard-code a result. An explore page usually needs no `make_*.py`: simulate inside `draw`. Use a data script only for a fixed real dataset.

## Rules
- Ask before you show: a caption like "What happens to t if n doubles? Try it." comes one step before the step that shows it.
- Show abbreviations spelled out the first time they appear (in the caption or the `info` sidebar): "**SE** (standard error)".
- Every control extreme must still look right: `check.py` renders min and max of every slider. Choose ranges where the axes still fit (fix axes to the full range, never auto-rescale per frame).
- Same colour = same thing across panels (control group c1 everywhere, treated c2 everywhere).
- Simulation-heavy (more than ~5,000 marks per frame) → `kind: 'canvas'` on the scene; see `ref/tech.md`.
