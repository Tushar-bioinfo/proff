# deck: a card deck for recall and new angles

`S` = this skill's folder. A deck is the review companion to a page or an L3 lesson: big cards, few words, one tap to reveal. It is not a lesson by itself. Copy `examples/deck-bootstrap.json` (one slide of every card type).

## Spec
Write `<topic>/deck.json`: `{"title":"The topic","level":"L4","slides":[...]}`. 6–10 slides.
Text accepts `**bold**`, `*italic*`, backtick code, and `- ` list lines. Any slide may have `eyebrow` and `title`.
Math: $..$ in card text only, never in titles. In JSON write every backslash twice: `\\frac`.

| type | fields | use |
|---|---|---|
| title | title, subtitle, hook | first slide |
| predict | q, options[], answer (0-based), why | a guess before anything is explained |
| notes | notes[] of {h, t} | **facts**: 2–4 cards, eyebrow `facts` |
| statement | text | one big sentence worth remembering |
| compare | a {h, t}, b {h, t}, vs | look-alikes, or works vs fails; vs ≤ 12 characters |
| angles | cards[] of {tag, q, a} | flip cards. Eyebrow `different angles`: tags reversed, edge case, design, confusable. Eyebrow `transfer`: tags name a new setting (spatial omics, single cell, ML) |
| quiz | cards[] of {q, a} | recall, 3 cards |
| takeaway | points[], caveat, next | last slide |

Order: title → predict → facts → compare → angles → transfer → quiz → takeaway. Skip what does not fit.

## Rules
- Card text ≤ 30 words; titles ≤ 6 words. At most 4 facts, 4 angles, 3 transfer, 3 quiz cards, 5 takeaways.
- Each angle or transfer card asks a question the lesson did not answer directly. Answers are 1–2 sentences and name the reason.
- Numbers must match the page or the L3 write-up.

## Build and check
```bash
python3 S/scripts/render.py <topic>/deck.json -o <topic>/deck.html
python3 S/scripts/snap.py <topic>/deck.html
```
Fix every WARN and re-run. Look once at `<topic>/snaps/sheet.png`: every card readable, nothing cut off. Keys: ← → or space step through builds, ↑ ↓ jump slides; click a card to flip it.
