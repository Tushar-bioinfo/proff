# walk page: a process, step by step, from molecules to data

Copy `examples/walk-crispr`. Layout `walk`. 6–10 scenes, 2–4 steps each. Every scene has a `phase` tag (design, cut, library, screen, sequence, analysis) so the reader knows where they are.

## Content: the whole chain, no gaps
Open `ref/chains.md` and take the chain for the topic. Each link is a scene or a step. The reader must see where the material comes from, what each molecule looks like, where each cut, bind, or copy happens, how cells are grown and selected, how the sample is read, and how that becomes the table they analyse. End on the data table and the first number computed from it.

## Drawing
- `kit/bio.js` loads automatically when you call any of: `g.dna`, `g.rna`, `g.guide`, `g.cas9`, `g.cell`, `g.nucleus`, `g.virus`, `g.plasmid`, `g.tube`, `g.dish`, `g.flowcell`, `g.read`. See `ref/kit.md`. Each returns positions (e.g. `d.x(i)`, `d.cx(i)`, `d.top`, `d.bot`) so labels and arrows attach to the right letter or part.
- Sequences, counts, and fold changes come from `make_data.py` (seeded) into `data/*.json`. Codons, complements, and reading frames are computed, not typed.
- Fix identity colours at the top of story.js and keep them on every scene (in the exemplar: spacer c1, PAM c2, cut c3, each gene its own colour).
- Draw shapes that look like the thing at a glance. A wrong strand, a guide pairing with the wrong strand, or a cut in the wrong place is a science error, not a style issue: check it against the chain.
- Paired strands run antiparallel: when two strands base-pair (mRNA and poly(dT) primer, guide and target), label 5′/3′ at opposite ends. Two strands drawn in the same direction is a science error.
- Use the stage. A small drawing in one corner with the rest empty is a defect: scale the subject up or add the next object in the chain.
- Use `info` (the i sidebar) for the detail that does not fit a 28-word caption (enzyme names, doses, MOI, read structure).
- Say in an `info` sidebar when sequences or counts are made up for teaching.
