#!/usr/bin/env python3
"""Screenshot every slide of a rendered deck, flag layout problems, and write contact sheets.

Usage: snap.py deck.html [--out DIR] [--cols 3] [--offline]
Prints one WARN line per problem (max 12): text off the slide edge, under the navigation bar,
clipped, overflowing its own box, outside its diagram, bad LaTeX, or small Mermaid text.
Then writes sheet.png (all slides) and svg.png (diagrams). Needs playwright + Chromium/Chrome.
"""
import argparse, re, sys
from pathlib import Path

# Run on the active slide with every build step shown. Flags content that leaves the safe area,
# sits under the fixed navigation bar or the level label, is clipped, or (svg text) leaves its diagram.
CHECK = """(k) => {
  const s = document.querySelectorAll('.slide')[k], out = [], seen = new Set();
  const sb = s.getBoundingClientRect(), sc = sb.width / 1920, m = 24 * sc;
  const cover = [...document.querySelectorAll('.nav'), ...s.querySelectorAll('.lvl,.sym,.vs')]
    .filter(e => getComputedStyle(e).display !== 'none' && !(e.classList.contains('sym') && s.classList.contains('sym-open')))
    .map(e => [e, e.getBoundingClientRect()]);
  const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const skip = '.doodle,.lvl,.nav,.reveal,.back';
  const name = e => e.tagName.toLowerCase() === 'text' ? `svg text "${e.textContent.trim().slice(0, 30)}"`
    : `"${(e.innerText || e.tagName).trim().split('\\n')[0].slice(0, 40)}"`;
  const add = (e, why) => { for (const a of seen) if (a.contains(e)) return; seen.add(e); out.push(`slide ${k+1}: ${name(e)} ${why}`); };
  const own = e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  // the badge overlaps card boxes by design; only the painted letters count
  const glyphs = e => { const r = document.createRange(); r.selectNodeContents(e); return [...r.getClientRects()].filter(x => x.width && x.height); };
  s.querySelectorAll('*').forEach(e => {
    if (s.classList.contains('snap-card') && !e.closest('.sym')) return;
    if (e.closest('.katex')) return;
    if (e.closest(skip) || (e.closest('svg') && e.tagName !== 'svg' && e.tagName !== 'text')) return;
    if (!(own(e) || e.matches('.tex,.sym') || ['svg', 'CANVAS', 'IMG', 'BUTTON', 'INPUT'].includes(e.tagName))) return;
    // rendered math: measure the painted equation, not its container
    const b = (e.matches('.tex') && e.querySelector('.katex') || e).getBoundingClientRect();
    if (!b.width || !b.height) return;
    if (e.tagName === 'text') {
      const v = e.ownerSVGElement.getBoundingClientRect(), pad = 4 * sc;
      if (b.right > v.right + pad || b.left < v.left - pad || b.bottom > v.bottom + pad || b.top < v.top - pad)
        add(e, 'spills outside its diagram');
      return;
    }
    if (b.right > sb.right - m || b.bottom > sb.bottom - m || b.left < sb.left + m || b.top < sb.top + m)
      add(e, 'runs off the slide edge');
    else for (const [c, r] of cover) if (!c.contains(e) && (c.classList.contains('vs') ? glyphs(e) : [b]).some(x => hit(x, r))) {
      add(e, `sits under the ${c.classList.contains('nav') ? 'navigation bar' : c.classList.contains('sym') ? 'notation box' : c.classList.contains('vs') ? 'vs badge' : 'level label'}`); break; }
    // tall display glyphs poke a few px past their line box: allow a quarter of the font size vertically
    const style = getComputedStyle(e), slack = Math.max(3, 0.25 * parseFloat(style.fontSize));
    const over = e.scrollWidth > e.clientWidth + 3 || e.scrollHeight > e.clientHeight + slack;
    if ((own(e) || e.matches('.tex')) && e.clientWidth && over && style.overflow === 'visible') add(e, 'text overflows its box');
    if (over && e.clientWidth && style.overflow !== 'visible') add(e, 'text is clipped');
  });
  if (!s.classList.contains('snap-card')) {
    s.querySelectorAll('.katex-error').forEach(e => add(e, 'LaTeX error'));
    // mermaid (trial): font size after the SVG is scaled to fit.
    s.querySelectorAll('.mmd svg').forEach(e => {
      const r = e.getBoundingClientRect(), v = e.viewBox.baseVal;  // the drawing fits by width or height, whichever is tighter
      if (28 * Math.min(r.width / v.width, r.height / v.height) / sc < 20)
        add(e, 'mermaid text too small; split into overview + zoom-ins, or go left-to-right');
      e.querySelectorAll('foreignObject').forEach(f => { const d = f.firstElementChild;
        if (d && d.scrollWidth > f.width.baseVal.value + 2) add(f, `mermaid label cut off: "${d.textContent.trim().slice(0, 30)}"`); });
    });
  }
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
    ap.add_argument("--offline", action="store_true", help="block library CDNs and Google Fonts to test raw fallback")
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    deck = Path(a.deck).resolve()
    out = Path(a.out or deck.parent / "snaps").resolve()
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        try:
            br = p.chromium.launch()
        except Exception:
            br = p.chromium.launch(channel="chrome")
        pg = br.new_page(viewport={"width": 1920, "height": 1080})
        if a.offline:
            pg.route(re.compile(r'https://(?:cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)/'), lambda route: route.abort())
        pg.goto(deck.as_uri())
        try:
            pg.wait_for_function("window.deckReady===true", timeout=10000)
        except Exception:
            print("WARN libraries did not settle")
        if pg.evaluate("Object.values(window.deckLibs||{}).some(v=>v===false)"):
            print("NOTE math/mermaid shown raw (offline?)")
        n = pg.evaluate("document.querySelectorAll('.slide').length")
        warns, shots, svgs = [], [], []
        for k in range(n):
            pg.evaluate(f"deckTo({k},-1)")
            if pg.evaluate("document.body.classList.contains('page')"):
                pg.locator('.slide').nth(k).scroll_into_view_if_needed()
            pg.wait_for_timeout(450)
            warns += pg.evaluate(CHECK, k)
            if pg.evaluate(f"!!document.querySelectorAll('.slide')[{k}].querySelector('.sym-toggle')"):
                pg.evaluate(f"document.querySelectorAll('.slide')[{k}].classList.add('sym-open','snap-card')")
                warns += pg.evaluate(CHECK, k)
                pg.evaluate(f"document.querySelectorAll('.slide')[{k}].classList.remove('sym-open','snap-card')")
            f = out / f"slide{k+1:02d}.png"
            pg.screenshot(path=str(f))
            shots.append(f)
            if pg.evaluate(f"!!document.querySelectorAll('.slide')[{k}].querySelector('.scene,.canvas svg,.mmd svg')"):
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
