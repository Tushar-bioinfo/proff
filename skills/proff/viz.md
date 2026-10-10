# Pages: one finished HTML file per request

`S` = this skill's folder. Every page uses the same runtime (`kit/`), theme, and checks. You write only `story.js` (plus a data script when numbers are involved). Never write HTML or CSS by hand.

## 0. Budget mode
- **efficient** (default): kit drawing + matplotlib through `plot.py`. No paid images. No extra reviewers.
- **premium** (user says "premium", "best", "go all out"): may add one generated context image, a second review pass, and more scenes. Read `ref/budget.md` first.

## 1. Story source
The L3 write-up (`levels/L3.md` §1, items 1–6) is the source. If none exists this session, draft items 1–5 privately first.
Pick the points a reader must **see**. Each becomes one scene (the page type's file sets how many). Every number, term, and step in the write-up that matters must appear somewhere: in a scene, a caption, an info sidebar, or a study tile. Half a mechanism is a failed page.

## 2. Pick the page type, then open only its file
| Type | Use when | Open | Copy this exemplar |
|---|---|---|---|
| study | facts, abbreviations, angles, self-test; the topic is mostly ideas | `outputs/study.md` | `examples/study-fdr` |
| explore | a parameter changes the answer (stats, maths, models) | `outputs/explore.md` | `examples/explore-ttest` |
| story | a few real or simulated plots, each making one point | `outputs/story.md` | `examples/story-logcounts` |
| calc | a calculation on a small table, cell by cell | `outputs/calc.md` | `examples/calc-cpm` |
| walk | a physical or biological process, step by step, ending in data | `outputs/walk.md` | `examples/walk-crispr` |

Mixed request → one primary type. Add a second only as a later page, not mixed into one.
A card deck (facts, angles, transfer, quiz) is not a kit page: open `outputs/deck.md` instead.

## 3. Build loop (same for every type)
Read `ref/taste.md` first: the bar, real before/after failures, and the self-review you must run.

```bash
cp -R S/examples/<exemplar> <topic> && rm -rf <topic>/snaps <topic>/page.html <topic>/svg <topic>/data
python3 <topic>/make_*.py              # fixed numbers (sequences, counts, tables); explore pages simulate live in draw instead
python3 S/scripts/build.py <topic>     # -> <topic>/page.html (fails with a line number on a syntax error)
python3 S/scripts/check.py <topic>/page.html
```
`check.py` runs every step and every control extreme, in a desktop browser (phones are out of scope). It reports text overlaps, lines through labels, text crossing shapes, off-figure text, tiny text, low contrast, and text over budget. It also opens the i sidebar on every step (raw TeX, cut-off text) and checks a 1280 laptop with the sidebar open. It writes contact sheets to `<topic>/snaps/`: the figure frames and `sheet-sidebar-*.png`.

Build and check after the first 2 scenes, then add the rest. A full page written blind costs more rounds than it saves.

**Then run the self-review in `ref/taste.md`** on every sheet, frame by frame. The audit misses ugly shapes, wrong biology, empty space, wrong numbers, and pictures that do not teach. Fix, rebuild, recheck. Stop after 3 rounds on the same defect and report it.

## 4. Reply
One line: the page path, what it shows, and `check: 0 warnings · sheets viewed N/N · frames listed M` (or what was not checked). No summary of the page.
Then the L4 offer line (`levels/L4.md`).

## Required before writing story.js
- `ref/taste.md`: the bar and the self-review; again before reviewing.
- `ref/kit.md`: the drawing API (`g.*`, `Proff.*`).
- `ref/design.md`: the limits table, stage, colour meaning, motion.

## Reference (open only when needed)
- `ref/tech.md`: when to use SVG, Canvas, matplotlib, d3, p5, or an image model.
- `ref/chains.md`: full step chains for common topics (CRISPR screen, RNA-seq, tests, ML training).
- `ref/assets.md`: icon and image sources with licences.
- `ref/ideas/{stats,bio,ml}.md`: visual idea menus.
