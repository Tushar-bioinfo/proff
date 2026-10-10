#!/usr/bin/env python3
"""Build one self-contained HTML page from a story folder.

Usage: build.py FOLDER [-o page.html]
FOLDER holds story.js (required) and optionally:
  data/*.json   -> window.PROFF_DATA[<stem>]   (calctrace output, tables, simulation inputs)
  svg/*.svg     -> window.PROFF_SVG[<stem>]    (matplotlib/plot.py figures; place with g.svgfile)
  img/*.png|jpg|webp|svg -> window.PROFF_ASSETS[<file name>] as data URIs (use g.img('<file name>', ...))
Kit files (stage.js, calc.js, bio.js) and the theme are inlined; KaTeX/d3/p5 load from cdnjs only when the story uses them.
Never edit the output by hand: edit story.js and rebuild.
"""
import argparse, base64, json, mimetypes, re, shutil, subprocess, sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent / "kit"
CDN = {  # pinned; checked 2026-10 on cdnjs
    "katex": ('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css">'
              '<script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js"></script>'),
    "d3": '<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>',
    "p5": '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>',
}
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()
    d = Path(a.folder)
    story = (d / "story.js").read_text()
    if shutil.which("node"):  # catch syntax errors here, with a line number, instead of a blank page in the browser
        r = subprocess.run(["node", "--check", str(d / "story.js")], capture_output=True, text=True)
        if r.returncode:
            sys.exit("build: story.js has a syntax error\n" + "\n".join(r.stderr.strip().splitlines()[:5]))
    data = {p.stem: json.loads(p.read_text()) for p in sorted((d / "data").glob("*.json"))} if (d / "data").is_dir() else {}
    svgs = {p.stem: clean_svg(p.read_text()) for p in sorted((d / "svg").glob("*.svg"))} if (d / "svg").is_dir() else {}
    assets = {}
    if (d / "img").is_dir():
        for p in sorted((d / "img").iterdir()):
            mt = mimetypes.guess_type(p.name)[0]
            if mt and mt.startswith("image/"):
                assets[p.name] = f"data:{mt};base64,{base64.b64encode(p.read_bytes()).decode()}"
    blob = story + json.dumps(data)
    needs = [k for k, pat in {"katex": r"\.tex\(|\"tex\": \"[^\"]|['\"][^'\"\n]*[\\_^][^'\"\n]*['\"]\s*:\s*[\[{'\"]", "d3": r"\bd3\.", "p5": r"\bnew p5\b|\bp5\."}.items() if re.search(pat, blob)]
    kit = [KIT / "stage.js", KIT / "calc.js"] + ([KIT / "bio.js"] if re.search(r"\bg\.(dna|rna|cell|cas9|virus|plasmid|tube|dish|flowcell|read|nucleus|guide)\(", story) else [])
    theme = "dark"
    css = (KIT / "proff.css").read_text()
    title = (re.search(r"title:\s*['\"]([^'\"]+)", story) or [None, "Proff"])[1]
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>{FONTS}{''.join(CDN[k] for k in needs)}
<style>{css}</style></head>
<body data-theme="{theme}">
<script>window.PROFF_DATA={json.dumps(data, ensure_ascii=False)};window.PROFF_SVG={json.dumps(svgs, ensure_ascii=False)};window.PROFF_ASSETS={json.dumps(assets)};</script>
{''.join(f'<script>{p.read_text()}</script>' for p in kit)}
<script>
{story}
</script>
</body></html>
"""
    out = Path(a.out) if a.out else d / "page.html"
    out.write_text(page)
    kb = len(page.encode()) / 1024
    print(f"build: {out}  {kb:.0f} KB  needs={','.join(needs) or 'none'}  data={list(data)}  svg={list(svgs)}  img={list(assets)}")
    if kb > 6000:
        print("WARN: page over 6 MB; shrink images (efficient mode keeps pages under 2 MB).")


def clean_svg(s):
    """Strip XML header/metadata from matplotlib SVGs so they inline cleanly."""
    s = re.sub(r"<\?xml.*?\?>|<!DOCTYPE.*?>|<metadata>.*?</metadata>", "", s, flags=re.S)
    return s.strip()


if __name__ == "__main__":
    main()
