#!/usr/bin/env python3
"""Check a built page in a real browser: every step and control extreme at desktop size (1440×900), plus a page-level pass at a small laptop window (1280×720). Browsers only; phones are out of scope.

Usage: check.py page.html [--out DIR] [--quick]
Finds: draw/console errors, overlapping labels, lines through labels, text across shape edges, text off the figure,
text under 12 px, too many words on a figure, long captions, horizontal page scroll, blank canvases,
and (in plot.py SVGs) overlapping text. Writes DIR/sheet-*.png contact sheets (one tile per state) to look at once.
Exit 0 = clean, 1 = warnings, 2 = could not run. Needs: pip playwright + `playwright install chromium` (or local Chrome).
"""
import argparse, json, math, sys
from pathlib import Path

DOM_TEXT = """(si) => {  // every visible SVG text pair, measured on screen: catches overlaps however the text was drawn
  const s = Proff.scenes[si], fig = s.el.fig, out = [];
  const vis = e => { let o = 1; for (let n = e; n && n !== fig; n = n.parentElement) o *= +(getComputedStyle(n).opacity || 1); return o > .3; };
  const T = [...fig.querySelectorAll('svg text')].map(e => [e, e.getBoundingClientRect()]).filter(([e, r]) => r.width > 1 && e.textContent.trim() && vis(e));
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = T[i][1], b = T[j][1], ov = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left) - 1) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) - 1);
    if (ov > 4) out.push([T[i][0].textContent.trim().slice(0, 24), T[j][0].textContent.trim().slice(0, 24)]); }
  return out; }"""

CONTRAST = r"""(si) => {  // text drawn on a shape of nearly the same colour (e.g. grey on grey): sample what lies under each label
  const rgb = c => { const m = String(c).match(/[\d.]+/g); if (!m) return null; let v = m.slice(0, 3).map(Number); if (/color\(srgb/.test(c)) v = v.map(x => x * 255); return v; };
  const L = v => { const f = c => (c /= 255) <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; return .2126 * f(v[0]) + .7152 * f(v[1]) + .0722 * f(v[2]); };
  const s = Proff.scenes[si], fig = s.el.fig, bg = rgb(getComputedStyle(fig).backgroundColor), out = [];
  for (const t of fig.querySelectorAll('svg text')) { const r = t.getBoundingClientRect(); if (r.width < 2 || !t.textContent.trim()) continue;
    if (+getComputedStyle(t).opacity < .3 || t.closest('[opacity="0"]')) continue;
    const fg = rgb(getComputedStyle(t).fill); if (!fg) continue; let under = bg;
    for (const e of document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)) { if (e === t || e.tagName === 'text' || e.tagName === 'tspan' || !fig.contains(e)) continue;
      if (e.tagName === 'svg' || e.tagName === 'DIV') break; const cs = getComputedStyle(e); if (cs.fill === 'none' || +cs.fillOpacity * +cs.opacity < .5) continue; under = rgb(cs.fill) || bg; break; }
    const a = L(fg), b = L(under), cr = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    if (cr < 2.6) out.push(`"${t.textContent.trim().slice(0, 24)}" is hard to read (contrast ${cr.toFixed(1)}:1 with what is under it)`); }
  return out; }"""

PAGE = """() => {
  const out = [];
  if (document.documentElement.scrollWidth > innerWidth + 2) out.push(`page scrolls sideways at ${innerWidth}px (content ${document.documentElement.scrollWidth}px)`);
  document.querySelectorAll('.fig canvas').forEach((c, i) => { try { const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let on = 0;
    for (let k = 3; k < x.length; k += 4 * 97) if (x[k]) on++; if (!on) out.push(`canvas ${i + 1} is blank`); } catch (e) {} });
  document.querySelectorAll('.stitle,.prose p,.side .lead').forEach(e => { if (e.scrollWidth > e.clientWidth + 2) out.push(`text overflows its box: "${e.textContent.slice(0, 40)}"`); });
  return out; }"""


SIDE = r"""() => {
  const out = [], s = document.querySelector('.side.open'); if (!s) return out;
  const raw = [...s.querySelectorAll('.sym,.ne,.eg,.lead,li,p')].map(e => { const c = e.cloneNode(true); c.querySelectorAll('.katex').forEach(k => k.remove()); return c.textContent; }).find(t => /\\[a-zA-Z]+|[_^]\{/.test(t));
  if (raw) out.push(`sidebar shows raw TeX: "${raw.trim().slice(0, 40)}"`);
  s.querySelectorAll('.lead,.ne,.eg,.wx,li').forEach(e => { if (e.scrollWidth > e.clientWidth + 2) out.push(`sidebar text overflows: "${e.textContent.slice(0, 40)}"`); });
  return out; }"""


def states(page):
    """Every step; for interactive scenes also each control at min and max (others at default)."""
    out = []
    for st in page.evaluate("Proff.states()"):
        out.append(st)
        ctl = page.evaluate(f"(Proff.scenes[{st['scene']}].controls||[]).filter(c=>c.type!=='button').map(c=>[c.name,c.min,c.max])")
        for name, lo, hi in ctl:   # every step: a panel that arrives later can still break at a slider extreme
            for v in (lo, hi):
                out.append({**st, "params": {name: v}, "tag": f"{name}={v}"})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page")
    ap.add_argument("--out")
    ap.add_argument("--quick", action="store_true", help="desktop + dark only, no sheets")
    a = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("check: playwright missing -> layout check unknown. Install: pip install playwright && playwright install chromium"); sys.exit(2)
    src = Path(a.page).resolve()
    if src.is_dir(): src = src / "page.html"   # a folder means its page.html
    if not src.exists(): print(f"check: {src} not found. Build first: python3 scripts/build.py <folder>"); sys.exit(2)
    out = Path(a.out) if a.out else src.parent / "snaps"
    out.mkdir(parents=True, exist_ok=True)
    warns, shots = [], {}
    with sync_playwright() as p:
        try:
            b = p.chromium.launch()
        except Exception:
            try:
                b = p.chromium.launch(channel="chrome")
            except Exception as e:
                print(f"check: no browser ({e.__class__.__name__}) -> layout check unknown"); sys.exit(2)
        runs = [("desktop", 1440, 900, "dark")] if a.quick else [("desktop", 1440, 900, "dark"), ("laptop", 1280, 720, "dark")]
        for name, w, h, theme in runs:
            pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            logs = []
            pg.on("console", lambda m: m.type == "error" and logs.append(m.text))
            pg.on("pageerror", lambda e: logs.append(str(e)))
            pg.goto(src.as_uri())
            try:
                pg.wait_for_function("window.Proff && Proff.ready", timeout=15000)
            except Exception:
                warns.append(f"[{name}] page never became ready: {logs[:3]}")
                continue
            pg.wait_for_timeout(300)
            pg.add_style_tag(content=".side{transition:none!important}")   # the sidebar opens instantly while checking
            tiles = []
            if name == "laptop":   # laptop: sidebar open, the stage at its smallest; text must stay readable
                for st in pg.evaluate("Proff.states()"):
                    pg.evaluate("st => { Proff.show(st); Proff.side(st.scene); }", st)
                    pg.wait_for_timeout(60)
                    warns += [f"[laptop, sidebar open] {m}" for m in pg.evaluate(f"Proff.audit({st['scene']})") if "<12px" in m]
                pg.evaluate("Proff.side(null)")
            side_tiles = []
            for st in (states(pg) if name == "desktop" else []):
                pg.evaluate("st => Proff.show(st)", st)
                pg.wait_for_timeout(40)
                tag = f"s{st['scene'] + 1}.{st['step'] + 1}" + (f" {st['tag']}" if st.get("tag") else "")
                if name == "desktop" and theme == "dark":
                    aud = pg.evaluate(f"Proff.audit({st['scene']})")
                    warns += aud
                    for x, y in pg.evaluate(DOM_TEXT, st["scene"]):
                        if not any(x[:20] in m and y[:20] in m for m in aud):
                            warns.append(f"{tag}: text overlaps on screen: \"{x}\" × \"{y}\"")
                if name == "desktop":
                    warns += [f"{tag} [{theme}]: {m}" for m in pg.evaluate(CONTRAST, st["scene"])]
                if not a.quick:
                    el = pg.locator(f".card[data-s='{st['scene']}']") if pg.locator(f".card[data-s='{st['scene']}']").count() else pg.locator(".card").first
                    f = out / f"{name}-{len(tiles):03d}.png"
                    el.screenshot(path=str(f))
                    tiles.append((f, tag))
                if name == "desktop" and not st.get("tag"):   # the i sidebar of every step: rendered, checked, on its own sheet
                    pg.evaluate("i => Proff.side(i)", st["scene"])
                    pg.wait_for_timeout(60)
                    warns += [f"{tag}: {m}" for m in pg.evaluate(SIDE)]
                    if not a.quick and pg.locator(".side.open").count():
                        f = out / f"side-{len(side_tiles):03d}.png"
                        pg.evaluate("() => Object.assign(document.querySelector('.side.open').style, { position: 'absolute', height: 'auto', overflow: 'visible' })")   # whole sidebar, not just the screen
                        pg.locator(".side.open").screenshot(path=str(f))
                        pg.evaluate("() => document.querySelector('.side').removeAttribute('style')")
                        side_tiles.append((f, tag))
                    pg.evaluate("Proff.side(null)")
                    pg.wait_for_timeout(60)
            for m in pg.evaluate(PAGE):
                warns.append(f"[{name} {theme}] {m}")
            pg.evaluate("st => Proff.show(st)", {"i": 0, "scene": 0, "step": 0})
            if name == "desktop":
                pg.screenshot(path=str(out / "first.png"))
            for m in logs:
                warns.append(f"[{name} {theme}] console: {m[:200]}")
            errs = pg.evaluate("Proff.errors")
            warns += [f"[{name} {theme}] {e}" for e in errs]
            shots[f"{name}-{theme}"] = tiles
            if name == "desktop" and side_tiles:
                shots["sidebar"] = side_tiles
            pg.close()
        b.close()
    sheets = []
    for key, tiles in shots.items():
        if tiles:
            sheets += sheet(tiles, out, key)
    warns = list(dict.fromkeys(warns))
    for w_ in warns[:40]:
        print("WARN", w_)
    if len(warns) > 40:
        print(f"... {len(warns) - 40} more")
    print(f"check: {len(warns)} warnings; sheets: {', '.join(str(s) for s in sheets) or 'none'}")
    print("Look at each sheet once. A clean audit does not prove the picture teaches; check the story and the numbers.")
    sys.exit(1 if warns else 0)


def sheet(tiles, out, key, cols=3, tw=620):
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return []
    paths, per = [], cols * 4
    for n in range(0, len(tiles), per):
        chunk = tiles[n:n + per]
        ims = [Image.open(f) for f, _ in chunk]
        th = max(int(im.height * tw / im.width) for im in ims)
        rows = math.ceil(len(ims) / cols)
        S = Image.new("RGB", (cols * (tw + 16) + 16, rows * (th + 42) + 16), (40, 40, 44))
        d = ImageDraw.Draw(S)
        for k, (im, (_, tag)) in enumerate(zip(ims, chunk)):
            x, y = 16 + (k % cols) * (tw + 16), 16 + (k // cols) * (th + 42)
            S.paste(im.resize((tw, int(im.height * tw / im.width))), (x, y + 24))
            d.text((x, y + 4), tag, fill=(255, 220, 90))
        pth = out / f"sheet-{key}-{n // per + 1}.png"
        S.save(pth)
        paths.append(pth)
    for f, _ in tiles:
        f.unlink(missing_ok=True)
    return paths


if __name__ == "__main__":
    main()
