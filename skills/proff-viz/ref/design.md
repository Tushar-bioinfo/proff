# Design floor (every page type)

This file is the one home for limits, sizes, and colour meaning. Looks, layouts, and story arcs to choose from are in `ref/styles.md`.

## Limits (✓ = the audit fails the page)
| What | Limit |
|---|---|
| plots per step | 1 ✓; each ≥ 440 wide ✓ and ≥ 300 tall ✓ (stage is 1200 × 675 units) |
| headline (`steps[i].title` or scene `title`) | a claim, not a topic name ("Most positives are false."); one line at 1440 and 1280 px, sidebar closed ✓; aim for ≤ 7 words |
| labels on the figure | 1–6 words each (✓ at > 7); ≤ 24 labels or 40 words per step ✓; aim for ≤ 4 notes + 1 hero |
| caption (`cap`) | ≤ 28 words ✓; it opens the sidebar, nothing is written under the figure |
| sidebar (`info`) | ≤ 120 words per step ✓ (examples not counted); every notation row has an example ✓ |
| formula | drawn with `g.tex` or `g.note`; every symbol, index and operator named in `info.notation` ✓ |
| text on screen | ≥ 12 px ✓, also on a 1280 laptop with the sidebar open |
| text size | ≤ 36 drawn ✓, except one `g.hero` per step (56–72) |
| repeated frame | each step changes the figure ✓ |
| gaps | ≥ 12 stage units between any text and any other text or mark ✓ |

## Drawn sizes (stage units; the kit sets most of them)
| Role | Size | Call |
|---|---|---|
| annotation, the main label | 26 / 600 | `g.note` |
| short label | 24 (written 20) | `g.text` (draws 4 bigger than written; `boost: false` for the exact size) |
| minor label | 22 (written 18) | `g.text` |
| axis title · ticks | 24 · 19 | `g.axes` |
| table values · headers · title | 20–26 (one size per page) · 20 · 22 | `g.matrix`, `Proff.calc` |
| formula | 22–30 mono | `Proff.calc` |
| hero (the one number) | 56–72 / 800, accent | `g.hero` |

## Stage
- The figure is the page. Use the middle: content spans ≥ 60% of the width and sits vertically centred. An empty half is a defect.
- One scene = one idea; one step = one new thing on the figure. If a step needs two new notes, split it.
- Title and one `sub` line, then the first scene. No text block above it.
- One figure per step, across the stage. The next figure replaces it on a later step (`panels`, see `ref/kit.md`). Never show empty axes waiting for a later step.
- Place every label from the thing it names (`ax.sx(v)`, `d.cx(i)`, `m.pos(i, j)`), never from guessed pixels. A label next to a small shape uses a leader (`to: [x, y]`); a span uses `g.brace`.
- Mark sizes in stage units (points r 7–8, lines 3), not data units.
- Captions say what to look at: "One gene gets 24,299 reads", not "Histogram of counts". Captions name shapes ("dashed line", "open rings"), never colours.

## Colour meaning
- One meaning per colour on a page. Decide identity colours once, at the top of `story.js`.
- The accent (`c2`) marks what matters **now**: the answer, the cells being read, the hero. Grey (`muted`) is context.
- Tokens: `c1`–`c6` hues, `f1`–`f6` soft fills of the same hues, `ink muted dim line grid fig surf surf2`. Never a hex colour.
- Two cool hues never carry a contrast alone: add a dash, a shape, or a label.

## Motion and interaction
- The page teaches with nobody touching it. Steps carry the story; controls let the reader test it.
- Ask for a guess one step before the answer. Show the numbers, then name the idea.
- Move something only when the motion is the change. Otherwise fade in.
- Fix axes to the full control range; switch between two fixed ranges if one cannot serve every value. Never rescale per frame.

## Content
- Each headline is a claim; its steps prove it. The last scene lands on data or a number the reader can use.
- Every number is computed (data script, `calctrace`, or `draw`) or quoted from a source opened this session. Say when data is simulated.
- Spell out every abbreviation the first time: `**SE** (standard error)`.
- Pages are for desktop browsers, dark theme only.
