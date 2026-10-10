"""Data for the CRISPR knockout-screen walk. Every number on the page comes from here (seeded)."""
import json, random
import os, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent   # outputs go next to this script, wherever it is run from
sys.path.insert(0, os.environ.get("PROFF_SCRIPTS", str(HERE.parents[1] / "scripts")))   # set PROFF_SCRIPTS=<skill>/scripts in a copy
(HERE / "data").mkdir(exist_ok=True)
import numpy as np
CODON = {a + b + c: aa for (a, b, c), aa in zip([(x, y, z) for x in "TCAG" for y in "TCAG" for z in "TCAG"],
         "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG")}
tr = lambda s: "".join(CODON[s[i:i + 3]] for i in range(0, len(s) - 2, 3))
random.seed(4)
while True:  # gene start (ATG) + 20-nt target + NGG PAM + tail; a 1-nt deletion at the cut must make an early stop
    target = "".join(random.choice("ACGT") for _ in range(20))
    seq = "ATGG" + target + "AGG" + "TCA"
    if "*" in tr(seq):
        continue
    cut = 4 + 17                              # Cas9 cuts 3 nt upstream (5') of the PAM
    mut = seq[:cut - 1] + seq[cut:]           # lose 1 base just before the cut
    aa = tr(mut)
    if "*" in aa[:9] and aa.index("*") >= cut // 3:
        break
counts_rng = np.random.default_rng(2)
guides = [("RPL3", "essential", 4), ("POLR2A", "essential", 4), ("AAVS1", "safe cut", 2), ("NT", "no target", 2)]
rows, d0, d21 = [], [], []
for g, kind, n in guides:
    for i in range(n):
        a = int(counts_rng.integers(380, 620)); f = 0.12 if kind == "essential" else 1.0
        b = int(counts_rng.poisson(a * f * 1.15 * counts_rng.lognormal(0, .15)))
        rows.append(f"{g}_{i + 1}"); d0.append(a); d21.append(b)
ctl = [i for i, r in enumerate(rows) if r.startswith(("AAVS1", "NT"))]       # normalise to control guides (MAGeCK --norm-method control)
lib0, lib21 = sum(d0[i] for i in ctl), sum(d21[i] for i in ctl)
lfc = [round(float(np.log2(((b + .5) / lib21) / ((a + .5) / lib0))), 2) for a, b in zip(d0, d21)]
out = dict(seq=seq, t0=4, t1=24, pam=[24, 27], cut=cut, mut=mut, aa=tr(seq), aa_mut=aa, rows=rows, d0=d0, d21=d21, lfc=lfc,
           kinds=[k for _, k, n in guides for _ in range(n)], lib=[lib0, lib21])
json.dump(out, open(HERE / "data/crispr.json", "w"))
print(seq, tr(seq), "\n" + mut, aa, "\n", list(zip(rows, d0, d21, lfc)))
