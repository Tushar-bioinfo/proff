# Backlog

Open problems and ideas. Remove an item when it is fixed, and note the fix in `docs/decisions.md` if it was a choice.

## Open
- **`study-notation`: 2 audit warnings** since the text got 2 bigger. Scene 2 "Population Truth vs Lab Sample", step 3: a line crosses "sample spread s = 11.6 mg/dL" and "estimates: μ̂ = 110.4, σ̂ = …". Fix: move the two labels clear of the line. This example is the user's work in progress; ask before editing it.
- **`study-notation`, `study-dl-notation`, `ref/ideas/dl-notation.md`** are the user's work in progress. Do not restructure them without asking.
- **Close cool colours.** c1, c4, c5, c6 are only ΔE 15–18 apart for colour-blind readers. Pages with 4+ groups lean on labels and dashes. If this shows up in real pages, consider a warmer or lighter c4.
- **Ladder rule, first real test.** No new page has been built under the L4 "build it from the ground" rule yet. Build one test page (maximum likelihood is the worked example) in `out/` and check that the first scenes really are the rungs.
- **Version not bumped.** The 2026-10-11 changes are committed on branch `viz` (0dd6747) but `plugin.json` still says 4.0.2, and `main` does not have them yet; suggested version 4.1.0 (see `docs/release.md`).
