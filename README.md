# Proff-viz

A first-principles tutor that ends in finished, checked visuals.

- **L1**: short answer, example, caveat. **L2**: predict first, diagrams, concepts, exam angle. **L3**: the full text lesson with ASCII flowcharts and calculation breakdowns. **L4**: visuals.
- **L4 visuals**: a page by default; ask for a step-by-step calculation (calc), a biology workflow (walk), or a card deck (facts, different angles, transfer to new settings, quiz; `examples/deck-bootstrap.json`). Pages are one self-contained HTML file each:
  | type | for | exemplar |
  |---|---|---|
  | explore | sliders that move linked pictures (stats, maths, models) | `examples/explore-ttest`, `examples/explore-fdr` |
  | story | a few figures (plots or kit drawings), one point each | `examples/story-logcounts` |
  | calc | a small table changing cell by cell | `examples/calc-cpm` |
  | walk | a process from molecules to the data table | `examples/walk-crispr` |
  | study | only on request: facts, abbreviations, flip-card questions around one live figure | `examples/study-fdr` |
- **Choices, not one template** (`ref/styles.md`): themes, figure layouts, and story arcs (ladder, puzzle first, follow one unit, two ways, zoom, mistake → fix, dial, decision). Agents pick per question and may move, add, or recolour within the design floor (`ref/design.md`).
- **Budget**: efficient (default, all local) or premium (adds one text-free context image and an independent review).
- **Checks**: every step and slider extreme in a desktop browser (dark only): text overlaps, lines through labels, off-figure text, tiny or oversized text, low contrast, word budgets, wrapped headlines, repeated frames, plus contact sheets to look at.
- **Theme** `mono` by default: ink and greys with one orange accent for what matters now (the answer, the cells being read, the hero number). Decks use the same greys and orange. `lab`, `cyan`, `blockframe` and `neon` stay selectable. Tables use one cell size per page, a graphite ramp, and a slow cell-by-cell fill. The `i` sidebar explains every symbol as `symbol : meaning` with an example from the figure.
- Quiz and guide modes; STE-80 writing; say `plain` for normal prose.

## Make a page
```
mkdir -p my-topic/data && cp skills/proff-viz/examples/walk-crispr/make_data.py my-topic/   # then write my-topic/story.js
export PROFF_SCRIPTS=$PWD/skills/proff-viz/scripts
python3 my-topic/make_data.py
python3 skills/proff-viz/scripts/build.py my-topic
python3 skills/proff-viz/scripts/check.py my-topic/page.html
```
`check.py` needs Playwright with Chromium. `plot.py` needs matplotlib and numpy. Pages load fonts and (only when used) KaTeX 0.16.11, d3 7.9.0, p5 1.9.4 from public CDNs; decks load KaTeX 0.18.9 and mermaid 11.15.0 when used.

## Skill files
- `SKILL.md` routing · `levels/` L2, L3, L4 · `viz.md` the page workflow · `outputs/` one file per page type, plus `deck.md`
- `ref/`: taste (the bar, before/after pictures, self-review), kit (API), design (limits table), tech (which tool draws what), budget, chains (full step chains), assets (licences), image, ideas/
- `kit/`: stage.js runtime, calc.js, bio.js, proff.css theme · `assets/`: the deck theme · `scripts/`: build, check, plot, calctrace, image, render + snap (decks)
- `examples/`: the five page exemplars (calc, story and walk with their data scripts) and one card deck

## Install
Claude Code:
```
claude plugin marketplace add Tushar-bioinfo/proff
claude plugin install proff-viz@proff-viz
```
Codex, Cursor, Gemini CLI, Antigravity and other Agent Skills harnesses: clone the repo and link `skills/proff-viz` into the harness skills folder (`~/.codex/skills`, `~/.cursor/skills`, `~/.gemini/skills` or `gemini skills link`, `~/.gemini/antigravity/skills`, `~/.agents/skills`). A `git pull` then updates every harness.

claude.ai: upload `dist/proff-viz-claude.zip` (plugin) or `dist/proff-viz-chatgpt.zip` (single skill folder). ChatGPT: `dist/proff-viz-chatgpt.zip`, or `dist/proff-viz-instructions.md` for text only. Build with `tools/build.sh`.

## Working on the plugin
See `AGENTS.md` and `docs/`. Run `tools/check-all.sh` to rebuild and audit every example.
