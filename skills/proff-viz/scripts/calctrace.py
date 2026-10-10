#!/usr/bin/env python3
"""Record a calculation on small tables so the page can replay it cell by cell.

You write the maths once, in Python; every number on the page is computed here, never typed by hand.
    from calctrace import Trace
    t = Trace("CPM normalisation")
    X = t.matrix("X", [[120, 300], [30, 60]], rows=["GeneA", "GeneB"], cols=["S1", "S2"], label="raw counts", unit="reads")
    N = t.reduce(X, "sum", axis="cols", name="N", label="library size", tex=r"N_j=\\sum_i x_{ij}", cap="Add up each sample's reads.")
    P = t.ewise(X, "/", N, name="P", label="share of library", cap="Divide each count by its sample total.")
    t.symbols(X="x", N="N", P="p")     # the letter each table has in the formulas
    t.save("calc.json")
Trace(title, i="gene", j="sample") names what the indices count (i = row, j = column). With symbols, the page's i sidebar
explains every symbol, index and operator in each formula and adds a worked example from the first cell, by itself.
Each op becomes one scene. `expand=k` shows the first k output cells one at a time before filling the rest (default 1).
Pure Python; no numpy needed. Keep tables small (<= 8 x 8): this is for seeing, not for computing.
"""
import json, math, re, statistics
from pathlib import Path

COLORS = ["c1", "c5", "c2", "c4", "c6", "c3"]
SYM = {"+": "+", "-": "−", "*": "×", "/": "÷"}
MAPS = {  # name: (function, label template for one cell, display symbol)
    "log2": (math.log2, "log₂({x})", "log₂"), "log": (math.log, "ln({x})", "ln"), "log10": (math.log10, "log₁₀({x})", "log₁₀"),
    "log2p1": (lambda v: math.log2(v + 1), "log₂({x} + 1)", "log₂(·+1)"), "log1p": (math.log1p, "ln({x} + 1)", "ln(·+1)"),
    "exp": (math.exp, "e^{x}", "exp"), "exp2": (lambda v: 2 ** v, "2^{x}", "2^·"), "sqrt": (math.sqrt, "√{x}", "√"),
    "square": (lambda v: v * v, "{x}²", "(·)²"), "abs": (abs, "|{x}|", "|·|"), "neg": (lambda v: -v, "−{x}", "−"),
}


def fmt(v):
    """Short, honest number format: integers stay whole; others keep 3 significant digits (min 2 decimals below 10)."""
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return "–"
    if isinstance(v, float) and v.is_integer() and abs(v) < 1e9:
        v = int(v)
    if isinstance(v, int):
        return f"{v:,}"
    a = abs(v)
    if a >= 1e9 or (0 < a < 1e-3):
        return f"{v:.2e}".replace("e+0", "e").replace("e-0", "e-").replace("e+", "e")
    d = 0 if a >= 100 else 1 if a >= 10 else 2 if a >= 1 else 3
    s = f"{v:,.{d}f}"
    return s.rstrip("0").rstrip(".") if "." in s and a < 1 else s


class T:
    """A named table in the trace. Shape is (rows x cols); vectors are 1 x n (row) or n x 1 (col)."""
    def __init__(self, tr, name, data, rows=None, cols=None, label="", unit="", color=None):
        self.tr, self.name, self.data = tr, name, [list(map(float, r)) for r in data]
        self.rows, self.cols, self.label, self.unit = rows, cols, label, unit
        self.color = color or COLORS[len(tr.tensors) % len(COLORS)]
        self.shape = (len(self.data), len(self.data[0]))
        vals = [v for r in self.data for v in r if not math.isnan(v)]
        nz = [abs(v) for v in vals if v]
        m = min(nz) if nz else 1
        self.dec = None if all(v.is_integer() for v in vals) else 3 if m < 1 else 2 if m < 10 else 1 if m < 100 else 0
        tr.tensors[name] = self

    def f(self, v):
        """Format a value the way this table shows it: same decimals in every cell."""
        if self.dec is None or v is None or math.isnan(v) or (v and abs(v) < 1e-3) or abs(v) >= 1e9:
            return fmt(v)
        return f"{v:,.{self.dec}f}"

    def __getitem__(self, ij):
        return self.data[ij[0]][ij[1]]

    def js(self):
        return {"data": self.data, "disp": [[self.f(v) for v in r] for r in self.data], "rows": self.rows, "cols": self.cols,
                "label": self.label, "unit": self.unit, "color": self.color}


class Trace:
    def __init__(self, title, sub="", i="row", j="column"):
        self.title, self.sub, self.tensors, self.steps = title, sub, {}, []
        self.index, self.syms = {"i": i, "j": j}, {}
        self._n = 0

    def _name(self, name):
        if name:
            return name
        self._n += 1
        return f"T{self._n}"

    def _step(self, **kw):
        kw.setdefault("expand", 1)
        self.steps.append(kw)

    # ---------- data ----------
    def matrix(self, name, data, rows=None, cols=None, label="", unit="", color=None, cap="", info="", show=True, title=None):
        X = T(self, name, data, rows, cols, label, unit, color)
        if show:
            self._step(op="show", layout=[{"t": name}], title=title or label or name, cap=cap or f"Start with **{label or name}**.", info=info, cells=[], expand=0)
        return X

    def vector(self, name, values, labels=None, orient="col", **kw):
        data = [[v] for v in values] if orient == "col" else [list(values)]
        return self.matrix(name, data, rows=labels if orient == "col" else None, cols=labels if orient == "row" else None, **kw)

    def show(self, *tensors, cap="", title="", info=""):
        self._step(op="show", layout=[{"t": X.name} for X in tensors], title=title, cap=cap, info=info, cells=[], expand=0)

    # ---------- operations ----------
    def reduce(self, X, fn, axis="cols", name=None, label="", tex="", cap="", info="", title="", expand=1, color=None):
        """fn: sum | mean | median | var | sd | max | min | geomean. axis='cols': one value per column (result row under X);
        axis='rows': one value per row (result column right of X)."""
        f = {"sum": sum, "mean": statistics.mean, "median": statistics.median, "var": statistics.variance, "sd": statistics.stdev,
             "max": max, "min": min, "geomean": lambda a: math.exp(statistics.mean(math.log(v) for v in a))}[fn]
        R, C = X.shape
        if axis == "cols":
            vals = [[f([X[i, j] for i in range(R)]) for j in range(C)]]
            out = T(self, self._name(name), vals, None, X.cols, label, X.unit if fn in ("sum", "mean", "median", "max", "min", "sd", "geomean") else "", color)
            cells = [{"out": [0, j], "reads": [[X.name, i, j] for i in range(R)], "expr": self._rexpr(fn, [(X, i, j) for i in range(R)], out, 0, j)} for j in range(C)]
            layout = [{"t": X.name, "below": out.name, "sym": "Σ" if fn == "sum" else fn}]
        else:
            vals = [[f([X[i, j] for j in range(C)])] for i in range(R)]
            out = T(self, self._name(name), vals, X.rows, None, label, X.unit if fn in ("sum", "mean", "median", "max", "min", "sd", "geomean") else "", color)
            cells = [{"out": [i, 0], "reads": [[X.name, i, j] for j in range(C)], "expr": self._rexpr(fn, [(X, i, j) for j in range(C)], out, i, 0)} for i in range(R)]
            layout = [{"t": X.name, "right": out.name, "sym": "Σ" if fn == "sum" else fn}]
        self._step(op="reduce", fn=fn, axis=axis, layout=layout, out=out.name, tex=tex, title=title or label or f"{fn} per {axis[:-1]}",
                   cap=cap or f"Take the {fn} of each {'column' if axis == 'cols' else 'row'} of {X.label or X.name}.", info=info, cells=cells, expand=expand)
        return out

    def _rexpr(self, fn, refs, out, oi, oj):
        terms = [[X.f(X[i, j]), X.name] for X, i, j in refs]
        res = [out.f(out[oi, oj]), out.name]
        if fn == "sum":
            return self._join(terms, " + ") + [[" = ", None], res]
        if fn == "mean":
            return [["(", None]] + self._join(terms, " + ") + [[f") ÷ {len(terms)} = ", None], res]
        if fn == "geomean":
            return [["(", None]] + self._join(terms, " × ") + [[f")^(1/{len(terms)}) = ", None], res]
        return [[f"{fn}(", None]] + self._join(terms, ", ") + [[") = ", None], res]

    @staticmethod
    def _join(terms, sep):
        out = []
        for k, t in enumerate(terms):
            if k:
                out.append([sep, None])
            out.append(t)
        if len(out) > 13:  # long rows: keep first two and last term
            out = out[:4] + [[sep.strip() and f" {sep.strip()} … " or " … ", None]] + out[-1:]
        return out

    def ewise(self, A, op, B, name=None, label="", tex="", cap="", info="", title="", expand=1, color=None):
        """A (op) B with broadcasting: B can be a number, a same-shape table, a 1xC row (per column) or an Rx1 column (per row)."""
        R, C = A.shape
        f = {"+": lambda a, b: a + b, "-": lambda a, b: a - b, "*": lambda a, b: a * b, "/": lambda a, b: a / b}[op]
        if isinstance(B, (int, float)):
            get, bname, lay = (lambda i, j: (B, None)), None, [{"t": A.name}, f"{SYM[op]} {fmt(B)}", "=", None]
        elif B.shape == A.shape:
            get, bname, lay = (lambda i, j: (B[i, j], (B.name, i, j))), B.name, [{"t": A.name}, SYM[op], {"t": B.name}, "=", None]
        elif B.shape == (1, C):
            get, bname, lay = (lambda i, j: (B[0, j], (B.name, 0, j))), B.name, [{"t": A.name, "below": B.name, "sym": SYM[op]}, "=", None]
        elif B.shape == (R, 1):
            get, bname, lay = (lambda i, j: (B[i, 0], (B.name, i, 0))), B.name, [{"t": A.name, "right": B.name, "sym": SYM[op]}, "=", None]
        else:
            raise ValueError(f"shapes {A.shape} and {B.shape} do not broadcast")
        vals = [[f(A[i, j], get(i, j)[0]) for j in range(C)] for i in range(R)]
        out = T(self, self._name(name), vals, A.rows, A.cols, label, "", color)
        lay[-1] = {"t": out.name}
        cells = []
        for i in range(R):
            for j in range(C):
                b, ref = get(i, j)
                reads = [[A.name, i, j]] + ([list(ref)] if ref else [])
                cells.append({"out": [i, j], "reads": reads, "expr": [[A.f(A[i, j]), A.name], [f" {SYM[op]} ", None], [B.f(b) if bname else fmt(b), bname], [" = ", None], [out.f(out[i, j]), out.name]]})
        self._step(op="ewise", sym=SYM[op], layout=lay, out=out.name, tex=tex, title=title or label, cap=cap or f"{A.label or A.name} {SYM[op]} {getattr(B, 'label', '') or getattr(B, 'name', fmt(B) if isinstance(B, (int, float)) else '')}, cell by cell.",
                   info=info, cells=cells, expand=expand)
        return out

    def map(self, X, fn, name=None, label="", tex="", cap="", info="", title="", expand=1, color=None, f=None, cell=None, symbol=None):
        """Apply a function to every cell. fn: a key of MAPS, or your own name with f=callable, cell='g({x})', symbol='g'."""
        if fn in MAPS:
            f0, cell0, sym0 = MAPS[fn]
            f, cell, symbol = f or f0, cell or cell0, symbol or sym0
        R, C = X.shape
        vals = [[f(X[i, j]) for j in range(C)] for i in range(R)]
        out = T(self, self._name(name), vals, X.rows, X.cols, label, "", color)
        cells = []
        for i in range(R):
            for j in range(C):
                pre, post = cell.split("{x}")
                cells.append({"out": [i, j], "reads": [[X.name, i, j]], "expr": [[pre, None], [X.f(X[i, j]), X.name], [post + " = ", None], [out.f(out[i, j]), out.name]]})
        self._step(op="map", layout=[{"t": X.name}, symbol, {"t": out.name}], out=out.name, tex=tex, title=title or label or symbol,
                   cap=cap or f"Apply {symbol} to every cell.", info=info, cells=cells, expand=expand)
        return out

    def matmul(self, A, B, name=None, label="", tex="", cap="", info="", title="", expand=1, color=None):
        (R, K), (K2, C) = A.shape, B.shape
        assert K == K2, f"inner sizes differ: {A.shape} · {B.shape}"
        vals = [[sum(A[i, k] * B[k, j] for k in range(K)) for j in range(C)] for i in range(R)]
        out = T(self, self._name(name), vals, A.rows, B.cols, label, "", color)
        cells = []
        for i in range(R):
            for j in range(C):
                ex = []
                for k in range(K):
                    if k:
                        ex.append([" + ", None])
                    ex += [[A.f(A[i, k]), A.name], ["×", None], [B.f(B[k, j]), B.name]]
                cells.append({"out": [i, j], "reads": [[A.name, i, k] for k in range(K)] + [[B.name, k, j] for k in range(K)],
                              "expr": ex + [[" = ", None], [out.f(out[i, j]), out.name]]})
        self._step(op="matmul", layout=[{"t": A.name}, "·", {"t": B.name}, "=", {"t": out.name}], out=out.name, tex=tex, title=title or label or "dot products",
                   cap=cap or "Each output cell = one row times one column, summed.", info=info, cells=cells, expand=expand)
        return out

    def transpose(self, X, name=None, label="", cap="", info="", title="", expand=0):
        R, C = X.shape
        out = T(self, self._name(name), [[X[i, j] for i in range(R)] for j in range(C)], X.cols, X.rows, label or f"{X.label} (transposed)", X.unit)
        cells = [{"out": [j, i], "reads": [[X.name, i, j]], "expr": [[X.f(X[i, j]), X.name], [" moves to row ", None], [str(j + 1), None]]} for i in range(R) for j in range(C)]
        self._step(op="transpose", layout=[{"t": X.name}, "ᵀ", {"t": out.name}], out=out.name, tex="", title=title or "transpose", cap=cap or "Rows become columns.", info=info, cells=cells, expand=expand)
        return out

    def rank(self, X, axis="cols", name=None, label="rank", cap="", info="", title="", expand=0):
        """Rank within each column (axis='cols') or row; 1 = smallest. Ties get the average rank."""
        R, C = X.shape
        out = [[0.0] * C for _ in range(R)]
        groups = [[(i, j) for i in range(R)] for j in range(C)] if axis == "cols" else [[(i, j) for j in range(C)] for i in range(R)]
        for g in groups:
            srt = sorted(g, key=lambda ij: X[ij])
            k = 0
            while k < len(srt):
                m = k
                while m + 1 < len(srt) and X[srt[m + 1]] == X[srt[k]]:
                    m += 1
                for q in range(k, m + 1):
                    out[srt[q][0]][srt[q][1]] = (k + m) / 2 + 1
                k = m + 1
        o = T(self, self._name(name), out, X.rows, X.cols, label, "")
        cells = [{"out": [i, j], "reads": [[X.name, a, b] for a, b in (groups[j] if axis == "cols" else groups[i])],
                  "expr": [[X.f(X[i, j]), X.name], [" is number ", None], [out.f(out[i][j]), o.name], [f" from the bottom of its {'column' if axis == 'cols' else 'row'}", None]]} for i in range(R) for j in range(C)]
        self._step(op="rank", layout=[{"t": X.name}, "rank", {"t": o.name}], out=o.name, tex="", title=title or label, cap=cap or "Replace each value by its rank.", info=info, cells=cells, expand=expand)
        return o

    def dist(self, name, params, x, tail="upper", src=None, cap="", info="", title="", tex="", xlabel="", label=""):
        """Show where an observed statistic falls on a reference distribution, with the tail shaded.
        name: norm (params mu, sd) | t (df) | chi2 (df) | pois (lam) | nb (mu, phi) | binom (n, p). src=(tensor, i, j) highlights where x came from."""
        p = _tail(name, params, x, tail)
        self._step(op="dist", dist=name, params=params, x=x, tail=tail, p=p, src=[src[0].name, src[1], src[2]] if src else None, layout=[{"t": src[0].name}] if src else [],
                   tex=tex, title=title or f"where {fmt(x)} falls", cap=cap or f"Shaded area = p = {fmt(p)}.", info=info, cells=[], expand=0, xlabel=xlabel, label=label)
        return p

    def symbols(self, **syms):
        """The letter (TeX) each table has in the formulas: t.symbols(X="x", N="N", CPM=r"\\mathrm{CPM}")."""
        self.syms.update(syms)

    def _warnings(self):
        out = []
        for st in self.steps:
            if not st.get("tex"):
                continue
            used = [n for it in st["layout"] if isinstance(it, dict) for n in (it.get("t"), it.get("right"), it.get("below")) if n] + [st.get("out")]
            miss = [n for n in dict.fromkeys(used) if n and n not in self.syms]
            if miss:
                out.append(f"calc '{st['title']}': formula without symbols for {', '.join(miss)}; add t.symbols({miss[0]}=...) so the sidebar can explain it")
        known = {"sum", "prod", "bar", "log", "ln", "sqrt", "frac", "times", "cdot", "exp", "mathrm", "text", "left", "right", "quad", "qquad", "approx"}
        for st in self.steps:   # an operator the sidebar cannot explain on its own: the author must
            info = st.get("info") if isinstance(st.get("info"), dict) else {}
            new = [c for c in dict.fromkeys(re.findall(r"\\([a-zA-Z]+)", st.get("tex") or "")) if c not in known and len(c) > 2 and not any(c in k for k in info.get("notation", {}))]
            new = [c for c in new if c not in ("alpha", "beta", "gamma", "delta", "sigma", "mu", "lambda", "theta", "phi", "epsilon", "rho", "tau", "pi", "chi", "nu", "omega")]
            if new:
                out.append(f"calc '{st['title']}': the sidebar cannot explain \\{new[0]}; pass info={{'text': '...', 'notation': {{r'\\{new[0]}': ['meaning', 'example from the table']}}}}")
        if any(st.get("tex") for st in self.steps) and self.index == {"i": "row", "j": "column"}:
            out.append("calc: say what i and j count, e.g. Trace(title, i='gene', j='sample')")
        return out

    def save(self, path):
        for t_ in self.tensors.values():
            t_.sym = self.syms.get(t_.name, "")
        warn = self._warnings()
        doc = {"title": self.title, "sub": self.sub, "index": self.index, "warn": warn,
               "tensors": {k: {**v.js(), "sym": v.sym} for k, v in self.tensors.items()}, "steps": self.steps}
        for w in warn:
            print("calctrace WARN:", w)
        Path(path).write_text(json.dumps(doc, indent=1, ensure_ascii=False))
        print(f"calctrace: {len(self.steps)} scenes, {len(self.tensors)} tables -> {path}")
        return doc


def _tail(name, params, x, tail):
    from math import erf, sqrt, exp, lgamma, log
    def ncdf(z): return .5 * (1 + erf(z / sqrt(2)))
    if name == "norm":
        mu, sd = params.get("mu", 0), params.get("sd", 1)
        lo = ncdf((x - mu) / sd)
    elif name in ("pois", "nb", "binom"):
        def pmf(k):
            if name == "pois":
                l = params["lam"]; return exp(k * log(l) - l - lgamma(k + 1))
            if name == "nb":
                mu, phi = params["mu"], params["phi"]; r = 1 / phi
                return exp(lgamma(k + r) - lgamma(r) - lgamma(k + 1) + r * log(r / (r + mu)) + k * log(mu / (r + mu)))
            n, pp = params["n"], params["p"]; return exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * log(pp) + (n - k) * log(1 - pp))
        k = int(x)
        lo = sum(pmf(i) for i in range(0, k + 1))
        up = 1 - lo + pmf(k)
        return up if tail == "upper" else lo if tail == "lower" else min(1, 2 * min(lo, up))
    else:  # t and chi2 by numeric integration
        df = params["df"]
        if name == "t":
            pdf = lambda v: exp(lgamma((df + 1) / 2) - lgamma(df / 2)) / sqrt(df * math.pi) * (1 + v * v / df) ** (-(df + 1) / 2); a = -60
        else:
            pdf = lambda v: 0 if v <= 0 else exp((df / 2 - 1) * log(v) - v / 2 - (df / 2) * log(2) - lgamma(df / 2)); a = 0
        n = 20000; h = (x - a) / n
        lo = sum(pdf(a + (i + .5) * h) for i in range(n)) * h
    up = 1 - lo
    return up if tail == "upper" else lo if tail == "lower" else min(1, 2 * min(lo, up))
