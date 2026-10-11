# Testing a change

## The one command
```
tools/check-all.sh                 # every example + the deck
tools/check-all.sh calc-cpm        # just one example
```
It rebuilds each example into `out/check/<name>/page.html`, audits it in Chromium, and prints one line per example with its warning count. A full run takes about 2 minutes. Exit 1 means at least one example has warnings.

**Baseline (2026-10-11):** every example 0 warnings, except `study-notation` with 2 (known, see `docs/backlog.md`). The deck: 0.

## What to report
- The warning count per example, copied from the output. If you did not run it, say "not tested".
- For a visual change: you looked at the contact sheets (`out/check/<name>/sheet-*.png`, deck: `out/check/deck/sheet.png`), and what you saw.
- Any new warning, with the `WARN` line from `out/check/<name>/check.log`.

## What the audit catches (and does not)
Catches: draw and console errors, overlapping labels, lines through labels, text across shape edges or off the figure, text under 12 px, too many words, long captions, horizontal scroll, blank canvases, notation rows without an example, more than one plot per step, plots under 440 × 300 stage units, and caption or sidebar words that ask the reader to picture it ("imagine", "clearly", "obviously", "intuitively", "as you know").
Does not catch: a wrong number, a story that skips a step, a figure that does not teach. Look at the sheets.

## When you change …
| You change | Also do |
|---|---|
| `scripts/plot.py` | regenerate the story example's SVGs, then run the check: `PROFF_SCRIPTS=$PWD/skills/proff-viz/scripts python3 skills/proff-viz/examples/story-logcounts/make_plots.py` |
| `scripts/calctrace.py` | rerun `examples/calc-cpm/make_trace.py` the same way |
| `kit/bio.js` or walk data | rerun `examples/walk-crispr/make_data.py` |
| `scripts/render.py` or `assets/` | check the deck line of `check-all.sh`; look at `out/check/deck/sheet.png` |
| an audit rule in `stage.js` | prove it fires: copy an example into `out/`, plant the problem, build and check it, see the `WARN`; then run the full check to see it does not fire on clean pages |
| a skill text file only | no build needed; reread the file the way an agent would and check no other file points to a section you moved (`grep -rn` the section name) |

## Needs
Python 3, `matplotlib`, `numpy`, `playwright` with Chromium (`playwright install chromium`). Without Playwright, `check.py` exits 2: say "not checked".
