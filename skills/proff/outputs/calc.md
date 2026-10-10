# calc page: watch a calculation happen cell by cell

Copy `examples/calc-cpm`. You write the maths once in `make_trace.py` with `scripts/calctrace.py`; the page replays it. `story.js` is two lines.

## make_trace.py
```python
t = Trace("Counts to log-CPM", i="gene", j="sample")   # what i (a row) and j (a column) stand for
X = t.matrix("X", rows_of_numbers, rows=[...], cols=[...], label="raw counts", unit="reads", cap="...", info="...")
N = t.reduce(X, "sum", axis="cols", name="N", label="library size", tex=r"N_j=\sum_i x_{ij}", cap="...")
P = t.ewise(X, "/", N, name="P", label="share of library", tex=r"p_{ij}=x_{ij}/N_j", cap="...")
L = t.map(P, "log2p1", name="L", label="log₂(x + 1)", tex=r"y_{ij}=\log_2(p_{ij}+1)", cap="...")
t.symbols(X="x", N="N", P="p", L="y")   # the letter each table has in the formulas
t.save(HERE / "data/calc.json")
```
Ops: `matrix`, `reduce` (sum, mean, sd, var, max, min, median over rows or cols), `ewise` (+ − × ÷ with a matrix, a row/column vector, or a number; vectors broadcast), `map` (log2, log, log10, log2p1, log1p, exp, exp2, sqrt, square, abs, neg), `matmul` (dot products, row × column), and `dist` (where a statistic falls on its distribution). Open `scripts/calctrace.py` for exact signatures.

## Rules
- Tables ≤ 8 × 8, usually 3 genes × 4 samples. Pick numbers that make the point visible (one deep sample, one zero).
- One op per idea. `cap` says what happens to **which** rows/columns/cells in plain words; `info` says why; `tex` gives the formula.
- Every formula gets explained in the i sidebar, automatically, once you give `i=`/`j=` and `t.symbols(...)`: each symbol with its value in the first cell (x_ij: raw counts of gene i in sample j. GeneA in S1: 120), what i and j stand for, each operator in plain words (Σᵢ: add up over every gene), and a worked example (S1: N = 120 + 30 + 850 = 1,000). A formula with a table that has no symbol fails the check. Your `info` adds the why; do not repeat the notation in it.
- `expand=k` walks the first k output cells one by one, then fills the rest with "Same rule for every cell."
- Add a `dist` step wherever a statistic is compared with a distribution (a t, a z, a p-value), so the reader sees where the stats enter.
- `story.js`: `Proff.page({...}); Proff.calc(PROFF_DATA.calc);`. Add `Proff.scene` before or after only for a context picture.
