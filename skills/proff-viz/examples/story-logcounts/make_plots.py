"""Static story exemplar: why RNA-seq counts are log-transformed. Simulated data (seeded), plots via plot.py."""
import json
import os, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent   # outputs go next to this script, wherever it is run from
sys.path.insert(0, os.environ.get("PROFF_SCRIPTS", str(HERE.parents[1] / "scripts")))   # set PROFF_SCRIPTS=<skill>/scripts in a copy
(HERE / "data").mkdir(exist_ok=True)
import numpy as np
from plot import fig, save, C

rng = np.random.default_rng(1)
G, S, phi = 1000, 6, 0.15
mu = np.exp(rng.normal(3.2, 1.9, G))                       # gene means: most low, a few very high
counts = rng.negative_binomial(1 / phi, 1 / (1 + mu[:, None] * phi), (G, S))
m, v = counts.mean(1), counts.var(1, ddof=1)
keep = m > 0.5
L = np.log2(counts + 1); lm, ls = L.mean(1), L.std(1, ddof=1)
out = Path(__file__).parent

f, ax = fig()
edges = np.unique(np.round(np.logspace(0, 5.3, 40))) + .5   # integer-aware bins: no empty gaps at 1, 2, 3 reads
hh = ax.hist(counts[:, 0], bins=edges, color=C.c1, alpha=.85)[0]; ax.set_ylim(0, hh.max() * 1.4)
ax.set_xscale("log"); ax.set_xlabel("reads per gene (sample 1)"); ax.set_ylabel("number of genes")
save(f, out / "svg/hist.svg")

f, ax = fig()
xx = np.logspace(-0.3, 5, 100)
ax.scatter(m[keep], v[keep], s=10, color=C.c1, alpha=.45)
ax.plot(xx, xx, color=C.c4, lw=3)
ax.plot(xx, xx + phi * xx ** 2, color=C.c6, lw=3)
ax.set_xscale("log"); ax.set_yscale("log"); ax.set_xlim(0.5, 1e5); ax.set_ylim(0.1, 1e9)
ax.set_xlabel("mean reads per gene"); ax.set_ylabel("variance across 6 samples")
save(f, out / "svg/meanvar.svg")

f, ax = fig()
ax.scatter(lm[keep], ls[keep], s=10, color=C.c5, alpha=.45)
ax.axhline(np.sqrt(phi) / np.log(2), color=C.c6, lw=3, ls="--")
ax.set_xlim(0, 17); ax.set_ylim(0, 2.2)
ax.set_xlabel("mean of log₂(count + 1)"); ax.set_ylabel("SD of log₂(count + 1)")
save(f, out / "svg/logsd.svg")

json.dump({"n_genes": G, "phi": phi, "frac_under_100": float((counts[:, 0] < 100).mean()), "max": int(counts[:, 0].max()),
           "flat_sd": float(np.sqrt(phi) / np.log(2)), "hist_top": float(hh.max()), "zeros": int((counts[:, 0] == 0).sum())}, open(out / "data/facts.json", "w"))
print(json.load(open(out / "data/facts.json")))
