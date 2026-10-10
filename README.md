# Proff-viz

A first-principles tutor that ends in finished, checked visuals.

- **L1**: short answer, example, caveat. **L2**: predict first, diagrams, concepts, exam angle. **L3**: the full text lesson with ASCII flowcharts and calculation breakdowns. **L4**: visuals.
- **L4 visuals**: a page by default; ask for a step-by-step calculation (calc), a biology workflow (walk), or a card deck (facts, different angles, transfer to new settings, quiz; `examples/deck-bootstrap.json`). Pages are one self-contained HTML file each:
  | type | for | exemplar |
  |---|---|---|
  | study | facts, abbreviations, angles, flip-card questions, one live figure | `examples/study-fdr` |
  | explore | sliders that move linked pictures (stats, maths, models) | `examples/explore-ttest` |
  | story | annotated matplotlib plots, one point per plot | `examples/story-logcounts` |
  | calc | a small table changing cell by cell (3 genes × 4 samples) | `examples/calc-cpm` |
  | walk | a process from molecules to the data table | `examples/walk-crispr` |
- **Budget**: efficient (default, all local) or premium (adds one text-free context image and an independent review).
- **Checks**: every step and slider extreme in a desktop browser (dark only): text overlaps, lines through labels, off-figure text, tiny text, low contrast, word budgets, plus contact sheets to look at.
- **Palette** "blockframe" (Block Frame pastels on black, quiet grey frames), shared by pages and decks. The `i` sidebar explains every symbol as `symbol : meaning` with an example from the figure.
- Quiz and guide modes; STE-80 writing; say `plain` for normal prose.

## Make a page
```
cp -R skills/proff/examples/walk-crispr my-topic && rm -rf my-topic/snaps my-topic/page.html
export PROFF_SCRIPTS=$PWD/skills/proff/scripts
python3 my-topic/make_data.py
python3 skills/proff/scripts/build.py my-topic
python3 skills/proff/scripts/check.py my-topic/page.html
```
`check.py` needs Playwright with Chromium. `plot.py` needs matplotlib and numpy. Pages load fonts and (only when used) KaTeX 0.16.11, d3 7.9.0, p5 1.9.4 from public CDNs; decks load KaTeX 0.18.9 and mermaid 11.15.0 when used.

## Skill files
- `SKILL.md` routing · `levels/` L2, L3, L4 · `viz.md` the page workflow · `outputs/` one file per page type, plus `deck.md`
- `ref/`: taste (the bar, before/after pictures, self-review), kit (API), design (limits table), tech (which tool draws what), budget, chains (full step chains), assets (licences), image, ideas/
- `kit/`: stage.js runtime, calc.js, bio.js, proff.css theme · `assets/`: the deck theme · `scripts/`: build, check, plot, calctrace, image, render + snap (decks)
- `examples/`: the five page exemplars (calc, story and walk with their data scripts) and one card deck

## Install
```
claude plugin marketplace add <path or repo>
claude plugin install proff-viz@proff-viz
```
claude.ai: upload `dist/proff-viz-claude.zip`. ChatGPT: `dist/proff-viz-chatgpt.zip`, or `dist/proff-viz-instructions.md` for text only. Build with `tools/build.sh`.
