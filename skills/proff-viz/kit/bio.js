/* proff bio kit: native biology primitives drawn with the stage kit, so they follow the theme and the audit.
   Included by build.py only when story.js calls one of them. Each returns anchor points so labels and arrows can attach.
   Base colours: A c4, C c1, G c2, T/U c3 (fixed for the whole page). */
(function () {
  const P = window.Proff; P.plugins = P.plugins || {};
  const BASE = { A: 'c4', C: 'c1', G: 'c2', T: 'c3', U: 'c3', N: 'muted' };
  const COMP = { A: 'T', T: 'A', G: 'C', C: 'G', U: 'A', N: 'N' };
  P.bio = { BASE, comp: s => [...s].map(b => COMP[b] || 'N').join(''), randSeq: (n, r) => Array.from({ length: n }, () => 'ACGT'[Math.floor((r || Math.random)() * 4)]).join('') };

  // DNA double strand, base by base. o: seq (top strand 5'->3'), bw (base width), letters (default when bw>=22), rungs,
  // hi: [[from,to,color,label?]] coloured spans, cut: index (cut between cut-1 and cut on both strands), open: [from,to] melted bubble
  // (bottom strand pushed down), single: true (top strand only), ends: true (5'/3' marks). Returns {x(i), top, bot, w, h}.
  P.plugins.dna = (g, x, y, o = {}) => {
    const seq = o.seq || 'ACGT'.repeat(5), n = seq.length, bw = o.bw || 28, bh = o.bh || bw * .95, gap = o.gap ?? bh * .9, letters = o.letters ?? bw >= 22;
    const cut = o.cut, cs = o.cutShift ?? 0, open = o.open, sep = o.sep ?? 0;   // cs: how far the two halves move apart (0..1)
    const bx = i => x + i * bw + (cut != null && i >= cut ? cs * bw * 1.6 : 0);
    const yb = i => y + bh + gap + (open && i >= open[0] && i < open[1] ? sep : 0);
    const fs = Math.max(12, Math.min(bw * .62, 26));
    const strand = (s, yy, ix, rev) => [...s].forEach((b, i) => { const X0 = bx(i), Y = typeof yy === 'function' ? yy(i) : yy, span = (o.hi || []).find(h => i >= h[0] && i < h[1]);
      g.rect(X0 + 1, Y, bw - 2, bh, { fill: span ? span[2].replace(/^c/, 'f') : 'surf', stroke: span ? span[2] : BASE[b] || 'muted', sw: span ? 2.5 : 1.5, r: 3, free: true });
      if (letters) g.text(X0 + bw / 2, Y + bh / 2, b, { size: fs, anchor: 'middle', weight: 800, mono: true, fill: BASE[b] || 'muted', free: true }); });
    strand(seq, y);
    if (!o.single) {
      const bot = P.bio.comp(seq);
      if (o.rungs !== false) for (let i = 0; i < n; i++) { const yy = yb(i); if (yy - (y + bh) < gap + 2) g.line(bx(i) + bw / 2, y + bh + 2, bx(i) + bw / 2, yy - 2, { stroke: 'line-dim', sw: 1.5, free: true }); }
      strand(bot, yb);
    }
    if (o.ends) { const fsE = Math.max(13, fs * .7);
      g.text(x - 8, y + bh / 2, "5'", { size: fsE, anchor: 'end', fill: 'muted', mono: true, free: true }); g.text(bx(n - 1) + bw + 8, y + bh / 2, "3'", { size: fsE, fill: 'muted', mono: true, free: true });
      if (!o.single) { g.text(x - 8, yb(0) + bh / 2, "3'", { size: fsE, anchor: 'end', fill: 'muted', mono: true, free: true }); g.text(bx(n - 1) + bw + 8, yb(n - 1) + bh / 2, "5'", { size: fsE, fill: 'muted', mono: true, free: true }); } }
    const H = o.single ? bh : bh * 2 + gap + sep;
    g.rect(x, y, bx(n - 1) + bw - x, H, { stroke: 'none', fill: 'none' });   // registers the footprint for the audit only
    return { x: i => bx(i), cx: i => bx(i) + bw / 2, top: y, bot: o.single ? y + bh : yb(0) + bh, mid: y + bh + gap / 2, w: bx(n - 1) + bw - x, h: H, bw, bh };
  };

  // sgRNA: 20-nt spacer as letters (matches the target) + scaffold drawn as a stem-loop tail that Cas9 grips.
  // o: seq (spacer, 5'->3'), bw, color (spacer accent, default c5), scaffold (true), flip (draw spacer right-to-left)
  P.plugins.guide = (g, x, y, o = {}) => {
    const seq = (o.seq || 'GACGTTAGCCTAGGATCCAA').replace(/T/g, 'U'), bw = o.bw || 26, bh = o.bh || bw * .95, col = o.color || 'c1', n = seq.length, fs = Math.max(12, Math.min(bw * .6, 24));
    [...seq].forEach((b, i) => { g.rect(x + i * bw + 1, y, bw - 2, bh, { fill: col.replace(/^c/, 'f'), stroke: col, sw: 2, r: 3, free: true });
      if (o.letters ?? bw >= 20) g.text(x + i * bw + bw / 2, y + bh / 2, b, { size: fs, anchor: 'middle', weight: 800, mono: true, fill: BASE[b], free: true }); });
    const ex = x + n * bw;
    if (o.scaffold !== false) {   // scaffold: a backbone that runs on and folds into three hairpins
      const s = o.ss || bw / 26, c = o.scol || 'c1', st = { stroke: c, sw: 4 * Math.max(.6, s), fill: undefined };
      g.path(`M${ex} ${y + bh / 2} h${18 * s} c${10 * s} 0 ${14 * s} ${-36 * s} ${26 * s} ${-36 * s} s${16 * s} ${36 * s} ${26 * s} ${36 * s} h${12 * s} c${8 * s} 0 ${12 * s} ${-28 * s} ${22 * s} ${-28 * s} s${12 * s} ${28 * s} ${22 * s} ${28 * s} h${10 * s} c${8 * s} 0 ${10 * s} ${-22 * s} ${18 * s} ${-22 * s} s${10 * s} ${22 * s} ${18 * s} ${22 * s} h${16 * s}`, st);
    }
    g.rect(x, y, n * bw, bh, { stroke: 'none', fill: 'none' });
    return { x: i => x + i * bw, cx: i => x + i * bw + bw / 2, end: ex, w: n * bw + (o.scaffold !== false ? 230 * (o.ss || bw / 26) : 0), y, bh };
  };

  // Cas9: two-lobed protein outline (recognition lobe + nuclease lobe) with a channel. o: w, fill, op, cut (show scissors marks at x offset)
  P.plugins.cas9 = (g, cx, cy, o = {}) => {   // one soft body the DNA runs through. o: w, h, label, fill, stroke
    const w = o.w || 300, h = o.h || w * .5, f = o.fill || 'f6', st = o.stroke || 'c6', x = cx - w / 2, y = cy - h / 2;
    g.rect(x, y, w, h, { fill: f, stroke: st, sw: 3, r: Math.min(60, h * .3), op: o.op, free: true });   // container: text inside is intended
    if (o.label !== false) g.text(x + 8, y - 16, 'Cas9', { size: 24, weight: 900, fill: st });
    return { cx, cy, w, h, top: y, bot: y + h, left: x, right: x + w };
  };

  // Cell with membrane, cytoplasm and nucleus. o: rx, ry (default r), nucleus (true), fill, stroke, dna (draw chromatin squiggle), op
  P.plugins.cell = (g, cx, cy, r, o = {}) => {
    const rx = o.rx || r, ry = o.ry || r * .82, nr = r * .38;
    g.ellipse(cx, cy, rx, ry, { fill: o.fill || 'surf2', stroke: o.stroke || 'c4', sw: o.sw || 3, op: o.op });
    if (o.nucleus !== false) { g.ellipse(cx + rx * .12, cy + ry * .05, nr * 1.15, nr, { fill: o.nfill || 'f5', stroke: o.nstroke || 'c5', sw: 2.5, op: o.op });
      if (o.dna) { const pts = P.range(0, 1, 40).map(t => [cx + rx * .12 - nr * .8 + t * nr * 1.6, cy + ry * .05 + Math.sin(t * 18) * nr * .25]); g.poly(pts, { stroke: 'c5', sw: 2, free: true }); } }
    g.rect(cx - rx, cy - ry, rx * 2, ry * 2, { stroke: 'none', fill: 'none' });
    return { cx, cy, rx, ry, nx: cx + rx * .12, ny: cy + ry * .05, nr };
  };
  P.plugins.nucleus = (g, cx, cy, r, o = {}) => { g.ellipse(cx, cy, r * 1.15, r, { fill: o.fill || 'f5', stroke: o.stroke || 'c5', sw: 2.5, op: o.op }); return { cx, cy, r }; };

  // Lentivirus particle: envelope, spikes, capsid cone with two RNA strands. o: op, color
  P.plugins.virus = (g, cx, cy, r, o = {}) => {
    const c = o.color || 'c3';
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, x1 = cx + Math.cos(a) * r, y1 = cy + Math.sin(a) * r, x2 = cx + Math.cos(a) * r * 1.22, y2 = cy + Math.sin(a) * r * 1.22;
      g.line(x1, y1, x2, y2, { stroke: c, sw: 2.5, free: true }); g.circle(x2, y2, Math.max(2.5, r * .07), { fill: c, stroke: 'none', free: true }); }
    g.circle(cx, cy, r, { fill: 'surf2', stroke: c, sw: 3, op: o.op, free: true });
    g.path(`M${cx - r * .45} ${cy - r * .35} L${cx + r * .5} ${cy - r * .18} L${cx + r * .5} ${cy + r * .18} L${cx - r * .45} ${cy + r * .35} Z`, { fill: o.cfill || 'f2', stroke: 'c2', sw: 2 });
    [-1, 1].forEach(sg => g.poly(P.range(0, 1, 20).map(t => [cx - r * .32 + t * r * .7, cy + sg * r * .08 + Math.sin(t * 12) * r * .05]), { stroke: 'c1', sw: 2, free: true }));
    g.rect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4, { stroke: 'none', fill: 'none' });
    return { cx, cy, r };
  };

  // Plasmid ring with coloured parts. parts: [{from, to, color}] in fractions of the ring (0 = top, clockwise). Returns at(f, k) -> point at radius k*r.
  P.plugins.plasmid = (g, cx, cy, r, o = {}) => {
    g.circle(cx, cy, r, { stroke: 'line', sw: o.sw || 6, free: true });
    const at = (f, k = 1) => [cx + Math.sin(f * 2 * Math.PI) * r * k, cy - Math.cos(f * 2 * Math.PI) * r * k];
    (o.parts || []).forEach(p => { const pts = P.range(p.from, p.to, 40).map(f => at(f)); g.poly(pts, { stroke: p.color || 'c1', sw: (o.sw || 6) * 2.2, free: true }); });
    g.rect(cx - r, cy - r, r * 2, r * 2, { stroke: 'none', fill: 'none' });
    return { cx, cy, r, at };
  };

  // Lab ware. tube(x, y, h, {level 0..1, fill}) is a microcentrifuge tube with its top-left at x,y; dish(cx, cy, r, {cells, seed, color})
  P.plugins.tube = (g, x, y, h, o = {}) => {
    const w = h * .36, body = h * .72, lv = o.level ?? .45;
    const shape = `M${x} ${y} h${w} v${body} l${-w * .3} ${h - body} h${-w * .4} l${-w * .3} ${-(h - body)} Z`;
    if (lv > 0) { const ly = y + h - lv * h; g.path(`M${x} ${Math.max(y, ly)} h${w} v${Math.max(0, y + body - Math.max(y, ly))} l${-w * .3} ${h - body} h${-w * .4} l${-w * .3} ${-(h - body)} Z`, { fill: o.fill || 'f1', stroke: 'none' }); }
    g.path(shape, { stroke: 'ink', sw: 2.5 }); g.rect(x - 6, y - 10, w + 12, 10, { fill: 'surf2', stroke: 'ink', sw: 2.5, r: 3, free: true });
    g.rect(x - 6, y - 10, w + 12, h + 10, { stroke: 'none', fill: 'none' });
    return { x, y, w, h, cx: x + w / 2, bot: y + h };
  };
  P.plugins.dish = (g, cx, cy, r, o = {}) => {
    g.ellipse(cx, cy, r, r * .34, { fill: 'surf2', stroke: 'ink', sw: 2.5 }); g.ellipse(cx, cy - 6, r * .94, r * .3, { fill: o.media || 'fig', stroke: 'line-dim', sw: 1.5 });
    const rr = P.rng(o.seed || 3), n = o.cells ?? 30, cr = o.cr || Math.max(5, r * .055), col = o.color;
    for (let i = 0; i < n; i++) { const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * .82; const c = typeof col === 'function' ? col(i) : (col || 'c4');
      g.ellipse(cx + Math.cos(a) * r * .9 * d, cy - 6 + Math.sin(a) * r * .27 * d, cr, cr * .6, { fill: c.replace(/^c/, 'f'), stroke: c, sw: 1.5 }); }
    g.rect(cx - r, cy - r * .34, r * 2, r * .68, { stroke: 'none', fill: 'none' });
    return { cx, cy, r };
  };

  // Sequencing flow cell lane with clusters; clusters coloured by a function (i) -> color. o: lanes, n, color
  P.plugins.flowcell = (g, x, y, w, h, o = {}) => {
    g.rect(x, y, w, h, { fill: 'surf2', stroke: 'ink', sw: 2.5, r: 12, free: true });
    const L = o.lanes || 4, lh = (h - 24) / L, rr = P.rng(o.seed || 9), n = o.n || 40;
    for (let l = 0; l < L; l++) { g.rect(x + 14, y + 12 + l * lh + 4, w - 28, lh - 8, { fill: 'fig', stroke: 'line-dim', sw: 1.5, r: 6, free: true });
      for (let i = 0; i < n; i++) { const c = o.color ? o.color(l * n + i) : ['c1', 'c2', 'c3', 'c4'][Math.floor(rr() * 4)]; g.circle(x + 24 + rr() * (w - 48), y + 12 + l * lh + 10 + rr() * (lh - 20), 4, { fill: c, stroke: 'none', free: true }); } }
    g.rect(x, y, w, h, { stroke: 'none', fill: 'none' });
    return { x, y, w, h };
  };

  // One sequencing read drawn as labelled segments: parts [{len, color, text}] with total width w. Returns segment centres.
  P.plugins.read = (g, x, y, o = {}) => {
    const parts = o.parts || [{ len: 1, color: 'c1' }], tot = parts.reduce((s, p) => s + p.len, 0), w = o.w || 600, h = o.h || 34, out = []; let xx = x;
    parts.forEach(p => { const pw = p.len / tot * w; const pc = p.color || 'c1', soft = /^c[1-6]$/.test(pc) ? pc.replace('c', 'f') : 'surf2'; g.rect(xx, y, pw, h, { fill: soft, stroke: pc, sw: 2, free: true });
      if (p.text) g.text(xx + pw / 2, y + h / 2, p.text, { size: Math.max(13, Math.min(18, h * .5)), anchor: 'middle', mono: true, weight: 700, fill: p.color || 'ink', tick: 1 });
      out.push({ x0: xx, x1: xx + pw, cx: xx + pw / 2 }); xx += pw; });
    g.rect(x, y, w, h, { stroke: 'none', fill: 'none' });
    return { parts: out, x, y, w, h };
  };
  P.plugins.rna = (g, x, y, o = {}) => P.plugins.dna(g, x, y, { ...o, single: true, seq: (o.seq || 'ACGU').replace(/T/g, 'U') });
})();
