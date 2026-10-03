#!/usr/bin/env python3
"""Screenshot every slide of a rendered deck, flag layout problems, and write contact sheets.

Usage: snap.py deck.html [--out DIR] [--cols 3]
Prints one WARN line per problem (max 12): text off the slide edge, under the navigation bar,
clipped, or outside its diagram. Then writes sheet.png (all slides) and svg.png (diagram slides, larger). Needs python playwright + a Chromium/Chrome.
"""
import argparse, sys
from pathlib import Path

# Run on the active slide with every build step shown. Flags content that leaves the safe area,
# sits under the fixed navigation bar or the level label, is clipped, or (svg text) leaves its diagram.
CHECK = """(k) => {
  const s = document.querySelectorAll('.slide')[k], out = [], seen = new Set();
  const sb = s.getBoundingClientRect(), sc = sb.width / 1920, m = 24 * sc;
  const cover = [...document.querySelectorAll('.nav,.lvl')].map(e => [e, e.getBoundingClientRect()]);
  const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const skip = '.doodle,.lvl,.nav,.reveal,.back';
  const name = e => e.tagName.toLowerCase() === 'text' ? `svg text "${e.textContent.trim().slice(0, 30)}"`
    : `"${(e.innerText || e.tagName).trim().split('\\n')[0].slice(0, 40)}"`;
  const add = (e, why) => { for (const a of seen) if (a.contains(e)) return; seen.add(e); out.push(`slide ${k+1}: ${name(e)} ${why}`); };
  const own = e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  s.querySelectorAll('*').forEach(e => {
    if (e.closest(skip) || (e.closest('svg') && e.tagName !== 'svg' && e.tagName !== 'text')) return;
    if (!(own(e) || ['svg', 'CANVAS', 'IMG', 'BUTTON', 'INPUT'].includes(e.tagName))) return;
    const b = e.getBoundingClientRect();
    if (!b.width || !b.height) return;
    if (e.tagName === 'text') {
      const v = e.ownerSVGElement.getBoundingClientRect(), pad = 4 * sc;
      if (b.right > v.right + pad || b.left < v.left - pad || b.bottom > v.bottom + pad || b.top < v.top - pad)
        add(e, 'spills outside its diagram');
      return;
    }
    if (b.right > sb.right - m || b.bottom > sb.bottom - m || b.left < sb.left + m || b.top < sb.top + m)
      add(e, 'runs off the slide edge');
    else for (const [c, r] of cover) if (hit(b, r)) { add(e, `sits under the ${c.classList.contains('nav') ? 'navigation bar' : 'level label'}`); break; }
    if (e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflow !== 'visible') add(e, 'text is clipped');
  });
  return out;
}"""


def sheet(pg, shots, path, cols, w):
    """Render screenshots into one grid image in the same browser."""
    h = w * 9 // 16
    rows = (len(shots) + cols - 1) // cols
    imgs = "".join(f'<img src="{f.as_uri()}" style="width:{w}px;height:{h}px;margin:4px;border:1px solid #444">' for f in shots)
    tmp = path.with_suffix(".html")
    tmp.write_text(f'<body style="margin:0;background:#222;width:{cols*(w+10)}px">{imgs}</body>')
    pg.set_viewport_size({"width": cols * (w + 10), "height": rows * (h + 10)})
    pg.goto(tmp.as_uri())
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(path), full_page=True)
    tmp.unlink()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck")
    ap.add_argument("--out")
    ap.add_argument("--cols", type=int, default=3)
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    deck = Path(a.deck).resolve()
    out = Path(a.out or deck.parent / "snaps")
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        try:
            br = p.chromium.launch()
        except Exception:
            br = p.chromium.launch(channel="chrome")
        pg = br.new_page(viewport={"width": 1920, "height": 1080})
        pg.goto(deck.as_uri())
        pg.wait_for_timeout(1200)
        n = pg.evaluate("document.querySelectorAll('.slide').length")
        warns, shots, svgs = [], [], []
        for k in range(n):
            pg.evaluate(f"deckTo({k},-1)")
            pg.wait_for_timeout(450)
            warns += pg.evaluate(CHECK, k)
            f = out / f"slide{k+1:02d}.png"
            pg.screenshot(path=str(f))
            shots.append(f)
            if pg.evaluate(f"!!document.querySelectorAll('.slide')[{k}].querySelector('.scene')"):
                svgs.append(f)
        for msg in warns[:12]:
            print("WARN", msg)
        if len(warns) > 12:
            print(f"WARN ...and {len(warns) - 12} more")
        sheet(pg, shots, out / "sheet.png", a.cols, 640)
        if svgs:  # diagrams larger, final build step, so one look checks them all
            sheet(pg, svgs, out / "svg.png", 2, 960)
        br.close()
    print(out / "sheet.png")
    if svgs:
        print(out / "svg.png")


if __name__ == "__main__":
    sys.exit(main())
