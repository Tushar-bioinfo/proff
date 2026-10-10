# Design rules (every page type)

## Limits (one place; ✓ = the audit fails the page)
| what | limit |
|---|---|
| plots on one step | 1 ✓, ≥ 440 wide ✓ and ≥ 300 tall ✓ (stage units, of 1200 × 675) |
| text size on the stage | labels 20, notes 18, ticks and table headers 16, key number 26–34, max 36 ✓; ≥ 12 px on screen ✓ (also on a 1280 laptop with the sidebar open) |
| a label | 1–6 words (✓ at > 7) |
| figure | ≤ 24 labels or 40 words per step ✓ |
| caption | ≤ 28 words ✓ |
| sidebar | ≤ 120 words per step ✓ (examples not counted); every notation row has an example ✓ |
| a formula | drawn with `g.tex` ✓, every symbol in `info.notation` ✓ |

## Stage
- The figure is the page. 1200 × 675 stage units, scaled to the screen. Use the middle: content should span at least 60% of the width and sit vertically centred. Empty halves are a defect.
- One scene = one idea. More than ~24 labels or 40 words on the figure → split the scene.
- Text on the figure: labels of 1–6 words, size ≥ 18 units (16 for tick labels). Sentences go in the caption (≤ 28 words) or `info`. Both live in the i sidebar; nothing is written under the figure, so the labels on the stage must name everything a reader needs.
- No text block before the first scene: title, one `sub` line, then the figure.
- One figure per step, across the whole stage. Never two plots side by side: the next figure comes in on the next step and replaces the current one (`panels`, see `ref/kit.md`), or gets its own scene. Never show empty axes waiting for a later step.
- The `i` sidebar holds notation, what you see, how to read it, and one thing to try: short points, ≤ 120 words per step (the audit counts). Notation rows are `[meaning, example from the figure]`, shown as `symbol : meaning` with the example under it.
- Captions say what to look at, not what the picture is called. "One gene gets 24,299 reads" beats "Histogram of counts".
- Define every abbreviation the first time it appears: `**SE** (standard error)`.

## Colour (palette "blockframe" by default: Block Frame pastels on black)
| token | colour | typical role |
|---|---|---|
| c1 | pastel blue | the main subject, guide RNA, control group |
| c2 | yellow | a highlight, signal, PAM |
| c3 | pink | the change, a cut, treated group, essential gene |
| c4 | green | a second series, a reference line |
| c5 | cream | significance tails, a second warm series |
| c6 | lavender grey | neutral or background things (no-target control, protein body) |
- Decide identity colours once, at the top of story.js, and keep them on every scene. Same colour = same thing.
- c2 (yellow) and c5 (cream) are close. Never let them carry a contrast alone: add a label, a dash, or a shape.
- Captions name shapes ("dashed line", "ringed dots"), never colours. Palettes change; shapes do not.
- Grey (`muted`) = context that does not matter for this step.

## Motion and interaction (from interactive-explainer practice)
- The page must teach with nobody touching it. Steps carry the story; controls let the reader test it.
- One control should move the picture on every step, so each new figure answers to the same slider. Slider for a continuous quantity; button for a discrete switch or new random data.
- Ask for a guess one step before you show the answer.
- Example before definition: show the numbers, then name the idea.
- Move something only when the motion is the change (strands parting, a cell dividing, a value sliding). Otherwise fade in.
- Fix axes to the full control range. Rescaling per frame hides the change.

## Content
- No half stories. Each scene's title is a claim; its steps prove it. The last scene lands on data or a number the reader can use.
- Every number is computed (data script, calctrace, or `draw` from params) or quoted from a source opened this session.
- Say when data is simulated or a sequence is made up.

## Checking
- `check.py` must report 0 warnings. Then run the self-review in `ref/taste.md` on every contact sheet: wrong biology, ugly shapes, cramped or empty layouts, and pictures that do not teach are invisible to the audit.
- Pages are for desktop browsers, dark only. Phones are out of scope.
