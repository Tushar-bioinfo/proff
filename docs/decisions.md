# Decisions

Newest first. Each entry: what, why, where. Read before you reverse something.

## v5.0.0 (2026-10-16)
- **Default theme `mono`: ink and greys plus one orange accent (`c2` #ff5a36)** for the answer, the cells being read, and the hero number. From the restyle of the 16 L4 decks in `my-notes/Visuals` (user-approved look, reference video for style only). The user confirmed "grey plus orange" as the default template; a second series uses a dash, a shape or a lighter grey, not a second hue. Palette tokens c1, c3–c6 stay hues so biology drawings (DNA bases, guides) keep their identity colours. Where: `kit/proff.css`, `ref/styles.md`, `ref/design.md`.
- **Tables: one cell size per page, graphite ramp, flat fill for signed tables, orange read outline and header bar, stacked (G+D) calc layout, slow cell-by-cell wave, formula operands at the precision the arithmetic needs.** Where: `kit/calc.js`, `kit/stage.js` (`g.matrix`). User picks from the restyle rounds; do not bring back diverging fills or ▲/▼ marks.
- **Bigger figure text: `Proff.textBoost = 4`** (was 2); `g.note` 26, ticks 19, axis titles 24, hero 56–72. Sizes now live once, as drawn sizes, in `ref/design.md`.
- **Choices instead of one template.** `ref/styles.md` offers themes, figure layouts and story arcs as menus; `ref/design.md` holds the fixed floor. Why: the v5 template notes said "replicate, do not re-solve" with exact coordinates, and the ladder rule read as "every page opens on small numbers", so pages converged on one shape. The ladder is now a constraint (no idea before its step) that every arc keeps. Exemplars are read for code patterns, not copied (`viz.md`).
- **Study page only on request.** L4 pages are figures; tiles, abbreviation tables and quizzes around the stage were text clutter in the restyle review. Definitions go in the sidebar; quizzes go to quiz mode or a deck. The kit keeps the study blocks. Where: `levels/L4.md`, `viz.md`, `outputs/study.md`.
- **Fewer tokens per page.** Rules that appeared in 2–4 files (show it, one figure per step, sizes, captions) now live in one file each; stale change-log notes left `ref/kit.md` (20 KB → 12 KB). The L4 reading path for one page went from about 44 KB (patched v5 kit) to about 36 KB, including the new `ref/styles.md`.
- **Decks default to `mono` too** (user, 2026-10-16). `render.py` `mono` is now greys plus the page orange (`p2` #ff5a36); the old violet deck set is kept as `violet`. Text on solid cards is #0a0a0b, ≥ 5:1 on every slot.
- **New audits: wrapped headline, repeated frame; calc show steps can mark cells.** Where: `scripts/check.py`, `kit/stage.js`, `kit/calc.js`.

## v4.1.0 (2026-10-11)
- **"Build it from the ground" applies to L4 visuals only.** The rule: never ask the reader to picture it or already know it; climb a ladder of small ideas with real numbers before the target (worked example: maximum likelihood from one toss → joint probability → likelihood → peak → logs → calculus). First written for every level, then narrowed by the user to L4: L1–L3 and guide mode stay as they were. Where: `levels/L4.md` ("Show it"), pointed to from `viz.md`, `ref/design.md`, `ref/taste.md`, `outputs/deck.md`. Reference chain in `ref/chains.md` ("Maximum likelihood"), visual idea in `ref/ideas/stats.md`.
- **Audit flags "picture it" words** in captions and the sidebar ("imagine", "picture this/it", "clearly", "obviously", "of course", "it is easy to see", "as you know", "intuitively", "trivially"). It is a warning, so it shows in `check-all.sh`. Where: `kit/stage.js`, `Proff.audit`.
- **Figure text +2** via one setting, `Proff.textBoost = 2`, so agents keep writing the same sizes and the audit limits do not move. Matplotlib +2 to match. Details and the fixes it needed: `docs/design-system.md`.
- **Default palette "cyan"** (cyan blue, cyan green, amber highlight). Asked for by the user ("cyan blue, cyan green or their hues"). Also fixed a real problem: the old main and treated colours were nearly identical for red-green colour-blind readers. Old pastels kept as `palette: 'blockframe'`. Deck default and image prompts switched too. Numbers: `docs/design-system.md`.
- **Workshop folder.** Plugin development moved to `proff-viz-dev` with `AGENTS.md` and `docs/`; this folder is not for making topic pages or decks.

## v4.0.2 (2026-10-10)
- **One figure per step**, no side-by-side plots. The audit fails two plots in one step, two panels starting on the same step, and plots under 440 × 300 stage units.

## v4.0.1 (2026-10-10)
- Skill folder renamed to `proff-viz` to match the skill name. Install notes for Codex, Cursor, Gemini, Antigravity, claude.ai.

## v4.0 (2026-10-10)
- L3 became the full text lesson (ASCII flowcharts, calculation breakdowns); L4 became finished visuals: study, explore, story, calc, walk pages and a card deck, built on the checked kit runtime.

## v3.x (2026-10-02 to 10-03)
- v3: L1/L2/L3 tutor with interactive decks, quiz and guide modes. v3.1: SVG kit with step builds, image on request. v3.1.1: layout check for nav-bar overlap and cut-off text. v3.2: paper-style maths with notation box, idea files per field, deck-only and team modes.
The older history lives in `../proff` (remote `proff-local`).
