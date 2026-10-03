#!/usr/bin/env python3
"""Render a lesson spec (JSON) into one self-contained HTML lesson (deck or scrolling page).

Usage: render.py spec.json [-o out.html] [--layout deck|page] [--palette NAME] [--embed]
--embed puts images inside the HTML (one file to share); default copies them to img/ next to it.
The author writes content only; colours, rotations, pins, backgrounds and all CSS/JS are chosen here.
Text fields accept a tiny markdown: **bold**, *italic*, `code`, blank line = new paragraph, "- " lines = list.
"""
import argparse, base64, html, json, mimetypes, re, shutil, sys
from itertools import cycle
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"
COLORS = ["a2", "a3", "a1", "a4", "a6", "a5"]  # accent slots, cycled per card
ROT = ["r1", "r2", "r3", "r4"]
GF = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family={}&display=swap" rel="stylesheet">'
# Accent palettes for the dark theme: p1 primary, p2 highlight, p3 secondary, p4..p6 extra.
PALETTES = {
    "raycast": ["#ff6363", "#ffc531", "#56c2ff", "#59d499", "#b98cff", "#ff8f4a"],
    "aurora":  ["#2ee6c5", "#b5f06a", "#a78bfa", "#f472d0", "#7dd3fc", "#ffb38a"],
    "matcha":  ["#8fd6a4", "#d4e78f", "#c7b5ff", "#7fd1c7", "#e8cfa6", "#a7f3d0"],
    "neon":    ["#ff4fd8", "#b6ff3b", "#3cffd0", "#9b7bff", "#ff9f43", "#f0abfc"],
    "pastel":  ["#f9a8d4", "#fdba74", "#c4b5fd", "#99f6e4", "#d9f99d", "#e9d5ff"],
    "mono":    ["#a78bfa", "#e4e4e7", "#8b8b94", "#c4b5fd", "#d4d4d8", "#6d5bd0"],
}

THEMES = {
    "blockframe-dark": {
        "css": "blockframe-dark.css", "fonts": GF.format("Inter:wght@400;450;500;600;700;800;900&family=Space+Grotesk:wght@500;700"),
        "bgs": ["bg-a", "bg-b", "bg-a"], "hero_bg": "bg-c", "title_cls": "a1 solid", "remember_cls": "a2 solid",
        "T": {"ink": "#f4f4f5", "muted": "#9a9aa1", "grid": "#2a2a2f", "bg": "#101012",
              "c": ["#56c2ff", "#ffc531", "#ff6363", "#59d499", "#b98cff", "#ff8f4a"]},
        "deco": ['<div class="star a2" style="right:70px;bottom:70px;transform:rotate(12deg)"></div>',
                 '<div class="stripe a4" style="right:120px;bottom:56px;transform:rotate(-4deg)"></div>',
                 '<div class="bracket" style="left:44px;top:44px;border-right:0;border-bottom:0"></div>'
                 '<div class="bracket" style="right:44px;bottom:44px;border-left:0;border-top:0"></div>'],
    },
}


STEPNAV = ('<div class="stepnav"><button data-sb="-1" aria-label="previous step">&lsaquo;</button>'
           '<span class="stepctr"></span><button data-sb="1" aria-label="next step">&rsaquo;</button></div>')
# Arrowhead shared by every diagram: class="ln arr" on a line/path.
DEFS = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
        '<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
        '<path d="M1.5 1.5L8.5 5L1.5 8.5" fill="none" stroke="#ececee" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        '</marker></defs></svg>')


def md(s):
    """Tiny markdown -> HTML. Escapes first, so author text can't inject tags."""
    if s is None:
        return ""
    out = []
    for block in re.split(r"\n\s*\n", str(s).strip()):
        lines = block.split("\n")
        if all(l.lstrip().startswith("- ") for l in lines):
            out.append("<ul>" + "".join(f"<li>{inline(l.lstrip()[2:])}</li>" for l in lines) + "</ul>")
        else:
            out.append("<p>" + "<br>".join(inline(l) for l in lines) + "</p>")
    return "".join(out)


def inline(s):
    s = html.escape(s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    return re.sub(r"(?<!\*)\*(?!\s)(.+?)\*", r"<i>\1</i>", s)


def esc(s):
    return html.escape(str(s or ""))


class R:
    def __init__(self, theme, spec_dir=None, out_dir=None, embed=False):
        self.th, self.embed = theme, embed
        self.col, self.rot = cycle(COLORS), cycle(ROT)
        self.sims = []
        self.spec_dir, self.out_dir = spec_dir, out_dir

    def asset(self, src):
        """Copy a local image next to the output so the HTML stays portable."""
        if not self.spec_dir or re.match(r"^(https?:|data:)", src):
            return src
        f = (self.spec_dir / src).resolve()
        if not f.exists():
            print(f"WARN image not found: {f}", file=sys.stderr)
            return src
        if self.embed:
            mt = mimetypes.guess_type(f.name)[0] or "image/png"
            return f"data:{mt};base64," + base64.b64encode(f.read_bytes()).decode()
        (self.out_dir / "img").mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, self.out_dir / "img" / f.name)
        return f"img/{f.name}"

    def note(self, n, cls="", pin=True, color=None):
        c = color or n.get("color") or next(self.col)
        pin_cls = "pin" if pin else ""
        icon = f'<div class="icon">{esc(n["icon"])}</div>' if n.get("icon") else ""
        h = f"<h3>{esc(n['h'])}</h3>" if n.get("h") else ""
        hand = f'<div class="hand">{esc(n["hand"])}</div>' if n.get("hand") else ""
        return f'<div class="note {c} {pin_cls} {next(self.rot)} {cls}">{icon}{h}{md(n.get("t"))}{hand}</div>'

    def head(self, s):
        eb = f'<div class="eyebrow">{esc(s["eyebrow"])}</div>' if s.get("eyebrow") else ""
        return f'<div>{eb}<h2>{esc(s["title"])}</h2></div>' if s.get("title") else eb

    # ---- slide types ----
    def title(self, s):
        hook = f'<div class="hand" style="margin-top:28px">{esc(s["hook"])}</div>' if s.get("hook") else ""
        return (f'<div class="note {self.th["title_cls"]} pin r1 hero">'
                f'<h1>{esc(s["title"])}</h1><p class="sub">{esc(s.get("subtitle"))}</p>{hook}</div>')

    def statement(self, s):
        hand = f'<div class="hand" style="margin-top:24px">{esc(s["hand"])}</div>' if s.get("hand") else ""
        return (f'<div class="note {s.get("color","a3")} solid pin r2 hero">'
                f'<div class="disp">{esc(s["text"])}</div>{hand}</div>')

    def notes(self, s):
        ns = s["notes"]
        grid = "grid3" if len(ns) == 3 else "grid2" if len(ns) in (2, 4) else "row"
        return self.head(s) + f'<div class="{grid}">' + "".join(self.note(n) for n in ns) + "</div>" + self.foot(s)

    def flow(self, s):
        arrow = ('<svg class="arrow" viewBox="0 0 90 60"><path d="M5 30 Q 45 {y} 75 30"/>'
                 '<polygon points="72,22 88,30 72,38"/></svg>')
        parts = []
        for k, st in enumerate(s["steps"]):
            if k:
                parts.append(arrow.format(y=10 if k % 2 else 50))
            st = dict(st)
            st.setdefault("icon", str(k + 1))
            parts.append(self.note(st, "sm"))
        return self.head(s) + '<div class="flow">' + "".join(parts) + "</div>" + self.foot(s)

    def compare(self, s):
        a, b = self.note(s["a"], color="a3"), self.note(s["b"], color="a1")
        return (self.head(s) + f'<div class="grid2" style="position:relative">{a}{b}'
                f'<div class="vs">{esc(s.get("vs","vs"))}</div></div>' + self.foot(s))

    def figure(self, inner, s):
        side = "".join(self.note(n, "sm") for n in s.get("notes", []))
        side_html = f'<div style="display:flex;flex-direction:column;gap:44px;justify-content:center">{side}</div>' if side else ""
        cols = "1.5fr 1fr" if side else "1fr"
        return self.head(s) + f'<div style="display:grid;grid-template-columns:{cols};gap:64px;align-items:center">{inner}{side_html}</div>'

    def image(self, s):
        s["src"] = self.asset(s["src"])
        cap = f'<div class="cap">{esc(s["caption"])}</div>' if s.get("caption") else ""
        img = f'<img src="{esc(s["src"])}" alt="{esc(s.get("alt", s.get("caption","")))}">'
        return self.figure(f'<div class="polaroid r1">{img}{cap}</div>', s)

    def svg(self, s):
        """Diagram in the SVG kit. `steps` = captions; elements with data-step / data-only build up per step."""
        canvas = f'<div class="canvas r2">{s["svg"]}</div>'
        if not s.get("steps"):
            return self.figure(canvas, s)
        caps = "".join(f'<div class="cap" data-cap="{k+1}"><b>{k+1}</b><div>{md(t)}</div></div>' for k, t in enumerate(s["steps"]))
        return (self.head(s) + f'<div class="scene">{canvas}<div class="caps">{caps}{STEPNAV}</div></div>' + self.foot(s))

    scene = svg

    def calc(self, s):
        """Step-by-step calculation: one line appears per step. lines[] of {expr, note}; optional given."""
        rows = "".join(
            f'<div class="crow{" res" if l.get("result") else ""}" data-step="{k+1}"><div class="expr">{inline(l["expr"])}</div>'
            f'<div class="why">{inline(l.get("note",""))}</div></div>' for k, l in enumerate(s["lines"]))
        given = f'<div class="given"><span>given</span>{inline(s["given"])}</div>' if s.get("given") else ""
        s.setdefault("eyebrow", "work it through")
        return self.head(s) + f'<div class="calc">{given}{rows}{STEPNAV}</div>' + self.foot(s)

    def angles(self, s):
        """Exam angles: flip cards, each tagged with how the question is twisted."""
        s.setdefault("eyebrow", "how it gets asked")
        s.setdefault("title", "Angles you might not expect")
        return self.quiz(s, short=True)

    def predict(self, s):
        opts = "".join(f'<button class="opt">{inline(o)}</button>' for o in s["options"])
        why = self.note({"h": s.get("why_h", "Why"), "t": s["why"]}, "sm reveal", color="a4")
        return (f'<div><div class="eyebrow">predict first</div><h2>{esc(s["q"])}</h2></div>'
                f'<div class="grid2" style="align-items:start"><div class="opts" data-predict="{int(s["answer"])}">{opts}</div>{why}</div>')

    def quiz(self, s, short=False):
        cards = []
        for k, c in enumerate(s["cards"]):
            col = COLORS[k % len(COLORS)]
            tag = f'<div class="tag">{esc(c["tag"])}</div>' if c.get("tag") else ""
            cards.append(f'<div class="flip {ROT[k % 4]}{" short" if short else ""}"><div class="inner">'
                         f'<div class="face front {col}">{tag}<p><b>{inline(c["q"])}</b></p><div class="hint">say it out loud, then tap</div></div>'
                         f'<div class="face back white">{md(c["a"])}</div></div></div>')
        grid = "grid3" if len(cards) == 3 else "grid2"
        s.setdefault("eyebrow", "retrieve it")
        return self.head(s) + f'<div class="{grid}">' + "".join(cards) + "</div>"

    def sim(self, s):
        sid = f"sim{len(self.sims)}"
        self.sims.append(f"SIMS.{sid}=function(ctx,p,W,H,rng,T){{{s['js']}}};")
        ctls = "".join(
            f'<div class="ctl"><label><span>{esc(c["label"])}</span><b data-out="{esc(c["name"])}">{c["value"]}</b></label>'
            f'<input type="range" name="{esc(c["name"])}" min="{c["min"]}" max="{c["max"]}" step="{c.get("step",1)}" value="{c["value"]}"></div>'
            for c in s.get("controls", []))
        reseed = '<button class="btn" data-reseed>new sample</button>' if s.get("reseed", True) else ""
        side = f'<div>{ctls}{reseed}<div style="margin-top:28px">{self.note({"t": s.get("text",""), "hand": s.get("hand")}, "sm", color="a2")}</div></div>'
        s.setdefault("eyebrow", "play with it")
        return self.head(s) + f'<div class="sim"><canvas data-sim="{sid}" width="1000" height="640"></canvas>{side}</div>'

    def takeaway(self, s):
        pts = self.note({"h": s.get("h", "Remember"), "t": "\n".join(f"- {p}" for p in s["points"])}, color=self.th["remember_cls"])
        extra = []
        if s.get("caveat"):
            extra.append(self.note({"h": "Watch out", "t": s["caveat"]}, "sm", color="a1"))
        if s.get("next"):
            extra.append(self.note({"h": "Go deeper", "t": s["next"]}, "sm", color="a3"))
        return self.head(s) + f'<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:64px">{pts}<div style="display:flex;flex-direction:column;gap:48px">{"".join(extra)}</div></div>'

    def text(self, s):  # STE prose page
        return self.head(s) + f'<div class="note white pin r2" style="max-width:1500px">{md(s["t"])}</div>' + self.foot(s)

    def foot(self, s):
        return f'<div class="hand">{esc(s["hand"])}</div>' if s.get("hand") else ""


def render(spec, layout="deck", theme="blockframe-dark", palette="aurora", spec_dir=None, out_dir=None, embed=False):
    th = dict(THEMES[theme])
    pal = PALETTES[palette]
    th["T"] = dict(th["T"], c=[pal[2], pal[1], pal[0], pal[3], pal[4], pal[5]])
    pal_css = ":root{" + "".join(f"--p{k+1}:{v};" for k, v in enumerate(pal)) + "}"
    r = R(th, spec_dir, out_dir, embed)
    body = []
    for k, s in enumerate(spec["slides"]):
        fn = getattr(r, s.get("type", "notes"), None)
        if fn is None or s.get("type", "").startswith("_"):
            sys.exit(f"unknown slide type: {s.get('type')}")
        bg = s.get("bg") or (th["hero_bg"] if s.get("type") in ("title", "statement") else th["bgs"][k % 3])
        dood = th["deco"][(k // 2) % len(th["deco"])] if k % 2 == 0 else ""
        lvl = f'<div class="lvl">{esc(spec.get("level",""))} · {k+1}</div>' if k else ""
        body.append(f'<section class="slide {bg}">{lvl}{fn(dict(s))}{dood}</section>')
    css = (ASSETS / th["css"]).read_text() + pal_css
    js = (ASSETS / "deck.js").read_text()
    sims = f"window.T={json.dumps(th['T'])};window.SIMS={{}};" + "".join(r.sims)
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(spec["title"])}</title>'
            f'{th["fonts"]}<style>{css}</style></head><body class="{layout}">{DEFS}<div id="stage">{"".join(body)}</div><div class="grain"></div>'
            f'<div class="nav"><button onclick="deckGo(-1)">&larr;</button><span id="ctr"></span><button onclick="deckGo(1)">&rarr;</button></div>'
            f'<script>{sims}</script><script>{js}</script></body></html>')


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("-o", "--out")
    ap.add_argument("--layout", choices=["deck", "page"], help="deck = 16:9 slides, page = scrolling lesson (default: spec 'layout' or deck)")
    ap.add_argument("--theme", choices=list(THEMES), help="default: spec 'theme' or blockframe-dark")
    ap.add_argument("--palette", choices=list(PALETTES), help="default: spec 'palette' or aurora")
    ap.add_argument("--embed", action="store_true", help="put images inside the HTML (one portable file)")
    a = ap.parse_args()
    spec = json.loads(Path(a.spec).read_text())
    out = Path(a.out or Path(a.spec).with_suffix(".html"))
    out.parent.mkdir(parents=True, exist_ok=True)
    layout = a.layout or spec.get("layout", "deck")
    theme = a.theme or spec.get("theme", "blockframe-dark")
    palette = a.palette or spec.get("palette", "aurora")
    out.write_text(render(spec, layout, theme, palette, Path(a.spec).resolve().parent, out.parent, a.embed))
    print(out)
