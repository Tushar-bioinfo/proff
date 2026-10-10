# Step chains: what a complete page must cover

Take the chain, drop links the question does not need, and say which ones you dropped. Each kept link is one scene or one step. A page that skips from "design" to "results" is a half story.

## Pooled CRISPR knockout screen (exemplar: `examples/walk-crispr`)
Source for the lab steps: Joung et al. 2017, *Nature Protocols*, doi:10.1038/nprot.2017.016 (genome-scale CRISPR knockout and activation screening). Analysis: MAGeCK (`count`, `test`, `mle`).
1. Target gene: the DNA sequence, both strands, start codon.
2. PAM: SpCas9 needs NGG right after the 20-letter target.
3. Guide design: 20-letter spacer (= target, T→U) + scaffold; several guides per gene; controls (non-targeting, safe-harbour such as AAVS1).
4. Library: oligo pool synthesised, cloned into a lentiviral plasmid (guide + Cas9 or a separate Cas9 line + puromycin resistance).
5. Library check: sequence the plasmid pool; guides evenly represented.
6. Virus: packaging cells make lentivirus carrying the guides.
7. Infection at low MOI (≈ 0.3) so most infected cells get one guide; enough cells for ~500× coverage per guide.
8. Selection: puromycin kills uninfected cells.
9. Cas9 + guide find the target, strands part, guide pairs with one strand.
10. Cut: both strands, 3 letters upstream of the PAM (blunt double-strand break).
11. Repair by NHEJ: small insertions or deletions; frameshift → early stop → knockout (in-frame indels may not knock out).
12. Culture for ~2–3 weeks, keeping coverage; optional treatment arm (drug vs vehicle).
13. Harvest: genomic DNA from each sample (day 0 / day N / treated).
14. PCR amplifies the integrated guide region, adding adapters and a sample barcode.
15. Sequencing: reads = adapter + sample tag + 20-letter spacer (+ scaffold).
16. Counting: match each read's spacer to the library → count matrix (guides × samples).
17. Normalise (median ratio or total, or to control guides) and compute log₂ fold change per guide.
18. Gene-level score: combine guides (MAGeCK RRA or MLE), FDR; essential genes drop out, controls stay near 0.

## Bulk RNA-seq to differential expression
RNA extraction → (poly-A selection or rRNA depletion) → fragmentation → reverse transcription to cDNA → adapters + PCR → sequencing (reads, paired ends) → alignment or pseudo-alignment → counts per gene → library size and composition (size factors) → dispersion (mean–variance, negative binomial) → model and test (Wald or LRT) → p-values → BH adjustment → shrunken log₂ fold changes → volcano/MA plots.

## A hypothesis test (any)
Question → what is measured, on what unit (watch pseudoreplication) → null and alternative → the statistic and why → its null distribution (show where it comes from, e.g. by simulation) → observed value on that distribution → p-value as a tail area → effect size with interval → assumptions and what breaks them → multiple testing if many tests.

## Training a model (ML)
Data and labels → split (train / validation / test; group-aware if samples are related) → features and scaling (fit on train only) → model and its parameters → loss → gradient step (show one update on numbers) → epochs and the learning curve → validation for tuning → final test once → metrics with uncertainty → leakage checks and failure cases.
