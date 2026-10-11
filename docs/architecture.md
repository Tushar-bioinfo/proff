# How the plugin is put together

## The reading path of an agent using the plugin
```
SKILL.md ── L1 answered here (no other file)
   ├─ levels/L2.md      diagrams in chat
   ├─ levels/L3.md      full text lesson with ASCII figures
   ├─ levels/L4.md      picks the visual; holds the "build it from the ground" rule
   │     ├─ viz.md      the page workflow (story plan → data → story.js → build → check)
   │     │     └─ outputs/{study,explore,story,calc,walk}.md   one file per page type
   │     └─ outputs/deck.md   card deck (render.py + snap.py)
   ├─ modes/quiz.md, modes/guide.md
   └─ ref/image.md      only when the user asks for an image
```
An agent reads only the files its level needs. Keep `SKILL.md` short: every line there is read on every question.

## Where a new rule belongs
| The rule is about | Put it in |
|---|---|
| every answer at every level (writing style, sources) | `SKILL.md` |
| one level | that level's file in `levels/` |
| every L4 visual (pages and decks) | `levels/L4.md` |
| every page | `viz.md`, plus `ref/taste.md` if it is a quality bar |
| one page type | `outputs/<type>.md` |
| sizes, limits, colours | `ref/design.md` (and `docs/design-system.md` for the why) |
| the kit's functions | `ref/kit.md` |
| something the audit can catch | the audit in `kit/stage.js` (`Proff.audit`), then say so in `ref/taste.md` |

## The reference files (`skills/proff-viz/ref/`)
- `taste.md` (+ `taste/*.png`): the quality bar, before/after pictures, and the self-review steps.
- `kit.md`: the `story.js` API. `design.md`: limits, sizes, the colour roles. `tech.md`: which tool draws what.
- `chains.md`: full step chains for common topics (t-test, maximum likelihood, model training…).
- `ideas/{stats,bio,ml,dl-notation}.md`: menus of visual ideas per field.
- `budget.md`: efficient vs premium. `assets.md`: licences. `image.md`: the image prompt.

## The runtime (`skills/proff-viz/kit/`)
- `stage.js`: scenes, steps, panels, controls, the sidebar, drawing calls (`g.*`), and the audit (`Proff.audit`) that `check.py` reads.
- `calc.js`: calc pages (replays a `calctrace.py` trace cell by cell). `bio.js`: DNA, guides, cells, lab objects.
- `proff.css`: the theme. Colour tokens `--c1..--c6`, `--ink`, `--muted`, `--dim`, and palette presets via `data-palette`.

## The scripts (`skills/proff-viz/scripts/`)
| Script | Does |
|---|---|
| `build.py FOLDER [-o page.html]` | inlines the kit, theme, data, and figures into one HTML page |
| `check.py page.html [--out DIR]` | opens the page in Chromium, steps through every step and control extreme, prints `WARN` lines, writes contact sheets. Exit 0 clean, 1 warnings, 2 could not run |
| `plot.py` | matplotlib with theme tokens; `save()` turns colours into CSS variables |
| `calctrace.py` | records a calculation on small tables for calc pages |
| `render.py spec.json -o deck.html` | card deck from a JSON spec. `snap.py deck.html` checks it |
| `image.py` | asks Codex for a text-free context image |
| `log.py` | quiz score log |

## The examples (`skills/proff-viz/examples/`)
They are the exemplars agents copy, and also the regression tests.
| Example | Covers |
|---|---|
| `study-fdr` | study page: tiles, compare table, flip quiz |
| `explore-ttest` | explore page: sliders driving linked figures |
| `story-logcounts` | story page with `plot.py` SVGs (`make_plots.py`) |
| `calc-cpm` | calc page from a `calctrace.py` trace (`make_trace.py`) |
| `walk-crispr` | walk page with `bio.js` (`make_data.py`) |
| `study-notation`, `study-dl-notation` | maths notation pages (work in progress, see `docs/backlog.md`) |
| `deck-bootstrap.json` | card deck |
To regenerate an example's data, run its `make_*.py` with `PROFF_SCRIPTS` set (see `docs/testing.md`).
