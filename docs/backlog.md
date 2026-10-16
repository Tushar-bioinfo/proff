# Backlog

Open problems and ideas. Remove an item when it is fixed, and note the fix in `docs/decisions.md` if it was a choice.

## Open
- **`study-notation`: 2 audit warnings** since the text got 2 bigger. Scene 2 "Population Truth vs Lab Sample", step 3: a line crosses "sample spread s = 11.6 mg/dL" and "estimates: μ̂ = 110.4, σ̂ = …". Fix: move the two labels clear of the line. This example is the user's work in progress; ask before editing it.
- **`study-notation`, `study-dl-notation`, `ref/ideas/dl-notation.md`** are the user's work in progress. Do not restructure them without asking.
- **Close cool colours.** c1, c4, c5, c6 are only ΔE 15–18 apart for colour-blind readers. Pages with 4+ groups lean on labels and dashes. If this shows up in real pages, consider a warmer or lighter c4.
- **`study-notation`, `study-dl-notation` fail under v5 text sizes** (40 warnings each in `check-all.sh`, mostly spacing < 12 from the bigger text). User's work in progress: ask before fixing or retiring them. v5-checked versions of the DL-notation page exist in `my-notes/Visuals` (reading-deep-learning-notation).
- **Calc steps cannot follow sliders.** `Proff.calc` computes a trace once. Recomputing on a control change would bring back "drag and watch" on calc steps.
- **`plot.py` text is +2, the kit is +4.** Matplotlib figures read a little smaller than kit figures.
- **Audit ideas not built:** colours inside a `plot.py` SVG (the v5 Gemini test drew a second group in `c1` under mono; only `outputs/story.md` warns); a figure that fills too little of the stage (the v5 Sol test: small plots beside a big hero, 0 warnings; only `ref/taste.md` item 12 warns); a step whose headline makes a claim but has no accent mark; a numbers-unchanged diff for restyles.
- **Display tables lack a layout helper.** Hand-drawn `g.matrix` tables are placed by the author; a centring helper and a `heroBeside(bounds)` would stop half-empty stages.
