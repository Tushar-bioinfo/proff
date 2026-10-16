# Pages: one finished HTML file per request

`S` = this skill's folder. Every page uses the same runtime (`kit/`), theme, and checks. You write only `story.js` (plus a data script when numbers are involved). Never write HTML or CSS by hand.

## 0. Budget mode
- **efficient** (default): kit drawing + matplotlib through `plot.py`. No paid images. No extra reviewers.
- **premium** (user says "premium", "best", "go all out"): may add one generated context image, a second review pass, and more scenes. Read `ref/budget.md` first.

## 1. Plan the story
Start from the story source (`levels/L4.md`, top). Then write a short plan in your notes:
- the **arc**, the **theme**, and one line per scene: its headline claim and its layout (menus in `ref/styles.md`);
- the rungs the target needs (`levels/L4.md`), and the step where each first appears.
Every number, term, and step in the write-up that matters must appear on a scene or in its sidebar. Half a mechanism is a failed page.

## 2. Pick the page type, then open only its file
| Type | Use when | Open | Exemplar |
|---|---|---|---|
| explore | a parameter changes the answer (stats, maths, models) | `outputs/explore.md` | `examples/explore-ttest`, `examples/explore-fdr` |
| story | a few plots or drawn ideas, each making one point | `outputs/story.md` | `examples/story-logcounts` |
| calc | a calculation on a small table, cell by cell | `outputs/calc.md` | `examples/calc-cpm` |
| walk | a physical or biological process, step by step, ending in data | `outputs/walk.md` | `examples/walk-crispr` |
| study | only when the user asks for a study or revision sheet | `outputs/study.md` | `examples/study-fdr` |

Mixed request → one primary type. Add a second only as a later page. A card deck is not a kit page: open `outputs/deck.md`.
The exemplar shows how to call the kit. Read it for code patterns; do not reuse its topic, numbers, scene order or captions.

## 3. Build loop (same for every type)
```bash
mkdir -p <topic>/data                  # copy only the data-script skeleton you need from the exemplar
python3 <topic>/make_*.py              # fixed numbers (sequences, counts, tables); explore pages simulate live in draw instead
python3 S/scripts/build.py <topic>     # -> <topic>/page.html (fails with a line number on a syntax error)
python3 S/scripts/check.py <topic>/page.html
```
`check.py` runs every step and every control extreme in a desktop browser, and the 1280 laptop view with the sidebar open. It reports overlaps, lines through labels, off-figure text, tiny or oversized text, low contrast, wrapped headlines, repeated frames, and text over budget. It writes contact sheets to `<topic>/snaps/`.

Build and check after the first 2 scenes, then add the rest. A full page written blind costs more rounds than it saves.
**Then run the self-review in `ref/taste.md`** on every sheet. The audit misses wrong biology, wrong numbers, empty space, and pictures that do not teach.

## 4. Reply
One line: the page path, what it shows, and the report line from `ref/taste.md` (or what was not checked). No summary of the page.
Then the L4 offer line (`levels/L4.md`).

## Read before writing story.js
`ref/styles.md` (choices) · `ref/design.md` (the floor) · `ref/kit.md` (the API) · `ref/taste.md` (failures and the self-review).

## Reference (open only when needed)
- `ref/tech.md`: when to use SVG, Canvas, matplotlib, d3, p5, or an image model.
- `ref/chains.md`: full step chains for common topics (CRISPR screen, RNA-seq, tests).
- `ref/assets.md`: icon and image sources with licences.
- `ref/ideas/{stats,bio,ml}.md`: visual idea menus. `ref/ideas/dl-notation.md`: deep-learning paper notation.
