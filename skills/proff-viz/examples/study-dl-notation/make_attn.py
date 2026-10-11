import math, os, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, os.environ.get("PROFF_SCRIPTS", str(HERE.parents[1] / "scripts")))
(HERE / "data").mkdir(exist_ok=True)
from calctrace import Trace

# Scaled dot-product attention on three amino-acid tokens, d_k = 2:  O = softmax(Q K^T / sqrt(d_k)) V
t = Trace("Attention, one number at a time", i="token", j="column")
tok = ["Met", "Lys", "Leu"]
Q = t.matrix("Q", [[1, 0], [0, 2], [1, 1]], rows=tok, cols=["d1", "d2"], label="queries", show=False)
K = t.matrix("K", [[1, 0], [0, 1], [1, 1]], rows=tok, cols=["d1", "d2"], label="keys", show=False)
V = t.matrix("V", [[2, 0], [0, 2], [1, 1]], rows=tok, cols=["d1", "d2"], label="values", show=False)
t.show(Q, K, V, title="Queries, keys, values",
       cap="Three tokens, each with a query, a key and a value of two numbers. d_k = 2 is the length of a key.",
       info={"text": "A **query** asks, a **key** answers, a **value** is what gets passed on. Row i of each matrix belongs to token i.",
             "notation": {"Q": ["queries, one row per token (N×d_k)", "Met asks [1, 0]"], "K": ["keys, one row per token (N×d_k)", "Lys answers [0, 1]"],
                          "V": ["values, one row per token (N×d_v)", "Leu carries [1, 1]"], "d_k": ["number of columns in a key", "2"]}})
Kt = t.transpose(K, name="Kt", label="keys, transposed", expand=0,
                 cap="Flip K: rows become columns. Now each column is one token's key.",
                 info={"notation": {"K^{\\top}": ["K transposed: rows ↔ columns, shape (d_k×N)", "Lys key [0, 1] is now column 2"]}})
S = t.matmul(Q, Kt, name="S", label="match scores", tex=r"S=QK^{\top}", expand=3,
             cap="Each query is dotted with every key. Big score = a good match.",
             info={"notation": {"K^{\\top}": ["K transposed: rows ↔ columns", "Lys key [0, 1] is column 2 of Kᵀ"],
                                "S_{ij}": ["match of query i with key j", "Met vs Met = 1×1 + 0×0 = 1"]}})
Sc = t.ewise(S, "/", math.sqrt(2), name="Sc", label="scaled scores", tex=r"S'=S/\sqrt{d_k}", expand=1,
             cap="Divide every score by √d_k = 1.414. This keeps scores from growing with key length.",
             info={"notation": {"\\sqrt{d_k}": ["square root of the key length", "√2 = 1.414"], "S'_{ij}": ["scaled score", "Met vs Met: 1 ÷ 1.414 = 0.707"]}})
E = t.map(Sc, "exp", name="E", label="exponentiated", tex=r"E=\exp(S')", expand=1,
          cap="Take e to the power of each score. Everything becomes positive; big scores grow most.",
          info={"notation": {"E_{ij}": ["e raised to the scaled score", "e^0.707 = 2.03"]}})
Z = t.reduce(E, "sum", axis="rows", name="Z", label="row total", tex=r"Z_i=\sum_j E_{ij}", expand=3,
             cap="Add up each row. That is the softmax denominator for each query.",
             info={"notation": {"Z_{i}": ["row total for query i", "Met: 2.03 + 1 + 2.03 = 5.06"],
                                "\\sum_j": ["add up over the keys j (across the row)", "2.03 + 1 + 2.03 = 5.06"]}})
A = t.ewise(E, "/", Z, name="A", label="attention weights", tex=r"A_{ij}=E_{ij}/Z_i", expand=3,
            cap="Divide each cell by its row total. Each row now sums to 1: these are the attention weights.",
            info={"text": "This step plus the exponential **is** softmax, applied row by row.",
                  "notation": {"A_{ij}": ["how much query i attends to token j", "Met → Met = 2.03 ÷ 5.06 = 0.401"]}})
O = t.matmul(A, V, name="O", label="attention output", expand=3,
             tex=r"O=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V=AV",
             cap="Each token's output is a weighted mix of all value rows, using its attention weights.",
             info={"text": "**Inside-out:** QKᵀ → ÷√d_k → softmax → × V. The five steps above are this one line.",
                   "notation": {"O_{i}": ["output row for token i", "Met: 0.401×[2,0] + 0.198×[0,2] + 0.401×[1,1]"],
                                "\\mathrm{softmax}(\\cdot)": ["row-wise exponentiate and normalise", "each row of A sums to 1"],
                                "\\sqrt{d_k}": ["square root of the key length", "√2 = 1.414"], "K^{\\top}": ["K transposed", "rows ↔ columns"]}})
t.symbols(Q="Q", K="K", V="V", Kt="K^{\\top}", S="S", Sc="S'", E="E", Z="Z", A="A", O="O")
t.save(HERE / "data/attn.json")
