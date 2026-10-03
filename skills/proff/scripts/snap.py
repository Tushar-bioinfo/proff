#!/usr/bin/env python3
"""Screenshot every slide of a rendered deck, flag overflow, and write one contact sheet.

Usage: snap.py deck.html [--out DIR] [--cols 3]
Prints one line per problem (slide number + element that spills outside the 1920x1080 stage),
then the contact-sheet path. Needs python playwright + a Chromium/Chrome.
"""
import argparse, sys
from pathlib import Path

CHECK = """() => {
  const out = [];
  document.querySelectorAll('.slide').forEach((s, k) => {
    const prev = s.style.cssText; s.style.cssText += ';opacity:1;visibility:visible';
    const sb = s.getBoundingClientRect(), sc = sb.width / 1920;
    s.querySelectorAll('.note,.canvas,.polaroid,.opt,h1,h2,p,li,canvas').forEach(e => {
      if (e.closest('.reveal') || e.closest('.back')) return;
      const b = e.getBoundingClientRect();
      const pad = 8 * sc;
      if (b.right > sb.right + pad || b.bottom > sb.bottom + pad || b.left < sb.left - pad || b.top < sb.top - pad)
        out.push(`slide ${k+1}: <${e.tagName.toLowerCase()} class="${e.className}"> spills outside the slide`);
      if (e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflow !== 'visible')
        out.push(`slide ${k+1}: <${e.tagName.toLowerCase()}> text is clipped`);
    });
    s.querySelectorAll('svg text').forEach(t => {
      const v = t.ownerSVGElement.getBoundingClientRect(), b = t.getBoundingClientRect(), pad = 4 * sc;
      if (b.width && (b.right > v.right + pad || b.left < v.left - pad || b.bottom > v.bottom + pad || b.top < v.top - pad))
        out.push(`slide ${k+1}: svg text "${t.textContent.slice(0, 30)}" spills outside its diagram`);
    });
    s.style.cssText = prev;
  });
  return out;
}"""


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
        for msg in pg.evaluate(CHECK):
            print("WARN", msg)
        shots = []
        for k in range(n):
            pg.evaluate(f"deckTo({k},-1)")
            pg.wait_for_timeout(450)
            f = out / f"slide{k+1:02d}.png"
            pg.screenshot(path=str(f))
            shots.append(f)
        # contact sheet: render the screenshots into a grid in the same browser
        cols = a.cols
        rows = (n + cols - 1) // cols
        w, h = 640, 360
        imgs = "".join(f'<img src="{s.as_uri()}" style="width:{w}px;height:{h}px;margin:4px;border:1px solid #444">' for s in shots)
        sheet = out / "_sheet.html"
        sheet.write_text(f'<body style="margin:0;background:#222;width:{cols*(w+10)}px">{imgs}</body>')
        pg.set_viewport_size({"width": cols * (w + 10), "height": rows * (h + 10)})
        pg.goto(sheet.as_uri())
        pg.wait_for_timeout(300)
        pg.screenshot(path=str(out / "sheet.png"), full_page=True)
        br.close()
    print(out / "sheet.png")


if __name__ == "__main__":
    sys.exit(main())
