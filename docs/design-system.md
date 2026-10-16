# Design system: colours and text

The rules agents follow are in `skills/proff-viz/ref/design.md` and `ref/kit.md`. This file holds the reasons and the numbers behind them.

## Colours: the "mono" theme (default since v5.0.0)
Ink `#f2f2f0`, muted `#b6b4ad`, dim `#85837d` on the figure; one accent `c2` `#ff5a36` (also the page title, step strip and sidebar tint). Tables: graphite ramp `#202124` → `#4a4f58` (OKLab), stretched per table; pending `#161719`; signed tables flat `#2b2d31`; read cells get a 3-unit accent outline. Hues c1 `#7fb0ff`, c3 `#5fdcc4`, c4–c6 stay available for identity colours (biology drawings) and for `lab`-style pages. The reasoning: one hot accent on a grey base makes "what matters now" obvious on every step; the user confirmed grey plus orange as the default.

Decks: `scripts/render.py` `PALETTES["mono"]` = `#d6d4ce #ff5a36 #b6b4ad #ffb27f #e8e6e0 #85837d` (p1–p6; p2 is the orange). Change it with the page tokens.

## Colours: the "cyan" palette (default 2026-10-11 to v5.0.0)
Mostly cyan blue and cyan green, one warm colour for the single highlight, on near-black.
| Token | Hex | Role |
|---|---|---|
| c1 | `#72c9f5` | cyan blue: the main subject, control group |
| c2 | `#f3a833` | amber: the one highlight (PAM, the answer, the cut). The only warm colour; use sparingly |
| c3 | `#6bebb6` | cyan green: the change, the treated group |
| c4 | `#4f91f0` | deeper blue: a second subject |
| c5 | `#c7ebee` | pale aqua: background structure |
| c6 | `#8f99a4` | slate: neutral, "everything else" |
Base: `--fig #111316` (figure), `--bg #0a0b0d`, `--ink #f0fbff`, `--muted #a3b1bb`, `--dim #6b7882`.

Where it is set: `kit/proff.css` (`:root`), `scripts/render.py` (`PALETTES["cyan"]`), `scripts/image.py` and `ref/image.md` (image prompt colours). Change all of them together.

### Why these hues
Picked by search, scored on how far apart the colours look (CIEDE2000 colour difference, ΔE) for normal vision and for simulated red-green colour blindness (Machado 2009 model, full severity, deutan and protan).
- The old pastel set had main (c1) and treated (c3) only ΔE 6.9 apart for deutan readers: they looked almost the same. Its worst pair was ΔE 1.0.
- In "cyan", the pairs that carry meaning (c1–c3, c1–c2, c2–c3) are about ΔE 20 or more for every reader type; main vs treated is about 31.
- Cost: the cool colours c1, c4, c5, c6 sit only ΔE 15–18 apart. So `ref/design.md` says two of them must never carry a contrast alone: add a label, a dash, or a shape.

Contrast on the figure background `#111316` (WCAG ratio): ink 17.7, muted 8.5, dim 4.1, c4 5.9, c6 6.4.

### Other palettes
`Proff.page({ palette })` and `render.py --palette`: `blockframe` (the old pastels), `lab`, `neon`. Use only when the user asks.
Reference pictures of the older looks: `docs/img/palette-options.png` (frame colour trials), `docs/img/sidebar-preview.png` (pastel page with the sidebar). Both predate the cyan palette.

## Text size: `Proff.textBoost = 2` (v4.1; v5.0.0 uses 4, see `skills/proff-viz/ref/design.md` for drawn sizes)
The kit draws every figure text 2 units bigger than the `size` written in `story.js` (`g.text`, `g.tex`, `P.measure`). So `size: 20` shows as 22.
- The audit limits stay in written units (labels 20, minimum 18, ticks 16, maximum 36). Agents keep writing the same numbers.
- `free: true` text (letters inside their own box, like DNA bases) is not boosted, so it does not spill out.
- `g.matrix` shrinks a cell value or column header only if the boosted text would overflow its cell (`fit()`); this fixed 13 overlaps on `calc-cpm`.
- Matplotlib (`scripts/plot.py`) got the same +2: font 20, title 22, axis labels 20, ticks and legend 18, plus `axes.labelpad: 9` so the x-axis title clears the tick labels.
To tune the size later, change `P.textBoost` in `kit/stage.js` and the `rcParams` in `plot.py`, then run `tools/check-all.sh`.
