# study page: ideas to read, recall, and test

Copy `examples/study-fdr`. Layout `article` (scrolling page). Text-led, but never text-only: one small live figure is required.

## Order (skip what does not apply)
1. `Proff.section('the problem in numbers')` + `Proff.tiles([{big, h, text}])`: 3 numbers that frame the topic. Each `big` is a real, computed or cited number.
2. `Proff.section('abbreviations')` + `Proff.compare(['term','stands for','plain meaning'], rows)`: **every** abbreviation the topic uses. This is where FWER, FDR, BH, SE, df, MOI, etc. get spelled out.
3. `Proff.section('see it')` + one `Proff.scene` with 2–3 steps and at most 2 controls. It shows the core mechanism, not decoration.
4. `Proff.section('three angles')` + tiles with `tag`: the same idea as a budget, a ranking, a trade-off, a physical picture, etc.
5. `Proff.section('do not confuse')` + `Proff.compare` of look-alike terms (optional).
6. `Proff.section('test yourself')` + `Proff.quiz([{q, a}])`: 3–5 questions. Use reversed cause, changed numbers, edge cases, "why not X?".

## Rules
- Tile text ≤ 30 words. Markdown-lite only: `**bold**`, `*italic*`, `` `code` ``.
- Facts need a source from this session, or must be computed in the figure. Otherwise leave them out.
- The figure follows `ref/design.md`: big centre, ≤ 40 words on it, captions ≤ 28 words.
- Do not repeat the same fact in a tile, a caption, and the sidebar. Say it once, where it teaches best.
