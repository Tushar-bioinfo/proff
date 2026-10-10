/* Proff stage runtime: page shell, scenes, steps, controls, drawing kit, self-audit.
   Authors call Proff.page / Proff.scene / Proff.prose in story.js; build.py inlines this file. Do not edit per topic. */
(function () {
  'use strict';
  const P = window.Proff = { scenes: [], blocks: [], opts: {}, errors: [], plugins: {} };
  const TOK = ['ink', 'muted', 'dim', 'line', 'grid', 'fig', 'surf', 'surf2', 'bg', 'on', 'line-dim'];
  const col = c => c == null ? null : /^[cf][1-6]$/.test(c) || TOK.includes(c) ? `var(--${c})` : c;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const md = s => esc(s || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code>$1</code>');
  const para = s => String(s || '').split(/\n\s*\n/).map(b => /^\s*- /.test(b)
    ? '<ul>' + b.split('\n').filter(l => l.trim()).map(l => '<li>' + md(l.replace(/^\s*- /, '')) + '</li>').join('') + '</ul>'
    : '<p>' + md(b) + '</p>').join('');
  P.md = para;

  // ---------- maths helpers ----------
  P.lerp = (a, b, t) => a + (b - a) * t;
  P.ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  P.seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));   // progress of t inside [a,b]
  P.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  P.range = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  P.fmt = (v, d) => v == null || isNaN(v) ? '–' : Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(d ?? 1).replace('e+', 'e')
    : (+v.toFixed(d ?? (Number.isInteger(v) ? 0 : 2))).toLocaleString('en-US', { maximumFractionDigits: d ?? 2 });
  P.rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const lgamma = x => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, .1208650973866179e-2, -.5395239384953e-5];
    let y = x, t = x + 5.5; t -= (x + .5) * Math.log(t); let s = 1.000000000190015; for (const k of c) s += k / ++y; return -t + Math.log(2.5066282746310005 * s / x); };
  const erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x);
    return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x)); };
  P.stat = {
    lgamma, erf,
    normPdf: (x, m = 0, s = 1) => Math.exp(-.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI)),
    normCdf: (x, m = 0, s = 1) => .5 * (1 + erf((x - m) / (s * Math.SQRT2))),
    tPdf: (x, v) => Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2)) / Math.sqrt(v * Math.PI) * (1 + x * x / v) ** (-(v + 1) / 2),
    binomPmf: (k, n, p) => Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p)),
    poisPmf: (k, l) => Math.exp(k * Math.log(l) - l - lgamma(k + 1)),
    nbPmf: (k, mu, phi) => { const r = 1 / phi; return Math.exp(lgamma(k + r) - lgamma(r) - lgamma(k + 1) + r * Math.log(r / (r + mu)) + k * Math.log(mu / (r + mu))); },
    gammaPdf: (x, a, b) => x <= 0 ? 0 : Math.exp(a * Math.log(b) - lgamma(a) + (a - 1) * Math.log(x) - b * x),
    betaPdf: (x, a, b) => x <= 0 || x >= 1 ? 0 : Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)),
    normal: r => () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()),
    mean: a => a.reduce((s, x) => s + x, 0) / a.length,
    sd: a => { const m = P.stat.mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); },
  };

  // ---------- text measuring (shared by both backends and the audit) ----------
  const mctx = document.createElement('canvas').getContext('2d');
  const font = o => `${o.italic ? 'italic ' : ''}${o.weight || 500} ${o.size}px ${o.mono ? "'Space Grotesk',monospace" : "Inter,system-ui,sans-serif"}`;
  const runs = s => { const out = []; const re = /([_^])\{([^}]*)\}/g; let i = 0, m;   // x_{ij}, x^{2}
    while ((m = re.exec(s))) { if (m.index > i) out.push([s.slice(i, m.index), 0]); out.push([m[2], m[1] === '_' ? 1 : -1]); i = re.lastIndex; }
    if (i < s.length) out.push([s.slice(i), 0]); return out; };
  const measure = (s, o) => { mctx.font = font(o); let w = 0; for (const [t, sh] of runs(s)) { mctx.font = font({ ...o, size: sh ? o.size * .7 : o.size }); w += mctx.measureText(t).width; } return w; };

  // ---------- drawing kit: identical API on SVG and Canvas ----------
  function Kit(W, H, backend, rng) {
    const g = { W, H, rng, texts: [], boxes: [], segs: [], plots: [], words: 0 };
    let out = [], ctx = backend.ctx, alpha = [1], xf = [[0, 0, 1]];
    const vars = backend.vars || (k => k);
    const X = (x, y) => { const [tx, ty, s] = xf[xf.length - 1]; return [tx + x * s, ty + y * s]; };   // to stage units, for the audit
    const S = () => xf[xf.length - 1][2];
    const A = () => alpha[alpha.length - 1];
    const C = c => ctx ? vars(c) : col(c);
    const reg = (kind, a) => (A() > .05) && g[kind].push(a);
    const box = (x, y, w, h, solid) => { const [a, b] = X(x, y), s = S(); reg('boxes', { x0: a, y0: b, x1: a + w * s, y1: b + h * s, solid }); };
    const seg = (x1, y1, x2, y2) => { const [a, b] = X(x1, y1), [c, d] = X(x2, y2); reg('segs', [a, b, c, d]); };
    const style = o => { const f = o.fill === undefined ? 'none' : col(o.fill), st = o.stroke === undefined ? (o.fill === undefined ? 'var(--ink)' : 'none') : col(o.stroke);
      return `fill="${f}" stroke="${st}" stroke-width="${o.sw ?? 2}"${o.dash ? ` stroke-dasharray="${o.dash === true ? '7 6' : o.dash}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''} stroke-linecap="round" stroke-linejoin="round"${o.cls ? ` class="${o.cls}"` : ''}`; };
    const cv = (o, path) => {  // canvas paint
      ctx.save(); ctx.globalAlpha = A() * (o.op ?? 1);
      if (o.fill !== undefined && o.fill !== 'none') { ctx.fillStyle = C(o.fill); ctx.fill(path); }
      const st = o.stroke === undefined ? (o.fill === undefined ? 'ink' : null) : o.stroke;
      if (st && st !== 'none') { ctx.strokeStyle = C(st); ctx.lineWidth = o.sw ?? 2; ctx.lineCap = ctx.lineJoin = 'round'; ctx.setLineDash(o.dash ? (o.dash === true ? [7, 6] : String(o.dash).split(/\s+/).map(Number)) : []); ctx.stroke(path); }
      ctx.restore(); };
    g.path = (d, o = {}) => { if (ctx) cv(o, new Path2D(d)); else out.push(`<path d="${d}" ${style(o)}/>`); if (o.reg) o.reg.forEach(p => seg(...p)); return g; };
    g.rect = (x, y, w, h, o = {}) => { const r = o.r || 0;
      if (ctx) { const p = new Path2D(); r ? p.roundRect(x, y, w, h, r) : p.rect(x, y, w, h); cv(o, p); }
      else out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}"${r ? ` rx="${r}"` : ''} ${style(o)}/>`);
      if (!o.free) box(x, y, w, h, o.fill !== undefined && o.fill !== 'none'); return g; };
    g.circle = (cx, cy, r, o = {}) => { if (ctx) { const p = new Path2D(); p.arc(cx, cy, r, 0, 7); cv(o, p); } else out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" ${style(o)}/>`);
      if (!o.free && r > 6) box(cx - r * .7, cy - r * .7, r * 1.4, r * 1.4, o.fill !== undefined && o.fill !== 'none'); return g; };
    g.ellipse = (cx, cy, rx, ry, o = {}) => { if (ctx) { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, 0, 0, 7); cv(o, p); } else out.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${style(o)}/>`); return g; };
    g.line = (x1, y1, x2, y2, o = {}) => { o = { stroke: 'ink', ...o }; g.path(`M${x1} ${y1}L${x2} ${y2}`, o); if (!o.free) seg(x1, y1, x2, y2); return g; };
    g.poly = (pts, o = {}) => { if (!pts.length) return g; g.path('M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + (o.close ? 'Z' : ''), o);
      if (o.reg !== false && !o.free) { const k = Math.max(1, Math.floor(pts.length / 40)); for (let i = k; i < pts.length; i += k) seg(pts[i - k][0], pts[i - k][1], pts[i][0], pts[i][1]); } return g; };
    g.arrow = (x1, y1, x2, y2, o = {}) => {  // o.bend curves it; o.pad trims both ends; o.head size
      const pad = o.pad ?? 0, L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      x1 += ux * pad; y1 += uy * pad; x2 -= ux * pad; y2 -= uy * pad;
      const hs = o.head ?? 12, b = o.bend || 0, mx = (x1 + x2) / 2 - uy * b, my = (y1 + y2) / 2 + ux * b;
      const ang = b ? Math.atan2(y2 - my, x2 - mx) : Math.atan2(uy, ux), c = o.stroke || 'ink';
      const ex = x2 - Math.cos(ang) * hs * .8, ey = y2 - Math.sin(ang) * hs * .8;
      g.path(b ? `M${x1} ${y1}Q${mx} ${my} ${ex} ${ey}` : `M${x1} ${y1}L${ex} ${ey}`, { ...o, stroke: c, fill: undefined });
      g.path(`M${x2} ${y2}L${x2 - hs * Math.cos(ang - .45)} ${y2 - hs * Math.sin(ang - .45)}L${x2 - hs * Math.cos(ang + .45)} ${y2 - hs * Math.sin(ang + .45)}Z`, { fill: c, stroke: c, sw: 1, op: o.op });
      if (!o.free) { if (b) { seg(x1, y1, mx, my); seg(mx, my, x2, y2); } else seg(x1, y1, x2, y2); } return g; };
    g.text = (x, y, s, o = {}) => {
      s = String(s); o = { size: 22, ...o }; const lines = s.split('\n'), lh = o.size * 1.22, anchor = o.anchor || 'start';
      const fill = o.fill || 'ink', wmax = Math.max(...lines.map(l => measure(l, o)));
      const y0 = y - (lines.length - 1) * lh / 2;
      lines.forEach((l, i) => {
        const yy = y0 + i * lh;
        if (ctx) { let xx = x - (anchor === 'middle' ? measure(l, o) / 2 : anchor === 'end' ? measure(l, o) : 0);
          ctx.save(); ctx.globalAlpha = A() * (o.op ?? 1); ctx.fillStyle = C(fill); ctx.textBaseline = 'middle';
          if (o.halo) { ctx.strokeStyle = C('fig'); ctx.lineWidth = 6; ctx.lineJoin = 'round'; }
          for (const [t, sh] of runs(l)) { ctx.font = font({ ...o, size: sh ? o.size * .7 : o.size }); const dy = sh * o.size * .3;
            if (o.halo) ctx.strokeText(t, xx, yy + dy); ctx.fillText(t, xx, yy + dy); xx += ctx.measureText(t).width; }
          ctx.restore(); }
        else { const sp = runs(l).map(([t, sh]) => sh ? `<tspan font-size="${o.size * .7}" dy="${sh * o.size * .3}">${esc(t)}</tspan><tspan dy="${-sh * o.size * .3}">​</tspan>` : esc(t)).join('');
          out.push(`<text x="${x}" y="${yy}" font-size="${o.size}" font-weight="${o.weight || 500}" text-anchor="${anchor}" dominant-baseline="central" fill="${col(fill)}"${o.mono ? ' class="mono"' : ''}${o.italic ? ' font-style="italic"' : ''}${o.op != null ? ` opacity="${o.op}"` : ''}${o.halo ? ` stroke="var(--fig)" stroke-width="6" paint-order="stroke" stroke-linejoin="round"` : ''}>${sp}</text>`); }
      });
      const bx = x - (anchor === 'middle' ? wmax / 2 : anchor === 'end' ? wmax : 0), by = y0 - o.size * .55, bh = (lines.length - 1) * lh + o.size * 1.1;
      const [a, b] = X(bx, by), sc = S();
      if (!o.free) reg('texts', { x0: a, y0: b, x1: a + wmax * sc, y1: b + bh * sc, s, px: o.size * sc, size: o.size, tick: o.tick });
      if (A() > .05 && !o.free && !o.tick) g.words += s.split(/\s+/).filter(w => /[A-Za-z]{2,}/.test(w)).length;
      return { w: wmax, h: bh, x0: bx, y0: by, x1: bx + wmax, y1: by + bh }; };
    g.label = (x, y, s, o = {}) => {  // text with a leader line to the point it names: o.to=[x,y]
      const r = g.text(x, y, s, o);
      if (o.to) { const [tx, ty] = o.to, cx = P.clamp(tx, r.x0, r.x1), cy = P.clamp(ty, r.y0, r.y1);
        const sx = Math.abs(tx - (r.x0 + r.x1) / 2) > Math.abs(ty - (r.y0 + r.y1) / 2) ? (tx > r.x1 ? r.x1 + 6 : r.x0 - 6) : cx;
        const sy = sx === cx ? (ty > r.y1 ? r.y1 + 4 : r.y0 - 4) : cy;
        g.line(sx, sy, tx, ty, { stroke: o.lc || 'muted', sw: 1.5, free: true }); g.circle(tx, ty, 3, { fill: o.lc || 'muted', stroke: 'none', free: true }); }
      return r; };
    g.tex = (x, y, tex, o = {}) => {  // LaTeX via KaTeX (SVG backend only); box centred at x,y unless o.anchor
      const size = o.size || 26, w = o.w || Math.max(80, tex.length * size * .42), h = o.h || size * 2.2;
      const x0 = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
      if (ctx || !window.katex) { g.text(x, y, tex.replace(/\\[a-z]+/g, m => ({ '\\sum': 'Σ', '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\sigma': 'σ', '\\mu': 'μ', '\\log': 'log' }[m] || '')).replace(/[{}]/g, ''), { ...o, size, mono: true }); return g; }
      let html; try { html = katex.renderToString(tex, { throwOnError: false }); } catch (e) { html = esc(tex); }
      out.push(`<foreignObject x="${x0}" y="${y - h / 2}" width="${w}" height="${h}"${o.op != null ? ` opacity="${o.op}"` : ''}><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${size}px;height:100%;display:flex;align-items:center;justify-content:${o.anchor === 'start' ? 'flex-start' : o.anchor === 'end' ? 'flex-end' : 'center'};color:${col(o.fill || 'ink')}">${html}</div></foreignObject>`);
      const [a, b] = X(x0, y - size * .7); reg('texts', { x0: a, y0: b, x1: a + w * S() * .9, y1: b + size * 1.4 * S(), s: tex, px: size * S(), size, tex: 1 }); return g; };
    g.img = (href, x, y, w, h, o = {}) => { if (ctx) { const im = P.images[href]; if (im && im.complete) { ctx.save(); ctx.globalAlpha = A() * (o.op ?? 1); ctx.drawImage(im, x, y, w, h); ctx.restore(); } }
      else out.push(`<image href="${P.assets[href] || href}" x="${x}" y="${y}" width="${w}" height="${h}"${o.op != null ? ` opacity="${o.op}"` : ''} preserveAspectRatio="xMidYMid meet"/>`); return g; };
    g.raw = s => { if (!ctx) out.push(s); return g; };
    g.svgfile = (name, x, y, w, h, o = {}) => {  // a figure from svg/<name>.svg (plot.py output), fitted into the box
      const src = (window.PROFF_SVG || {})[name]; if (!src) throw new Error(`svg/${name}.svg not found`);
      out.push(src.replace(/<svg\b[^>]*?(viewBox="[^"]*")[^>]*>/, (m, vb) => `<svg class="ext" x="${x}" y="${y}" width="${w}" height="${h}" ${vb} preserveAspectRatio="xMidYMid meet"${o.op != null ? ` opacity="${o.op}"` : ''}>`));
      const side = (window.PROFF_DATA || {})[name + '_axes'], res = []; if (!side) return res;   // data-unit mappers per axes (plot.py sidecar)
      const fw = Math.min(w, h * side.aspect), fh = fw / side.aspect, ox = x + (w - fw) / 2, oy = y + (h - fh) / 2;
      side.axes.forEach(a => { const L = v => Math.log10(v), [x0, x1] = a.xlog ? a.xlim.map(L) : a.xlim, [y0, y1] = a.ylog ? a.ylim.map(L) : a.ylim;
        const X0 = ox + a.x * fw, Y0 = oy + a.y * fh, AW = a.w * fw, AH = a.h * fh;
        reg('plots', { w: AW * S(), h: AH * S(), name: a.yl || a.xl || name });   // matplotlib axes obey the same size rules
        res.push({ x: X0, y: Y0, w: AW, h: AH, sx: v => X0 + ((a.xlog ? L(v) : v) - x0) / (x1 - x0) * AW, sy: v => Y0 + AH - ((a.ylog ? L(v) : v) - y0) / (y1 - y0) * AH }); });
      box(ox, oy, fw, fh, false); return res; };
    g.group = (o, fn) => {  // o: {x, y, s (scale), op}
      const [tx, ty, s0] = xf[xf.length - 1], s = o.s ?? 1, x = o.x || 0, y = o.y || 0;
      xf.push([tx + x * s0, ty + y * s0, s0 * s]); alpha.push(A() * (o.op ?? 1));
      if (ctx) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(g); ctx.restore(); }
      else { out.push(`<g transform="translate(${x} ${y}) scale(${s})"${o.op != null ? ` opacity="${o.op}"` : ''}>`); fn(g); out.push('</g>'); }
      xf.pop(); alpha.pop(); return g; };
    g.fade = (op, fn) => g.group({ op }, fn);

    // ---- charts ----
    g.axes = (o) => {  // {x,y,w,h, xd:[a,b], yd:[a,b], xl, yl, xt:n|[..], yt, grid, fmtx, fmty, log}
      const { x, y, w, h } = o, [xa, xb] = o.xd, [ya, yb] = o.yd;
      reg('plots', { w: w * S(), h: h * S(), name: o.yl || o.xl || '' });   // the audit refuses squeezed plots
      const sx = v => x + (v - xa) / (xb - xa) * w, sy = v => y + h - (v - ya) / (yb - ya) * h;
      const ticks = (t, a, b) => Array.isArray(t) ? t : nice(a, b, t ?? 5);
      const xt = ticks(o.xt, xa, xb), yt = ticks(o.yt, ya, yb), fs = o.size || 18;
      if (o.grid !== false) { yt.forEach(v => g.line(x, sy(v), x + w, sy(v), { stroke: 'grid', sw: 1, free: true })); }
      g.line(x, y + h, x + w, y + h, { stroke: 'muted', sw: 2, free: true }); g.line(x, y, x, y + h, { stroke: 'muted', sw: 2, free: true });
      xt.forEach(v => { g.line(sx(v), y + h, sx(v), y + h + 6, { stroke: 'muted', sw: 2, free: true }); g.text(sx(v), y + h + 8 + fs * .7, (o.fmtx || P.fmt)(v), { size: fs, anchor: 'middle', fill: 'muted', tick: 1 }); });
      yt.forEach(v => g.text(x - 10, sy(v), (o.fmty || P.fmt)(v), { size: fs, anchor: 'end', fill: 'muted', tick: 1 }));
      if (o.xl) g.text(x + w, y + h + fs * 2.6, o.xl, { size: fs + 1, anchor: 'end', fill: 'muted', weight: 600 });
      if (o.yl) g.text(x, y - fs * 1.2, o.yl, { size: fs + 1, anchor: 'start', fill: 'muted', weight: 600 });
      return { sx, sy, x, y, w, h }; };
    g.curve = (f, ax, a, b, o = {}) => { const n = o.n || 200, pts = P.range(a, b, n).map(v => [ax.sx(v), ax.sy(f(v))]).filter(p => isFinite(p[1]));
      return g.poly(pts.map(p => [p[0], P.clamp(p[1], ax.y - 4, ax.y + ax.h)]), { stroke: 'c1', sw: 3, ...o }); };
    g.area = (f, ax, a, b, o = {}) => { const pts = P.range(a, b, o.n || 120).map(v => [ax.sx(v), P.clamp(ax.sy(f(v)), ax.y, ax.y + ax.h)]);
      return g.poly([[ax.sx(a), ax.y + ax.h], ...pts, [ax.sx(b), ax.y + ax.h]], { fill: 'f1', stroke: 'none', close: true, reg: false, ...o }); };
    g.bars = (vals, ax, o = {}) => { const bw = o.bw || 0.8; vals.forEach(([x, v], i) => { const x0 = ax.sx(x - bw / 2), x1 = ax.sx(x + bw / 2), y0 = ax.sy(Math.max(0, ax.yd0 || 0));
      g.rect(x0, Math.min(ax.sy(v), y0), x1 - x0, Math.abs(y0 - ax.sy(v)), { fill: typeof o.fill === 'function' ? o.fill(x, v, i) : (o.fill || 'f1'), stroke: o.stroke || 'c1', sw: o.sw ?? 1.5, free: true }); }); return g; };
    g.dots = (pts, ax, o = {}) => { pts.forEach((p, i) => g.circle(ax ? ax.sx(p[0]) : p[0], ax ? ax.sy(p[1]) : p[1], o.r || 6, { fill: typeof o.fill === 'function' ? o.fill(p, i) : (o.fill || 'c1'), stroke: o.stroke || 'none', op: o.op, free: true })); return g; };
    g.brace = (x1, y1, x2, y2, s, o = {}) => {  // curly brace from (x1,y1) to (x2,y2), label on the outside (left side of travel)
      const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = uy, ny = -ux, d = o.depth || 14;
      const p = (t, k) => [x1 + ux * L * t + nx * d * k, y1 + uy * L * t + ny * d * k];
      const [a, b, c, e, f] = [p(0, 0), p(.25, 1), p(.5, 2), p(.75, 1), p(1, 0)];
      g.path(`M${a}Q${p(0, 1)} ${b}L${p(.45, 1)}Q${p(.5, 1)} ${c}Q${p(.5, 1)} ${p(.55, 1)}L${e}Q${p(1, 1)} ${f}`.replace(/,/g, ' '), { stroke: o.stroke || 'muted', sw: 2, reg: [[...p(0, 1), ...p(1, 1)], [...p(.5, 1), ...p(.5, 2)]] });
      if (s) { const [lx, ly] = p(.5, 2 + (o.gap || 1.2)); g.text(lx, ly, s, { size: o.size || 18, anchor: Math.abs(nx) > .5 ? (nx > 0 ? 'start' : 'end') : 'middle', fill: o.fill || 'muted', weight: 600 }); } return g; };
    g.matrix = (x, y, data, o = {}) => {  // table of numbers; o: cw, ch, rows, cols, fmt, cell(i,j,v)->{fill,stroke,op,text}, title
      const cw = o.cw || 74, ch = o.ch || 46, R = data.length, Cn = data[0].length, fs = o.size || Math.min(22, ch * .46);
      const pos = (i, j) => ({ x: x + j * cw, y: y + i * ch, w: cw, h: ch, cx: x + j * cw + cw / 2, cy: y + i * ch + ch / 2 });
      if (o.title) g.text(x + cw * Cn / 2, y - (o.cols ? fs * 2.6 : fs * 1.3), o.title, { size: fs, anchor: 'middle', weight: 750 });
      if (o.cols) o.cols.forEach((c, j) => g.text(pos(0, j).cx, y - fs * .9, c, { size: Math.max(16, fs * .85), anchor: 'middle', fill: o.colFill ? o.colFill(j) : 'muted', mono: true }));
      if (o.rows) o.rows.forEach((r, i) => g.text(x - 10, pos(i, 0).cy, r, { size: Math.max(16, fs * .85), anchor: 'end', fill: o.rowFill ? o.rowFill(i) : 'muted', mono: true }));
      for (let i = 0; i < R; i++) for (let j = 0; j < Cn; j++) {
        const p = pos(i, j), st = (o.cell && o.cell(i, j, data[i][j])) || {};
        g.rect(p.x, p.y, cw, ch, { fill: st.fill || 'surf', stroke: st.stroke || 'line-dim', sw: st.sw || 1.5, op: st.op, free: true });
        const v = st.text ?? (data[i][j] == null ? '' : (o.fmt || P.fmt)(data[i][j]));
        if (v !== '') g.text(p.cx, p.cy, v, { size: fs, anchor: 'middle', mono: true, weight: st.weight || 600, fill: st.color || 'ink', op: st.top, tick: 1 });
      }
      if (o.frame !== false) g.rect(x, y, cw * Cn, ch * R, { stroke: 'line', sw: 2.5, free: true });
      box(x, y, cw * Cn, ch * R, false);
      return { pos, w: cw * Cn, h: ch * R, x, y }; };
    if (P.plugins) for (const k in P.plugins) g[k] = (...a) => P.plugins[k](g, ...a);
    g._svg = () => out.join('');
    return g;
  }
  const nice = (a, b, n) => { const span = b - a, step0 = span / Math.max(1, n), mag = 10 ** Math.floor(Math.log10(step0)), err = step0 / mag;
    const st = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag, out = []; for (let v = Math.ceil(a / st) * st; v <= b + st * 1e-9; v += st) out.push(+v.toFixed(10)); return out; };
  P.nice = nice; P.measure = (s, o = {}) => measure(String(s), { size: 22, ...o }); P.images = {}; P.assets = window.PROFF_ASSETS || {};

  // ---------- page API ----------
  P.page = o => Object.assign(P.opts, o);
  P.scene = s => { s.steps = (s.steps || ['']).map(x => typeof x === 'string' ? { cap: x } : x); s.params = {}; (s.controls || []).forEach(c => s.params[c.name] = c.value ?? c.min); s.defaults = { ...s.params };
    s.W = s.w || 1200; s.H = s.h || 675; s.seed = s.seed || 7; s.i = P.scenes.length; P.scenes.push(s); P.blocks.push({ scene: s }); return s; };
  P.prose = (text, o = {}) => P.blocks.push({ prose: text, ...o });
  P.html = (html) => P.blocks.push({ html });
  // study blocks (layout 'article'): section heading, tiles, flip questions, comparison table. Text is markdown-lite (**b**, *i*, `code`).
  P.section = (name) => P.html(`<h2 class="sec">${esc(name)}</h2>`);
  P.tiles = (items, o = {}) => P.html(`<div class="grid">${items.map((t, i) => `<div class="tile acc${t.acc || o.acc || (i % 6) + 1}">${t.tag ? `<span class="tag">${esc(t.tag)}</span>` : ''}${t.big ? `<div class="big">${esc(t.big)}</div>` : ''}${t.h ? `<h3>${md(t.h)}</h3>` : ''}${t.text ? para(t.text) : ''}</div>`).join('')}</div>`);
  P.quiz = (items) => P.html(`<div class="grid">${items.map((q, i) => `<div class="tile flip acc${q.acc || (i % 6) + 1}" tabindex="0" role="button" aria-expanded="false" onclick="this.classList.toggle('on');this.setAttribute('aria-expanded',this.classList.contains('on'))" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><span class="tag">${esc(q.tag || 'question ' + (i + 1))}</span><h3>${md(q.q)}</h3><div class="hint">tap to reveal</div><div class="a">${para(q.a)}</div></div>`).join('')}</div>`);
  P.compare = (head, rows) => P.html(`<table class="cmp"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, j) => j ? `<td>${md(c)}</td>` : `<td><b>${md(c)}</b></td>`).join('')}</tr>`).join('')}</tbody></table>`);

  // ---------- rendering ----------
  let cssVars = {};
  const readVars = () => { const cs = getComputedStyle(document.body); cssVars = {};
    for (const k of [...TOK, 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6']) cssVars[k] = cs.getPropertyValue('--' + k).trim(); };
  const resolve = c => { if (c == null) return null; const m = /^var\(--([\w-]+)\)$/.exec(c); const k = m ? m[1] : c;
    return k in cssVars ? resolveMix(k) : c; };
  const mixCache = {}; const resolveMix = k => { const key = k + document.body.dataset.theme + (document.body.dataset.palette || ''); if (mixCache[key]) return mixCache[key];
    const d = document.createElement('div'); d.style.color = `var(--${k})`; document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); return mixCache[key] = v; };

  function draw(s, k, t) {
    s.k = k; s.t = t; const fig = s.el.fig;
    let g;
    try {
      if (s.kind === 'canvas') {
        const cv = fig.querySelector('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
        if (cv.width !== s.W * dpr) { cv.width = s.W * dpr; cv.height = s.H * dpr; }
        const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, s.W, s.H);
        g = Kit(s.W, s.H, { ctx, vars: resolve }, P.rng(s.seed)); g.panels = (kk = k, tt = t) => panelsAt(s, kk, tt); g.panel = (id, fn) => { const b = panelsAt(s, k, t)[id]; if (b && b.a > .01) g.fade(b.a, () => fn(b)); }; s.draw(g, k, t, s.params, s);
      } else {
        g = Kit(s.W, s.H, {}, P.rng(s.seed)); g.panels = (kk = k, tt = t) => panelsAt(s, kk, tt); g.panel = (id, fn) => { const b = panelsAt(s, k, t)[id]; if (b && b.a > .01) g.fade(b.a, () => fn(b)); }; s.draw(g, k, t, s.params, s);
        fig.querySelector('svg').innerHTML = g._svg();
      }
      s.last = g; s.err = null;
    } catch (e) { s.err = e.message; P.errors.push(`scene ${s.i + 1} step ${k + 1}: ${e.message}`); console.error(e);
      fig.querySelector(s.kind === 'canvas' ? 'canvas' : 'svg').insertAdjacentHTML?.('afterend', ''); }
    const st = s.steps[k] || {};
    if (s.el.cap) s.el.cap.innerHTML = st.cap ? md(st.cap) : '';
    if (s.el.title && (st.title || s.title)) s.el.title.textContent = st.title || s.title;
    if (s.el.phase) { s.el.phase.textContent = st.phase || s.phase || ''; s.el.phase.style.display = (st.phase || s.phase) ? '' : 'none'; }
    if (s.el.ib && (!sideS || sideS === s || s.el.card !== sideS.el.card)) s.el.ib.style.visibility = infoOf(s, k) || (s.steps[k] || {}).cap ? '' : 'hidden';
    if (sideS === s) renderSide(s);
    if (s.paint) s.paint(t);
  }
  // panels: boxes that share the stage; a panel appears at step `from`, and the others make room, animated by t
  // panels: [{ id, from, to, w, keep }]. One figure per step: when the next panel arrives, the one on screen
  // retires (slides left and fades) and the new one takes the whole stage. Boxes animate between steps.
  function panelsAt(s, k, t) {
    const spec = s.panels || [], gap = s.panelGap ?? 40, pad = { l: 90, r: 30, t: 70, b: 80, ...(s.panelPad || {}) }, max = 1;
    const boxes = kk => { let v = spec.filter(p => (p.from || 0) <= kk && (p.to == null || kk <= p.to));
      while (v.length > max) { const old = v.filter(p => !p.keep).sort((a, b) => (a.from || 0) - (b.from || 0))[0]; if (!old) break; v = v.filter(p => p !== old); }
      const tot = v.reduce((a, p) => a + (p.w || 1), 0) || 1, out = {};
      let x = 0; const avail = s.W - gap * Math.max(0, v.length - 1);
      v.forEach(p => { const w = avail * (p.w || 1) / tot, q = { ...pad, ...(p.pad || {}) }; out[p.id] = { x: x + q.l, y: q.t, w: w - q.l - q.r, h: s.H - q.t - q.b, ox: x, ow: w }; x += w + gap; }); return out; };
    const A = boxes(k), B = k > 0 ? boxes(k - 1) : A, L = (a, b) => a + (b - a) * t, out = {};
    for (const id in A) { const a = A[id], b = B[id]; out[id] = b ? { x: L(b.x, a.x), y: L(b.y, a.y), w: L(b.w, a.w), h: L(b.h, a.h), ox: L(b.ox, a.ox), ow: L(b.ow, a.ow), a: 1 } : { ...a, a: t }; }
    for (const id in B) if (!A[id] && t < 1) { const b = B[id], dx = -t * b.ow * .4; out[id] = { ...b, x: b.x + dx, ox: b.ox + dx, a: 1 - t }; }   // leaving
    return out;
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function play(s, k, instant) {
    cancelAnimationFrame(s.raf); const dur = s.anim ?? 700;
    if (instant || reduce || !dur || P.static) return draw(s, k, 1);
    const t0 = performance.now(); const tick = now => { const t = Math.min(1, (now - t0) / dur); draw(s, k, P.ease(t)); if (t < 1) s.raf = requestAnimationFrame(tick); };
    s.raf = requestAnimationFrame(tick);
  }

  function figure(s) {
    const svg = s.kind === 'canvas' ? `<canvas width="${s.W}" height="${s.H}" role="img" aria-label="${esc(s.alt || s.title || '')}"></canvas>`
      : `<svg viewBox="0 0 ${s.W} ${s.H}" role="img" aria-label="${esc(s.alt || s.title || '')}"></svg>`;
    return `<div class="fig${s.pan ? ' pan' : ''}">${svg}</div>`;
  }
  // controls: one quiet line under the figure. Drag a value sideways (or use the thin track, or arrow keys) to change it.
  const fmtC = (c, v) => (c.fmt ? c.fmt(+v) : P.fmt(+v)) + (c.unit || '');
  function controls(s) {
    if (!s.controls || !s.controls.length) return '';
    return `<div class="ctl">${s.controls.map(c => c.type === 'button' ? `<button class="kb" data-b="${c.name}"><span aria-hidden="true">↻</span>${esc(c.label)}</button>`
      : `<label class="kn"><span class="kl">${esc(c.label || c.name)}</span><span class="kv" title="drag sideways">${esc(fmtC(c, c.value ?? c.min))}</span><input type="range" name="${c.name}" min="${c.min}" max="${c.max}" step="${c.step ?? 1}" value="${c.value ?? c.min}" aria-label="${esc(c.label || c.name)}"></label>`).join('')}</div>`;
  }
  function syncControls(s) {   // show the live params on the controls (check.py sets params directly)
    document.querySelectorAll(`[data-s="${s.i}"] .ctl input`).forEach(inp => { if (!(inp.name in s.params)) return; const c = s.controls.find(c => c.name === inp.name);
      inp.value = s.params[inp.name]; inp.parentNode.querySelector('.kv').textContent = fmtC(c, inp.value); }); }
  function bindControls(s, root) {
    root.querySelectorAll('.ctl input').forEach(inp => {
      const c = s.controls.find(c => c.name === inp.name), kn = inp.parentNode, kv = kn.querySelector('.kv'), st = c.step ?? 1;
      const set = v => { v = +P.clamp(c.min + Math.round((v - c.min) / st) * st, c.min, c.max).toFixed(6); inp.value = v; kv.textContent = fmtC(c, v);
        if (v !== s.params[c.name]) { s.params[c.name] = v; draw(s, s.k || 0, 1); } };
      inp.addEventListener('input', () => set(+inp.value));
      kv.addEventListener('pointerdown', e => { e.preventDefault(); kv.setPointerCapture(e.pointerId); const x0 = e.clientX, v0 = +inp.value; kn.classList.add('drag');
        const mv = e => set(v0 + (e.clientX - x0) / 240 * (c.max - c.min)), up = () => { kv.onpointermove = kv.onpointerup = kv.onpointercancel = null; kn.classList.remove('drag'); };
        kv.onpointermove = mv; kv.onpointerup = kv.onpointercancel = up; });
    });
    root.querySelectorAll('.ctl [data-b]').forEach(b => b.addEventListener('click', () => { const c = s.controls.find(c => c.name === b.dataset.b);
      if (c.name === 'reseed') s.seed++; if (c.on) c.on(s.params, s); draw(s, s.k || 0, 1); }));
  }

  // step strip: thin segments that form the figure's bottom edge; ghost chevrons on the figure's sides
  const ghosts = `<button class="gh prev" aria-label="previous step">‹</button><button class="gh next" aria-label="next step">›</button>`;
  const strip = groups => groups.reduce((a, b) => a + b, 0) > 1 ? `<div class="strip" role="tablist" aria-label="steps">${groups.map(n => `<div class="sg" style="flex:${n}">${'<button class="seg" role="tab"><i></i></button>'.repeat(n)}</div>`).join('')}<span class="tip" aria-hidden="true"></span></div>` : '';
  function bindStrip(card, n, go, cur, label) {
    const segs = [...card.querySelectorAll('.seg')], tip = card.querySelector('.tip');
    segs.forEach((b, i) => { b.setAttribute('aria-label', label(i)); b.onclick = () => go(i);
      b.onmouseenter = b.onfocus = () => { tip.textContent = label(i); const R = tip.parentNode.getBoundingClientRect(), r = b.getBoundingClientRect();   // centred on the segment, kept inside the strip
        tip.style.left = Math.max(0, Math.min(R.width - tip.offsetWidth, r.left - R.left + r.width / 2 - tip.offsetWidth / 2)) + 'px'; tip.classList.add('on'); };
      b.onmouseleave = b.onblur = () => tip.classList.remove('on'); });
    card.querySelector('.gh.prev').onclick = () => go(cur() - 1); card.querySelector('.gh.next').onclick = () => go(cur() + 1);
    return (i, t) => { segs.forEach((b, j) => { b.firstChild.style.width = (j < i ? 100 : j === i ? Math.round(t * 100) : 0) + '%'; b.setAttribute('aria-selected', j === i); });
      card.querySelector('.gh.prev').disabled = i <= 0; card.querySelector('.gh.next').disabled = i >= n - 1; };
  }
  const short = (s, n = 7) => { const w = String(s || '').replace(/\*\*|\*|`/g, '').split(/\s+/); return w.slice(0, n).join(' ') + (w.length > n ? ' …' : ''); };

  // info sidebar: one panel on the right; follows the scene it was opened from, step by step
  let side = null, sideS = null;
  // scene info + step info; a plain string counts as { text }. Step keys win, notation tables merge.
  const asInfo = x => typeof x === 'string' ? { text: x } : x;
  function infoOf(s, k) { const a = asInfo(s.info), b = asInfo((s.steps[k] || {}).info); if (!a || !b) return a || b;
    return { ...a, ...b, notation: { ...(a.notation || {}), ...(b.notation || {}) } }; }
  const texOr = x => window.katex && /[\\_^{]/.test(x) ? katex.renderToString(x, { throwOnError: false }) : `<code>${esc(x)}</code>`;
  // one notation entry: "symbol : what it is", then the example on its own line. v = 'text' | {is, eg} | [is, eg]; a string may carry 'e.g. …'
  function noteHTML(k, v) {
    let is = v, eg = '';
    if (Array.isArray(v)) [is, eg] = v; else if (v && typeof v === 'object') ({ is, eg = '' } = v);
    else { const m = String(v).match(/^(.*?)[.;,]?\s+(?:e\.g\.|for example|example:)\s*(.+)$/i); if (m) [, is, eg] = m; }
    return `<div class="nt"><div class="nk"><span class="sym">${texOr(k)}</span><span class="col">:</span><span class="ne">${md(is)}</span></div>${eg ? `<div class="eg">e.g. ${md(eg)}</div>` : ''}</div>`;
  }
  function infoHTML(inf) {
    if (!inf) return '';
    const li = a => `<ul>${[].concat(a).map(x => `<li>${md(x)}</li>`).join('')}</ul>`, sec = (h, b) => `<section><h4>${h}</h4>${b}</section>`;
    return (inf.text ? `<section>${para(inf.text)}</section>` : '') + (inf.see ? sec('What you see', li(inf.see)) : '')
      + (inf.notation && Object.keys(inf.notation).length ? sec('Notation', `<div class="nts">${Object.entries(inf.notation).map(([k, v]) => noteHTML(k, v)).join('')}</div>`) : '')
      + (inf.example ? sec('Worked example', `<p class="wx">${md(inf.example)}</p>`) : '') + (inf.read ? sec('How to read it', li(inf.read)) : '') + (inf.try ? sec('Try', `<p>${md(inf.try)}</p>`) : '')
      + (inf.more ? `<details><summary>Deeper</summary>${para(inf.more)}</details>` : '');
  }
  P.infoWords = (s, k) => { const d = document.createElement('div'); d.innerHTML = infoHTML(infoOf(s, k)); d.querySelectorAll('.katex-mathml, .eg').forEach(e => e.remove());   /* required example lines do not count */ return d.textContent.split(/\s+/).filter(Boolean).length; };
  function renderSide(s) { const k = s.k || 0, st = s.steps[k] || {};
    side.querySelector('.phase').textContent = st.phase || s.phase || 'details'; side.querySelector('.st').textContent = st.title || s.title || '';
    // the step caption leads the sidebar; nothing is written under the figure
    side.querySelector('.sb').innerHTML = (st.cap ? `<p class="lead">${md(st.cap)}</p>` : '') + infoHTML(infoOf(s, k)); }
  P.side = i => { const s = i == null ? null : P.scenes[i]; if (s !== sideS) toggleSide(s); };   // for check.py: open the sidebar of scene i (null closes)
  function toggleSide(s) {
    if (!side) { document.body.insertAdjacentHTML('beforeend', `<aside class="side" aria-label="details" aria-hidden="true"><div class="sh"><span class="phase"></span><button class="sx" aria-label="close (Esc)">×</button></div><h3 class="st"></h3><div class="sb"></div></aside>`);
      side = document.querySelector('.side'); side.querySelector('.sx').onclick = () => toggleSide(null); addEventListener('keydown', e => { if (e.key === 'Escape' && sideS) toggleSide(null); }); }
    sideS = s && s !== sideS ? s : null;
    side.classList.toggle('open', !!sideS); side.setAttribute('aria-hidden', !sideS); document.body.classList.toggle('side-on', !!sideS);
    document.querySelectorAll('.ib').forEach(b => b.setAttribute('aria-expanded', !!sideS && b.closest('.card') === sideS.el.card));
    if (sideS) renderSide(sideS);
  }
  const infoBtn = `<button class="ib" aria-expanded="false" aria-label="details (i)" title="details (i)">i</button>`;

  // walk: one stage, one strip over every step of every scene
  // keys that move between steps: ignore typing in text boxes and modified keys; a range slider gives up ← → (it keeps ↑ ↓)
  const navKey = e => !(e.metaKey || e.ctrlKey || e.altKey) && !(e.target.isContentEditable || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || (e.target.tagName === 'INPUT' && e.target.type !== 'range'))
    && !(e.target.type === 'range' && !/Arrow(Left|Right)/.test(e.key));
  function buildWalk(root) {
    const flat = []; P.scenes.forEach(s => s.steps.forEach((_, k) => flat.push([s, k])));
    root.innerHTML = `<section class="card"><div class="head"><span class="phase"></span><span class="stitle"></span></div>${infoBtn}
      <div class="figwrap"><div class="stagewrap">${P.scenes.map(s => `<div class="sc" data-s="${s.i}" hidden>${figure(s)}</div>`).join('')}</div>${ghosts}${strip(P.scenes.map(s => s.steps.length))}</div>
      ${P.scenes.map(s => `<div class="cs" data-s="${s.i}" hidden>${controls(s)}</div>`).join('')}</section>`;
    const card = root.querySelector('.card');
    let cur = -1;
    const go = (i, instant) => { i = P.clamp(Math.round(i), 0, flat.length - 1); const [s, k] = flat[i], prev = cur >= 0 ? flat[cur][0] : null;
      card.querySelectorAll('.sc,.cs').forEach(e => e.hidden = +e.dataset.s !== s.i);
      card.className = 'card ' + (s.acc ? 'acc' + s.acc : '');
      const fwd = i === cur + 1 && prev === s; cur = i; if (sideS && sideS !== s) { sideS = s; }
      s.paint = t => paintStrip(i, t); play(s, k, instant || !fwd); };
    const paintStrip = bindStrip(card, flat.length, go, () => cur, i => `${flat[i][0].title || ''} · ${flat[i][1] + 1}/${flat[i][0].steps.length}`);
    P.scenes.forEach(s => { s.el = { card, fig: card.querySelector(`.sc[data-s="${s.i}"] .fig`), cap: card.querySelector('.cap'), title: card.querySelector('.stitle'), phase: card.querySelector('.phase'), ib: card.querySelector('.ib') };
      bindControls(s, card.querySelector(`.cs[data-s="${s.i}"]`)); });
    card.querySelector('.ib').onclick = () => toggleSide(flat[cur][0]);
    // ← → always step, even with a slider focused; ↑ ↓ still move that slider
    addEventListener('keydown', e => { if (!navKey(e)) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
      else if (e.key === 'Home') go(0, true); else if (e.key === 'End') go(flat.length - 1, true); else if (e.key === 'i') card.querySelector('.ib').click(); });
    P.states = () => flat.map(([s, k], i) => ({ i, scene: s.i, step: k }));
    P.show = st => { const s = P.scenes[st.scene]; Object.assign(s.params, s.defaults, st.params || {}); syncControls(s); go(st.i, true); draw(s, st.step, 1); };
    go(0, true);
  }
  // article: wide figures, each with its own strip and controls (study blocks may sit between scenes, never before the first)
  function buildArticle(root) {
    root.innerHTML = P.blocks.map(b => b.prose != null ? `<div class="prose">${b.h ? `<h2>${esc(b.h)}</h2>` : ''}${para(b.prose)}</div>`
      : b.html != null ? b.html
      : `<section class="card ${b.scene.acc ? 'acc' + b.scene.acc : ''}" data-s="${b.scene.i}">${(b.scene.title || b.scene.phase) ? `<div class="head">${b.scene.phase ? `<span class="phase">${esc(b.scene.phase)}</span>` : ''}<span class="stitle"></span></div>` : ''}${infoBtn}
         <div class="figwrap">${figure(b.scene)}${ghosts}${strip([b.scene.steps.length])}</div>${controls(b.scene)}</section>`).join('');
    P.scenes.forEach(s => { const card = root.querySelector(`.card[data-s="${s.i}"]`);
      s.el = { card, fig: card.querySelector('.fig'), cap: card.querySelector('.cap'), title: card.querySelector('.stitle'), ib: card.querySelector('.ib') };
      bindControls(s, card); card.querySelector('.ib').onclick = () => toggleSide(s);
      let k = 0;
      const go = (j, instant) => { j = P.clamp(Math.round(j), 0, s.steps.length - 1); const fwd = j === k + 1; k = j; s.paint = t => paintStrip(j, t); play(s, j, instant || !fwd); };
      const paintStrip = card.querySelector('.strip') ? bindStrip(card, s.steps.length, go, () => k, j => `${j + 1}/${s.steps.length} · ${short(s.steps[j].title || s.steps[j].cap)}`) : () => {};
      if (!card.querySelector('.strip')) card.querySelectorAll('.gh').forEach(b => b.remove());
      card.addEventListener('pointerdown', () => lastCard = s, true); card.addEventListener('focusin', () => lastCard = s);
      s.go = go; s.at = () => k; go(0, true); });
    // ← → step the figure you last touched if it is on screen, else the one nearest the middle of the screen; ↑ ↓ still move a focused slider
    let lastCard = null;
    const inView = s => { const r = s.el.card.getBoundingClientRect(); return r.bottom > innerHeight * .2 && r.top < innerHeight * .8; };
    const active = () => lastCard && inView(lastCard) ? lastCard : P.scenes.slice().sort((a, b) => { const d = s => { const r = s.el.card.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - innerHeight / 2); }; return d(a) - d(b); })[0];
    addEventListener('keydown', e => { if (!navKey(e)) return; const s = active(); if (!s) return;
      if (e.key === 'i' && e.target.type !== 'range') { toggleSide(s); return; }
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); s.go(s.at() + (e.key === 'ArrowRight' ? 1 : -1)); });
    P.states = () => { const out = []; let i = 0; P.scenes.forEach(s => s.steps.forEach((_, k) => out.push({ i: i++, scene: s.i, step: k }))); return out; };
    P.show = st => { const s = P.scenes[st.scene]; Object.assign(s.params, s.defaults, st.params || {}); syncControls(s); s.go(st.step, true); draw(s, st.step, 1); };
  }

  // ---------- self audit: run on the drawn state; check.py calls it for every step and control extreme ----------
  P.audit = (sceneIndex) => {
    const s = P.scenes[sceneIndex], g = s && s.last, out = [], where = `scene ${s.i + 1} "${(s.steps[s.k] && s.steps[s.k].title) || s.title || ''}" step ${s.k + 1}`;
    if (s.err) out.push(`${where}: draw error: ${s.err}`);
    if (!g) return out;
    const fig = s.el.fig.getBoundingClientRect(), px = fig.width / s.W;
    const T = g.texts.filter(a => a.x1 > a.x0), ov = (a, b, m = 0) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) - m) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) - m);
    const short = s => `"${String(s).slice(0, 28)}"`;
    for (let i = 0; i < T.length; i++) {
      const a = T[i];
      if (a.x0 < -2 || a.y0 < -2 || a.x1 > s.W + 2 || a.y1 > s.H + 2) out.push(`${where}: ${short(a.s)} leaves the figure`);
      if (a.px * px < 11.5 && px > .5) out.push(`${where}: ${short(a.s)} renders at ${(a.px * px).toFixed(1)}px (<12px)`);
      if (!a.tex && String(a.s).trim().length > 2 && /[Σ∏√∫]|[ᵢⱼₖ].*=|=.*[ᵢⱼₖ]/.test(a.s)) out.push(`${where}: ${short(a.s)} is a formula typed as text; draw it with g.tex and explain its symbols in info.notation`);
      if (!a.tex && String(a.s).split(/\s+/).length > 7) out.push(`${where}: label ${short(a.s)} has >7 words; move detail to the caption or info`);
      for (let j = i + 1; j < T.length; j++) if (ov(a, T[j], 1) > 6) out.push(`${where}: labels overlap ${short(a.s)} × ${short(T[j].s)}`);
      for (const [x1, y1, x2, y2] of g.segs) if (segHit(x1, y1, x2, y2, a.x0 + 3, a.y0 + 3, a.x1 - 3, a.y1 - 3)) { out.push(`${where}: a line crosses ${short(a.s)}`); break; }
      for (const b of g.boxes) { const inside = a.x0 >= b.x0 - 1 && a.x1 <= b.x1 + 1 && a.y0 >= b.y0 - 1 && a.y1 <= b.y1 + 1;
        if (!inside && ov(a, b, 2) > 8 && b.solid) { out.push(`${where}: ${short(a.s)} sits across a shape edge`); break; } }
    }
    // a listed panel that is never on screen (two panels start on the same step) would vanish silently
    if (s.k === 0 && s.panels) { const seen = new Set(); s.steps.forEach((_, kk) => Object.keys(panelsAt(s, kk, 1)).forEach(id => seen.add(id)));
      const lost = s.panels.filter(q => !seen.has(q.id)).map(q => q.id); if (lost.length) out.push(`${where}: panel ${lost.join(', ')} is never on screen: one figure per step and the older one retires; give it a later 'from', or its own scene`); }
    // plots fill their panel: a short plot under big headings wastes the stage (titles belong in the head or the sidebar)
    // every notation entry carries an example from the figure: "symbol : meaning", then "e.g. …"
    { const nt = (infoOf(s, s.k) || {}).notation || {}, bare = Object.entries(nt).filter(([, v]) => !(Array.isArray(v) ? v[1] : v && typeof v === 'object' ? v.eg : /\s(e\.g\.|for example|example:)\s/i.test(v))).map(([k]) => k);
      if (bare.length) out.push(`${where}: notation without an example: ${bare.slice(0, 4).join(', ')}; write each as [meaning, example from the figure], e.g. n: ['samples per group', '6 dots in each group']`); }
    // a formula on the stage needs its symbols explained in the sidebar
    if (g.texts.some(q => q.tex)) { const inf = infoOf(s, s.k) || {}; if (!inf.notation || !Object.keys(inf.notation).length) out.push(`${where}: formula on the stage but no info.notation; name every symbol, index and operator with an example from the figure`); }
    g.plots.forEach(q => { if (q.h < (s.minPlotH || 300)) out.push(`${where}: plot ${short(q.name)} is ${Math.round(q.h)} units tall (min ${s.minPlotH || 300}); shrink panelPad and the text above or below it, put headings in the scene title or the sidebar`); });
    const big = g.texts.filter(q => q.size > 36 && String(q.s).trim().length > 2)   /* a lone "=" or "×" may be big */; if (big.length) out.push(`${where}: text ${short(big[0].s)} is size ${big[0].size} (max 36: labels 20, the key number 26–34); bigger text squeezes the plots`);
    g.plots.forEach(q => { if (q.w < (s.minPlotW || 440)) out.push(`${where}: plot ${short(q.name)} is ${Math.round(q.w)} units wide (min ${s.minPlotW || 440}); one figure per step, drawn across the stage`); });
    // one figure per step: two plots side by side look crammed; the next figure belongs on the next step
    if (g.plots.length > 1) out.push(`${where}: ${g.plots.length} plots on one step (${g.plots.map(q => short(q.name)).join(', ')}); show one figure per step and bring the next one in on the next step (panels with a later 'from' do this)`);
    if (g.words > (s.wordBudget || 40)) out.push(`${where}: ${g.words} words on the figure (budget ${s.wordBudget || 40}); move text to caption/info`);
    const iw = P.infoWords(s, s.k); if (iw > 120) out.push(`${where}: info sidebar has ${iw} words (max 120); cut to short points`);
    const cap = (s.steps[s.k] || {}).cap || ''; if (cap.split(/\s+/).length > 28) out.push(`${where}: caption has ${cap.split(/\s+/).length} words (max 28)`);
    { const nl = T.filter(a => !a.tick).length; if (nl > (s.labelBudget || 24)) out.push(`${where}: ${nl} labels on the figure (max ${s.labelBudget || 24}); split the scene`); }
    return [...new Set(out)];
  };
  function segHit(x1, y1, x2, y2, l, t, r, b) {
    if (r <= l || b <= t) return false;
    const inside = (x, y) => x > l && x < r && y > t && y < b; if (inside(x1, y1) || inside(x2, y2)) return true;
    const cr = (ax, ay, bx, by, cx, cy, dx, dy) => { const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (!d) return false;
      const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d; return u > 0 && u < 1 && v > 0 && v < 1; };
    return cr(x1, y1, x2, y2, l, t, r, t) || cr(x1, y1, x2, y2, r, t, r, b) || cr(x1, y1, x2, y2, l, b, r, b) || cr(x1, y1, x2, y2, l, t, l, b);
  }

  // ---------- boot ----------
  function boot() {
    const o = P.opts, theme = 'dark';
    document.body.dataset.theme = theme; if (o.palette) document.body.dataset.palette = o.palette; if (o.acc) document.body.classList.add('acc' + o.acc);
    document.title = o.title || 'Proff';
    const head = `<header class="top"><div class="tx">${o.eyebrow ? `<span class="eyebrow">${esc(o.eyebrow)}</span>` : ''}<h1>${esc(o.title || '')}</h1>${o.sub ? `<p class="sub">${esc(o.sub)}</p>` : ''}</div></header>`;
    document.body.insertAdjacentHTML('afterbegin', head + '<main id="story"></main>' + (o.foot ? `<p class="foot">${md(o.foot)}</p>` : ''));
    const setT = t => { document.body.dataset.theme = t; readVars(); P.scenes.forEach(s => s.el && draw(s, s.k || 0, 1)); };
    readVars();
    const root = document.getElementById('story');
    (o.layout === 'article' ? buildArticle : buildWalk)(root);
    setT(theme);
    P.ready = true;
  }
  const start = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    const imgs = Object.entries(P.assets).map(([k, v]) => new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = v; P.images[k] = im; }));
    return Promise.all(imgs); }).then(boot).catch(e => { P.errors.push('boot: ' + e.message); console.error(e); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start);
  addEventListener('error', e => P.errors.push('page: ' + e.message));
})();
