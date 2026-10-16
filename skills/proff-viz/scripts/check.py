#!/usr/bin/env python3
"""Check a built page in a real browser: every step and control extreme at desktop size (1440×900), plus a page-level pass at a small laptop window (1280×720). Browsers only; phones are out of scope.

Usage: check.py page.html [--out DIR] [--quick]
Finds: draw/console errors, overlapping labels, lines through labels, text across shape edges, text off the figure,
text under 12 px, too many words on a figure, long captions, horizontal page scroll, blank canvases,
and (in plot.py SVGs) overlapping text. Writes DIR/sheet-*.png contact sheets (one tile per state) to look at once.
Exit 0 = clean, 1 = warnings, 2 = could not run. Needs: pip playwright + `playwright install chromium` (or local Chrome).
"""
import argparse, functools, http.server, json, math, sys, threading
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
  fig.scrollIntoView({ block: 'center', inline: 'nearest' });  // elementsFromPoint sees nothing off-screen
  for (const t of fig.querySelectorAll('svg text')) { const r = t.getBoundingClientRect(); if (r.width < 2 || !t.textContent.trim()) continue;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;  // still off-screen: cannot sample
    if (+getComputedStyle(t).opacity < .3 || t.closest('[opacity="0"]')) continue;
    const fg = rgb(getComputedStyle(t).fill); if (!fg) continue; let under = bg;
    const layers = [];
    for (const e of document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)) { if (e === t || e.tagName === 'text' || e.tagName === 'tspan' || !fig.contains(e)) continue;
      if (e.tagName === 'svg' || e.tagName === 'DIV') break;
      const cs = getComputedStyle(e); if (cs.fill === 'none' || !['rect','circle','ellipse','path','polygon'].includes(e.tagName)) continue;
      let alpha = +cs.fillOpacity; for (let n = e; n && n !== fig; n = n.parentElement) alpha *= +getComputedStyle(n).opacity;
      const color = rgb(cs.fill); if (color && alpha > 0) layers.push({color, alpha}); }
    // Composite actual translucent fills over the figure; raw hue alone is not the background.
    for (const {color, alpha} of layers.reverse()) under = color.map((v, i) => alpha * v + (1 - alpha) * under[i]);
    const a = L(fg), b = L(under), cr = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    if (cr < 2.6) out.push(`"${t.textContent.trim().slice(0, 24)}" is hard to read (contrast ${cr.toFixed(1)}:1 with what is under it)`); }
  return out; }"""

# Settled stage only: the step strip, caption and sidebar sit outside the svg/canvas.
FIG = """async (si) => {
  const fig = Proff.scenes[si].el.fig, svg = fig.querySelector('svg');
  let raw = '';
  if (svg) raw = svg.innerHTML;
  else { const c = fig.querySelector('canvas'); if (c) { try { raw = c.toDataURL(); } catch (e) { raw = ''; } } }
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}"""

# One line of .stitle. Same measurement as tools/titlewrap.py: height / computed line-height.
HEADLINE = """(si) => {
  const t = Proff.scenes[si].el && Proff.scenes[si].el.title;
  if (!t || !t.textContent.trim()) return null;
  const cs = getComputedStyle(t), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
  if (!(lh > 0)) return null;
  return { lines: Math.round(t.getBoundingClientRect().height / lh), text: t.textContent };
}"""


def headline_warn(page, st, width):
    r = page.evaluate(HEADLINE, st["scene"])
    if not r or r["lines"] <= 1:
        return None
    text = r["text"].replace("\n", " ").strip()
    if len(text) > 80:
        text = text[:77] + "…"
    return f"scene {st['scene'] + 1} step {st['step'] + 1}: headline wraps to {r['lines']} lines at {width} px: \"{text}\""


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

# Stage units, not screen pixels. One label = one measured box: the wrapped lines of a title and same-line runs
# (a number drawn next to its words) are merged first. A text sitting inside its own mark (a tile, a bar, a panel)
# is measured only against marks drawn on top of that mark; tiles beside it or behind it are not collisions.
SPACING = r"""(si) => {
  const s = Proff.scenes[si], fig = s && s.el && s.el.fig, svg = fig && fig.querySelector('svg');
  if (!svg || !svg.getScreenCTM()) return {min: null, viol: []};
  const inv = svg.getScreenCTM().inverse();
  const toUser = r => { const p = svg.createSVGPoint();
    p.x = r.left; p.y = r.top; const a = p.matrixTransform(inv);
    p.x = r.right; p.y = r.bottom; const b = p.matrixTransform(inv);
    return {x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y)}; };
  const vis = e => { let o = 1; for (let n = e; n && n !== fig; n = n.parentElement) o *= +(getComputedStyle(n).opacity || 1); return o > .3; };
  const bdist = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
  const inside = (a, b) => a.x0 >= b.x0 - .5 && a.x1 <= b.x1 + .5 && a.y0 >= b.y0 - .5 && a.y1 <= b.y1 + .5;
  const overlap = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > .5 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > .5;
  const union = (a, b) => ({x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1)});
  const raw = [];
  for (const e of svg.querySelectorAll('text')) {
    if (e.closest('foreignObject') || e.closest('svg.ext') || !vis(e) || !e.textContent.trim()) continue;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const box = toUser(r);
    raw.push({box, desc: e.textContent.trim().slice(0, 18), size: +e.getAttribute('font-size') || (box.y1 - box.y0),
      x: +e.getAttribute('x'), anchor: e.getAttribute('text-anchor') || 'start', cy: (box.y0 + box.y1) / 2 });
  }
  // merge the pieces of one label: stacked lines (same x, anchor, size, one line-height apart) and same-line runs (gap < 0.3 em)
  const par = raw.map((_, i) => i), find = i => par[i] === i ? i : (par[i] = find(par[i]));
  for (let i = 0; i < raw.length; i++) for (let j = i + 1; j < raw.length; j++) {
    const a = raw[i], b = raw[j]; if (Math.abs(a.size - b.size) > .5) continue;
    const lines = a.anchor === b.anchor && Math.abs(a.x - b.x) < .5 && Math.abs(Math.abs(a.cy - b.cy) - 1.22 * a.size) < .3 * a.size;
    const run = Math.abs(a.cy - b.cy) < .15 * a.size && Math.max(a.box.x0 - b.box.x1, b.box.x0 - a.box.x1) < .3 * a.size;
    if (lines || run) par[find(j)] = find(i);
  }
  const groups = {};
  raw.forEach((t, i) => { const k = find(i); groups[k] = groups[k] ? {box: union(groups[k].box, t.box), desc: groups[k].desc + ' ' + t.desc} : {box: t.box, desc: t.desc}; });
  const texts = Object.values(groups).map(t => ({...t, desc: t.desc.slice(0, 24)}));
  for (const e of svg.querySelectorAll('foreignObject')) {
    if (e.closest('svg.ext')) continue;
    const k = e.querySelector('.katex-html') || e.querySelector('.katex'); if (!k || !vis(e)) continue;
    const r = k.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    texts.push({box: toUser(r), desc: 'tex:' + (k.textContent || '').trim().slice(0, 14)});
  }
  const fills = []; let order = 0;
  for (const e of svg.querySelectorAll('rect, circle, ellipse, polygon, path')) {
    order++;
    if (e.closest('foreignObject') || e.closest('svg.ext') || e.dataset.deco) continue;   // header underline: part of its text
    const cs = getComputedStyle(e); if (!cs.fill || cs.fill === 'none' || cs.fill === 'transparent') continue;
    let alpha = +cs.fillOpacity; if (!isFinite(alpha)) alpha = 1;
    for (let n = e; n && n !== fig; n = n.parentElement) alpha *= +(getComputedStyle(n).opacity || 1);
    if (alpha < .05) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const box = toUser(r), f = {box, order, area: (box.x1 - box.x0) * (box.y1 - box.y0)};
    if (e.tagName === 'circle') f.circle = {cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2, r: (box.x1 - box.x0) / 2};
    fills.push(f);
  }
  const markDist = (t, f) => f.circle ? Math.max(0, Math.hypot(Math.max(0, t.x0 - f.circle.cx, f.circle.cx - t.x1), Math.max(0, t.y0 - f.circle.cy, f.circle.cy - t.y1)) - f.circle.r) : bdist(t, f.box);
  const ownOf = tb => fills.filter(f => inside(tb, f.box)).sort((a, b) => a.area - b.area)[0];
  texts.forEach(t => { t.own = ownOf(t.box); });
  let min = 1e9; const viol = [];
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const oi = texts[i].own, oj = texts[j].own;
      if (oi && oj && oi !== oj && !overlap(oi.box, oj.box)) continue;   // each sits in its own tile; the tiles keep them apart
      const d = bdist(texts[i].box, texts[j].box); if (d < min) min = d;
      if (d < 12) viol.push(texts[i].desc + ' ↔ ' + texts[j].desc + ' = ' + d.toFixed(1));
    }
    const tb = texts[i].box, own = texts[i].own;
    for (const f of fills) {
      if (inside(tb, f.box)) continue;
      if (own && !(f.order > own.order && overlap(f.box, own.box))) continue;   // beside or behind its own tile
      const d = markDist(tb, f); if (d < min) min = d;
      if (d < 12) viol.push(texts[i].desc + ' ↔ mark = ' + d.toFixed(1));
    }
  }
  return {min: min === 1e9 ? null : +min.toFixed(1), viol: viol.slice(0, 6), n: viol.length};
}"""


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
    warns, shots, gaps = [], {}, []
    fig_at = {}   # (scene, step) -> settled stage hash, default controls only
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(src.parent))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    from urllib.parse import quote
    url = f"http://127.0.0.1:{server.server_port}/{quote(src.name)}"
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
            pg.goto(url)
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
                    pg.evaluate("st => { Proff.side(null); Proff.show(st); }", st)   # headline: one line at 1280 with the sidebar closed
                    pg.wait_for_timeout(60)
                    hw = headline_warn(pg, st, w)
                    if hw:
                        warns.append(hw)
                    pg.evaluate("st => Proff.side(st.scene)", st)
                    pg.wait_for_timeout(60)
                    warns += [f"[laptop, sidebar open] {m}" for m in pg.evaluate(f"Proff.audit({st['scene']})") if "<12px" in m]
                pg.evaluate("Proff.side(null)")
            side_tiles = []
            for st in (states(pg) if name == "desktop" else []):
                pg.evaluate("st => Proff.show(st)", st)
                pg.wait_for_timeout(40)
                tag = f"s{st['scene'] + 1}.{st['step'] + 1}" + (f" {st['tag']}" if st.get("tag") else "")
                if name == "desktop" and theme == "dark" and not st.get("tag"):
                    hw = headline_warn(pg, st, w)
                    if hw:
                        warns.append(hw)
                    fig_at[(st["scene"], st["step"])] = pg.evaluate(FIG, st["scene"])
                if name == "desktop" and theme == "dark":
                    heroes = pg.evaluate("si => Proff.scenes[si].last?.texts.filter(t => t.hero) || []", st["scene"])
                    if len(heroes) > 1:
                        warns.append(f"{tag}: {len(heroes)} hero texts (max 1 per step)")
                    for hero in heroes:
                        if hero['px'] > 72.01:
                            warns.append(f"{tag}: hero text exceeds 72 drawn units")
                    aud = pg.evaluate(f"Proff.audit({st['scene']})")
                    warns += aud
                    sp = pg.evaluate(SPACING, st["scene"])
                    if sp and sp.get("min") is not None:
                        gaps.append(sp["min"])
                    for v in (sp or {}).get("viol") or []:
                        warns.append(f"{tag}: spacing <12 stage units: {v}")
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
            if name == "desktop":
                by_scene = {}
                for (sc, step), digest in fig_at.items():
                    by_scene.setdefault(sc, {})[step] = digest
                for sc, steps in by_scene.items():
                    ordered = sorted(steps)
                    for prev_step, next_step in zip(ordered, ordered[1:]):
                        if next_step != prev_step + 1 or steps[prev_step] != steps[next_step]:
                            continue
                        title = pg.evaluate("([si, k]) => { const s = Proff.scenes[si], st = s.steps[k] || {}; return (st && typeof st === 'object' && st.title) || s.title || ''; }", [sc, next_step])
                        warns.append(f'scene {sc + 1} "{title}" step {next_step + 1}: draws the same figure as step {prev_step + 1} (a click that changes nothing)')
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
    server.shutdown()
    sheets = []
    for key, tiles in shots.items():
        if tiles:
            sheets += sheet(tiles, out, key)
    warns = list(dict.fromkeys(warns))
    (out / "warnings.json").write_text(json.dumps(warns, indent=2))
    for w_ in warns[:40]:
        print("WARN", w_)
    if len(warns) > 40:
        print(f"... {len(warns) - 40} more")
    if gaps:
        print(f"spacing-min: {min(gaps)}")
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
