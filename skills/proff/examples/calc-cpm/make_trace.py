import os, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent   # outputs go next to this script, wherever it is run from
sys.path.insert(0, os.environ.get("PROFF_SCRIPTS", str(HERE.parents[1] / "scripts")))   # set PROFF_SCRIPTS=<skill>/scripts in a copy
(HERE / "data").mkdir(exist_ok=True)
from calctrace import Trace
t = Trace("Counts to log-CPM", i="gene", j="sample")   # what the indices i (rows) and j (columns) count
X = t.matrix("X", [[120, 300, 90, 640], [30, 60, 45, 80], [850, 1640, 865, 1280]],
             rows=["GeneA", "GeneB", "GeneC"], cols=["S1", "S2", "S3", "S4"], label="raw counts", unit="reads",
             cap="3 genes × 4 samples. Each number = reads that landed on that gene.",
             info="Raw counts mix two things: how much a gene is expressed, and how deeply each sample was sequenced. S2 and S4 were sequenced deeper, so all their counts are bigger.")
N = t.reduce(X, "sum", axis="cols", name="N", label="library size", tex=r"N_j=\sum_i x_{ij}",
             cap="Add each column. That is how many reads the sample got in total.",
             info="Library size is per **sample** (column), not per gene. A deeper sample has a bigger N.")
P = t.ewise(X, "/", N, name="P", label="share of library",
            cap="Divide every count by its own sample's total.", tex=r"p_{ij}=x_{ij}/N_j",
            info="Now each column sums to 1. Depth is gone; what is left is each gene's share of its sample.")
C = t.ewise(P, "*", 1e6, name="CPM", label="counts per million", tex=r"\mathrm{CPM}_{ij}=p_{ij}\times10^6",
            cap="Multiply by one million so the numbers are readable.", expand=1)
L = t.map(C, "log2p1", name="L", label="log₂(CPM + 1)", tex=r"y_{ij}=\log_2(\mathrm{CPM}_{ij}+1)",
          cap="Take log₂ after adding 1. Doubling becomes +1; zero stays zero.",
          info="The +1 (pseudocount) avoids log(0). On a log₂ scale, a difference of 1 means two-fold.")
t.symbols(X="x", N="N", P="p", CPM=r"\mathrm{CPM}", L="y")   # the letter each table has in the formulas
t.save(HERE / "data/calc.json")
