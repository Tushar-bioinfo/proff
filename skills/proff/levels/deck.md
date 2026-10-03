# Build the deck

Build the deck. (Deck-only requests: reply with one line, the path.)
Check every number once; use Python if a shell exists. Never write or read the renderer's CSS or JS.
Paths below are relative to this skill's folder.

## Spec
Write `spec.json` in the user's folder or `proff/<topic>/`. Choose 10–20 slides for the topic.
`{"title":"The topic","palette":"aurora","slides":[...]}`
Text accepts `**bold**`, `*italic*`, backtick code, blank paragraphs, and `- ` list lines.
Any slide: `title`, `eyebrow`, `hand` (short aside).
Math: $..$ inline, $$..$$ display, in text fields; not titles, eyebrow, h, vs, or hook.
**In JSON, write every backslash twice: `\\frac`.** A literal dollar is `\\$` in JSON (`\$` after decoding).
Any slide: `symbols[]` of `{sym, means}`, required on any slide with math (write calc lines in LaTeX). `sym` is LaTeX without dollars.
Define every symbol for a beginner, with units. At most 8 per slide; split if needed.
Text/calc cards sit in a right gutter. Diagram/sim cards open from “notation” or key `n`. Page cards follow the content.

| type | fields | use |
|---|---|---|
| title | title, subtitle, hook | first slide |
| predict | q, options[], answer (0-based), why | predict first; q accepts math |
| notes | notes[] of {h,t,icon} | 2–4 prerequisites |
| text | t | definition, ≤70 words |
| statement | text, color | one big sentence |
| svg | svg, steps[], notes[] | drawn scene, optional build steps |
| calc | given, lines[] of {expr,note,result} | one line per step; result boxes the answer |
| flow | steps[] of {h,t} | linear stages |
| mermaid | code, steps[], notes[] | branches or loops (trial); optional build steps |
| sim | controls[], js, text, reseed | a movable parameter |
| compare | a {h,t}, b {h,t}, vs | contrast; vs ≤12 characters |
| angles | cards[] of {tag,q,a} | exam flip cards |
| quiz | cards[] of {q,a} | recall |
| takeaway | points[], caveat, next | last slide |
| image | src, caption, notes[] | only on request |

Order: title → predict → prerequisites → mechanism scenes → calc → sim → compare → angles → quiz → takeaway.
Repeat scenes as needed. Each answers one question. For statistics, biology, or ML, read matching `ref/ideas/*.md` once.
**Before SVG, read `ref/svg.md`.** Use kit classes and captions in `steps`.

## Flows
- `flow`: 3–5 linear stages with a sentence each. `mermaid`: branches, loops, decisions, 5–8 nodes. `svg`: space or shape matters.
- Heavy topic (>5 stages): overview with ≤6 nodes, then zoom-ins for stages that need them. Each has ≤8 nodes, ≤10 edges.
- Keep stage names; eyebrow `stage k of n`. Every edge has a verb label, ≤3 words.
- Prefer `LR`; `TD` only for ≤4 levels. Short node names (≤3 words); questions in `{...}`.
- `:::hi` marks the key node (≤2). `:::a1`–`:::a6` color nodes by role (input, output, failure); same role, same color. No other styling.
- Build it up: `steps[]` captions; one new node appears per step, in the order first written. Write nodes in story order.

## Simulation
`controls`: `[{"name":"n","label":"sample size","min":5,"max":200,"step":5,"value":40}]`.
`js`: body of `function(ctx,p,W,H,rng,T)`. `p.<name>` is a slider; W/H are canvas dimensions.
`rng()` is seeded in [0,1); reseed changes the seed. Colours: T.ink, T.muted, T.grid, T.bg, T.c[0..5]. Font is preset.
Draw one picture that changes with controls. Label axes and show one live number. Keep loops ≤~10⁶ operations.

## Size and check
Title ≤6 words; card text ≤30. Max 4 notes, 5 flow stages, 6 SVG steps, 7 calc lines, 4 angles, 3 quiz cards, 5 takeaways.
More → another slide. Numbers must agree with the write-up, when present.
```
python3 scripts/render.py spec.json -o deck.html
python3 scripts/snap.py deck.html
```
Fix every WARN and re-run. Missing browser/tools → report the check as unknown.
Look once at `snaps/sheet.png` and `snaps/svg.png`. Open a single slide only to check a fix; do not reopen unchanged images.
Arrow keys/space walk builds; Down/Up jump slides. `--layout page` scrolls. `snap.py --offline` tests raw math/flow fallback.
Worked example: `examples/bootstrap.json` has SVG, calc/math, Mermaid, sim, and angles. Search for the needed type; never read it whole.
