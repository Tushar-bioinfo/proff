# Taste: real failures, their fixes, and the self-review

Read this before writing `story.js` and again before reviewing the sheets. Limits and sizes are in `ref/design.md`; this file shows what breaking them looks like. Open a picture only when you are unsure what the defect looks like.

## Before → after
1. **A label on top of a segment** ([picture](taste/bad-label-on-segment.png)). Two words in one box are unreadable. `g.read` already writes the segment text; name a segment with `g.brace` above or below it.
2. **Text touching an end mark** ([picture](taste/bad-touching.png)). "3′" runs into "grabs poly(A)". Use `g.label(x, y, s, { to })` under the strand, or leave ≥ 12 units after the end mark.
3. **A wrong number in a legend** ([picture](taste/bad-legend-number.png)). "12+ cells" was meant to be "1 with 2+ cells". Build every legend from data in one template (`` `${n} with 2+ cells` ``), then read each one on the sheet as a sentence.
4. **Side notes piled in a corner** ([picture](taste/bad-side-notes.png)). Five loose facts compete with the figure. Keep the one number that is the point, next to what it describes; move the rest to `info`.
5. **Empty panels on step 1** ([picture](taste/bad-empty-panels.png) → [fix](taste/good-big-first-1.png)). Use `panels`: step 1 gets the whole stage, the next plot arrives later.
6. **Plots side by side** ([three](taste/bad-three-panels.png), [two](taste/bad-two-panels.png)). Thin axes, tiny ticks, a torn eye. One figure per step; carry the key number onto the next figure as a label (`t = 3.72`).
7. **Short plots under giant headings** ([picture](taste/bad-short-plots.png)). The headline already names the idea: drop per-panel headings.
8. **Good: labels with leaders** ([picture](taste/good-leaders.png)). Each note sits in open space and points at its letter.
9. **Text clutter.** Tiles, abbreviation tables and quizzes around the stage. Definitions go in the sidebar; quizzes go to quiz mode or a card deck.
10. **A click that changes nothing.** Two steps with the same figure, only a new headline. Every step adds, moves, or highlights something.
11. **A claim with no mark.** The headline says "the tail is 5%" but nothing on the figure is orange. Put the accent on the thing the headline claims.
12. **A small figure beside a big number.** The hero and its labels take the right half; the plot shrinks to a strip at the top left. The figure is the page: give it ≥ 60% of the width and most of the height, and put the hero in its open space.

## Self-review (required before you report)
Usage is not the constraint; mistakes are. **If you are a fast or low-cost model, run at least two full review rounds even when the first looks clean.**
1. `check.py` prints `0 warnings` (exit code 0). Any warning means not done.
2. Open **every** sheet image. For each frame (`s1.1`, `s1.2`, …) write one line in your notes: `frame · text you see · touching? · empty area > 1/3? · reads without its caption? · accent on the claim?`
3. Recompute every number on screen from the data or the code.
4. Read the sidebar sheet (`snaps/sheet-sidebar-*.png`): every symbol, index and operator named, with an example from the figure; nothing cut off.
5. Ladder check: list any step that uses an idea no earlier step showed; add a step for it.
6. Story check: say the arc you chose (`ref/styles.md`) in one line, and whether the last scene lands on a number the reader can use.
7. Fix, rebuild, recheck. Stop after 3 rounds on the same defect and report it.

Report line: `check: 0 warnings · sheets viewed N/N · frames listed M · arc <name>`. If you did not list every frame, write `not reviewed`.
