#!/usr/bin/env python3
"""Matplotlib/seaborn figures that follow the page theme and stay checkable.

    import sys; sys.path.insert(0, "<skill>/scripts"); from plot import fig, save, C
    f, ax = fig()                       # 12 x 6.75 in, matches the 1200 x 675 stage
    ax.plot(x, y, color=C.c1, lw=3); ax.set_xlabel("dose (µM)")
    save(f, "story/svg/dose.svg")       # then in story.js: g.svgfile('dose', 0, 0, 1200, 675)

Colours: use C.c1..C.c6, C.ink, C.muted, C.grid, C.fig (never raw hex). save() rewrites them to CSS variables,
so the plot switches theme with the page. Text stays real text (svg.fonttype none) so check.py can measure overlaps.
Soft fills: pass alpha=..; the colour itself must still be a C.* token.
"""
import json, re
import matplotlib
matplotlib.use("Agg")
import logging
import matplotlib.pyplot as plt
logging.getLogger("matplotlib.font_manager").setLevel(logging.ERROR)  # Inter is set for the browser; layout falls back to DejaVu (wider, so safe)

TOKENS = ["ink", "muted", "grid", "fig", "line", "c1", "c2", "c3", "c4", "c5", "c6"]


class _C:  # sentinel colours: unique hex values that save() maps back to var(--token)
    pass


C = _C()
_SENT = {}
for k, name in enumerate(TOKENS):
    hx = f"#0{k + 1:x}0f0{k + 1:x}"  # e.g. #010f01 ... distinct and unlikely to occur naturally
    setattr(C, name, hx)
    _SENT[hx] = name
C.cycle = [C.c1, C.c2, C.c3, C.c4, C.c5, C.c6]

RC = {
    "svg.fonttype": "none", "svg.hashsalt": "proff", "font.family": ["Inter", "DejaVu Sans"], "font.size": 18,
    "axes.titlesize": 20, "axes.titleweight": "bold", "axes.labelsize": 18, "axes.labelweight": "semibold",
    "xtick.labelsize": 16, "ytick.labelsize": 16, "legend.fontsize": 16, "legend.frameon": False,
    "axes.facecolor": "none", "figure.facecolor": "none", "savefig.facecolor": "none", "savefig.transparent": True,
    "axes.edgecolor": C.muted, "axes.labelcolor": C.muted, "text.color": C.ink, "xtick.color": C.muted, "ytick.color": C.muted,
    "axes.grid": True, "grid.color": C.grid, "grid.linewidth": 1, "axes.axisbelow": True,
    "axes.spines.top": False, "axes.spines.right": False, "axes.linewidth": 2, "lines.linewidth": 3,
    "axes.prop_cycle": matplotlib.cycler(color=C.cycle), "patch.edgecolor": C.ink, "scatter.edgecolors": "none",
    "legend.labelcolor": C.ink, "figure.constrained_layout.use": True,
}
plt.rcParams.update(RC)


def fig(w=12, h=6.75, **kw):
    """New figure sized in inches at 100 px/in so 12 x 6.75 fills the 1200 x 675 stage exactly."""
    return plt.subplots(figsize=(w, h), dpi=100, **kw)


def save(f, path):
    """Write SVG with theme variables instead of colours. Raises if a raw (non-token) colour slipped in."""
    import io
    buf = io.StringIO()
    f.savefig(buf, format="svg")
    s = buf.getvalue()
    for hx, name in _SENT.items():
        s = re.sub(hx, f"var(--{name})", s, flags=re.I)
    raw = set(re.findall(r"#[0-9a-fA-F]{6}\b", s)) - {"#ffffff", "#000000"}
    if raw:
        print(f"plot.py WARN {path}: raw colours {sorted(raw)[:6]} will not follow the theme; use C.* tokens")
    s = re.sub(r"<\?xml.*?\?>|<!DOCTYPE.*?>|<metadata>.*?</metadata>", "", s, flags=re.S)
    s = s.replace('font-family="Inter"', "").replace("font-family:'Inter'", "")
    from pathlib import Path
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(s.strip())
    # sidecar: where each axes sits (fractions of the figure, y from top) and its data limits, so story.js can
    # annotate in data units: const A = g.svgfile('name', x, y, w, h); A[0].sx(3.2), A[0].sy(0.5)
    W, H = f.get_size_inches() * f.dpi
    axes = []
    for ax in f.axes:
        b = ax.get_window_extent()
        axes.append({"x": b.x0 / W, "y": 1 - b.y1 / H, "w": b.width / W, "h": b.height / H,
                     "xlim": list(ax.get_xlim()), "ylim": list(ax.get_ylim()), "xlog": ax.get_xscale() == "log", "ylog": ax.get_yscale() == "log"})
    side = Path(path).parent.parent / "data" / (Path(path).stem + "_axes.json")
    side.parent.mkdir(parents=True, exist_ok=True)
    side.write_text(json.dumps({"aspect": W / H, "axes": axes}))
    plt.close(f)
    print(f"plot: {path} ({len(s) // 1024} KB) + {side.name}")
    if len(s) > 300_000:
        print("plot.py WARN: SVG over 300 KB. Thin the points (a few hundred show the pattern) or draw them natively with g.dots.")
