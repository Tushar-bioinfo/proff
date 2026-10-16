# Styles: looks, layouts, and story arcs to choose from

These are menus, not a recipe. Pick what fits **this** question, then change positions, sizes, colours within the theme, or add marks wherever that teaches better. Only the floor in `ref/design.md` is fixed.

## Fixed vs yours
| Fixed (the audit or the self-review fails it) | Yours to choose |
|---|---|
| the limits table in `ref/design.md` (sizes, words, one plot per step) | the story arc, the number of scenes and steps |
| nothing touches; nothing leaves the stage | the layout and every position |
| every number computed; every symbol named in the sidebar | the theme, and which elements get colour |
| no idea used before a step shows it | extra marks, ghosts, arrows, a second note, a control |
| one meaning per colour on a page | whether a step has a hero number |

## 1. Look (theme): one per page
| Theme | `palette` | Use when |
|---|---|---|
| **mono** (default) | `'mono'` | most pages. Ink and greys carry everything; orange `c2` marks only what matters now: the answer, the read cells, the hero. A second series uses a dash, a shape (filled vs open), or a lighter grey, not a second hue. |
| lab | `'lab'` | 3–6 categories that the reader must tell apart by colour (cell types, genotypes). Okabe-Ito hues, safe for colour-blind readers. |
| cyan | `'cyan'` | the user asks for it, or a cool two-group figure (control c1, treated c3) with amber `c2` as the highlight. |
| blockframe, neon | `'blockframe'`, `'neon'` | only when the user asks. |
Biology drawings (`g.dna`, base letters, guides) keep their own identity colours in every theme.

## 2. Figure layouts: starting points
Each layout is a way to use the 1200 × 675 stage. Move, resize, or combine them when the content asks for it.

| Layout | Shape | Fits | Exemplar |
|---|---|---|---|
| plot + side column | plot on the left ~2/3; legend, direct line labels and the hero in the column to its right | a curve or scatter where the answer is one number | `examples/explore-fdr` |
| full-stage plot | one plot across the stage, labels placed on the data | a pattern that needs the whole width (histogram, time course) | `examples/story-logcounts` |
| stacked calculation | input table, operator row, output table; formula and hero to the right | elementwise maths on a small table (automatic in `Proff.calc`) | `examples/calc-cpm` |
| side-by-side calculation | inputs in a row with the operator between, output below | sums, dot products, two inputs (automatic in `Proff.calc`) | `examples/calc-cpm` |
| count grid | `g.units` squares, a subset in accent, the count as hero | rates, proportions, "1 in 20" | — |
| before → after | the same object twice, or the old value struck (`g.strike`) | a correction, an adjustment, a change of scale | — |
| process strip | objects left to right; one thing moves per step | a lab or data pipeline | `examples/walk-crispr` |
| centred table + note | one display table centred, a note or hero beside it | a result table the reader must read | — |
Copy an exemplar's **code patterns** (how it calls the kit), not its topic, numbers, scenes or captions.

## 3. Story arcs: pick the one that fits the question
| Arc | Shape | Good for |
|---|---|---|
| ladder | smallest countable case → each rung adds one idea → the target formula | a formula built from smaller ideas |
| puzzle first | a surprising result up front, then take it apart until it is obvious | counter-intuitive results (base rates, paradoxes) |
| follow one unit | one person, sample, or read through every stage | pipelines, surveys, cohorts |
| two ways | the same data through two methods; show where they disagree and why | method choice (crude vs adjusted, mean vs median) |
| zoom | population → group → individual, or the reverse | levels of a measure, sampling |
| mistake → fix | draw the common mistake, show it fail, then the fix | pitfalls (pseudoreplication, wrong denominator) |
| dial | one control; each scene shows a different consequence of moving it | explore pages, trade-offs |
| decision | a threshold to choose; show what each kind of error costs | screening, cut-offs, significance |
Every arc keeps the ladder rule from `levels/L4.md`: each idea appears only after a step shows it. "Ladder" is one arc; the rule applies to all of them.

**Choose on purpose.** Before writing `story.js`, write in your notes: the arc, the theme, and one line per scene (claim + layout). If you picked the same arc as the exemplar you opened, say why it beats the others for this question. Vary the layout across scenes when the content differs; repeat it when the comparison needs the same frame.
