# Decisions

Newest first. Each entry: what, why, where. Read before you reverse something.

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
