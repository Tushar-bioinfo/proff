/* Proff calc engine: replays a calctrace.py trace. Proff.calc(trace, {phase, acc}) adds one scene per operation.
   Reads glow in their table's colour, the formula bar shows the numbers being combined, the output cell fills. */
(function () {
  'use strict';
  const P = window.Proff, ST = P.stat;
  const fcol = c => 'f' + c.slice(1);
  const CAP_ALL = 'Same rule for every cell.';

  P.calc = (tr, opt = {}) => {
    const TS = tr.tensors;
    (tr.warn || []).forEach(w => P.errors.push(w));   // calctrace found a formula it cannot explain: check.py fails
    tr.steps.forEach((st, si) => {
      const n = st.cells.length, k = Math.min(st.expand || 0, n), plan = [];
      for (let c = 0; c < k; c++) plan.push({ one: c });
      if (n > k || !n) plan.push({ rest: k });
      // the sidebar lead keeps the step's own sentence on every step; the stage shows the cells moving
      const steps = plan.map((p, j) => ({ cap: j === 0 ? st.cap : `${st.cap} ${p.rest != null ? (st.cap_all || CAP_ALL) : 'Next cell, same rule.'}` }));
      P.scene({ title: st.title, phase: opt.phase || st.phase, labelBudget: 60, wordBudget: 60, acc: opt.acc, steps, info: merge(st.info, explain(st, tr)), anim: st.op === 'show' ? 450 : 900, w: 1200, h: 675,
        draw: (g, j, t) => (st.op === 'dist' ? drawDist : drawOp)(g, st, plan[j], t, TS) });
    });
  };

  // ---------- the i sidebar, written from the trace: every symbol, index and operator in the formula, plus one worked example ----------
  const OPS = [  // [pattern in the TeX, plain words]; v = the summed index, if any
    [/\\sum_\{?([a-z])\}?/, (m, ix) => [`\\sum_${m[1]}`, { is: `add up over every ${m[1]} (every ${ix[m[1]] || m[1]})`, eg: 'Σ over 1, 2, 3 = 6' }]],
    [/\\sum(?!_)/, () => ['\\sum', 'add up']],
    [/\\prod/, () => ['\\prod', 'multiply all together']],
    [/\\bar\{?([a-zA-Z])/, m => [`\\bar{${m[1]}}`, { is: `the average of ${m[1]}`, eg: 'average of 2, 4, 6 = 4' }]],
    [/\\log_2|\\log_\{2\}/, () => ['\\log_2', { is: 'log base 2: how many doublings', eg: 'log₂ 8 = 3' }]],
    [/\\log_\{?10\}?/, () => ['\\log_{10}', { is: 'log base 10: how many tenfolds', eg: 'log₁₀ 1000 = 3' }]],
    [/\\ln|\\log(?!_)/, () => ['\\ln', 'natural log (base e ≈ 2.718)']],
    [/\\sqrt/, () => ['\\sqrt{\\;}', { is: 'square root', eg: '√9 = 3' }]],
    [/\\frac|\//, () => ['a / b', 'divide']],
    [/\\times|\\cdot/, () => ['\\times', 'multiply']],
    [/\^(\{2\}|2(?![0-9]))/, () => ['a^2', { is: 'squared', eg: '3² = 3 × 3 = 9' }]],
    [/\\exp|e\^/, () => ['e^{a}', 'e (≈ 2.718) to the power a; undoes ln']],
    [/\|/, () => ['|a|', 'size of a, sign dropped']],
  ];
  const nm = (a, i) => a && a[i] != null ? a[i] : String(i + 1);
  function explain(st, tr) {
    if (!st.tex && st.op === 'show') return null;
    const TS = tr.tensors, ix = tr.index || { i: 'row', j: 'column' }, notation = {}, tex = st.tex || '';
    const used = [...new Set((st.layout || []).flatMap(it => it && typeof it === 'object' ? [it.t, it.right, it.below] : []).concat(st.out).filter(Boolean))];
    for (const n of used) { const T = TS[n]; if (!T || !T.sym) continue;
      const R = T.data.length, C = T.data[0].length, sub = R > 1 && C > 1 ? 'ij' : R > 1 ? 'i' : C > 1 ? 'j' : '';
      const where = sub === 'ij' ? ` of ${ix.i} i in ${ix.j} j` : sub === 'i' ? ` of ${ix.i} i` : sub === 'j' ? ` of ${ix.j} j` : '';
      const eg = sub === 'ij' ? `${nm(T.rows, 0)} in ${nm(T.cols, 0)}` : sub === 'i' ? nm(T.rows, 0) : sub === 'j' ? nm(T.cols, 0) : '';
      notation[sub ? `${T.sym}_{${sub}}` : T.sym] = { is: `${T.label || n}${T.unit ? ` (${T.unit})` : ''}${where}`, eg: eg ? `${eg} = **${T.disp[0][0]}**` : `**${T.disp[0][0]}**` }; }
    const first = Object.values(TS).find(T => T.rows && T.cols) || {};
    const subs = [...tex.matchAll(/_(?:\{([^}]*)\}|([a-zA-Z]))/g)].map(m => (m[1] ?? m[2]).replace(/\\[a-zA-Z]+/g, '')).join(' ');   // index letters only inside subscripts
    if (/i/.test(subs)) notation.i = { is: `one ${ix.i} (a row)`, eg: `${nm(first.rows, 0)}, ${nm(first.rows, 1)}, …` };
    if (/j/.test(subs)) notation.j = { is: `one ${ix.j} (a column)`, eg: `${nm(first.cols, 0)}, ${nm(first.cols, 1)}, …` };
    const opKeys = []; OPS.forEach(([re, f]) => { const m = tex.match(re); if (m) { const [k, v] = f(m, ix); if (!notation[k]) { notation[k] = v; opKeys.push(k); } } });   // 'words. example' strings split into two lines in the sidebar
    // worked example: the first output cell, named by its row and column
    const c = st.cells && st.cells[0], O = TS[st.out];
    let example = null;
    if (c && O && c.expr) { const [i, j] = c.out, who = [O.rows && O.rows[i], O.cols && O.cols[j]].filter(Boolean).join(', ');
      const plain = (O.sym || '').replace(/\\mathrm\{(.*?)\}/g, '$1').replace(/[\\{}]/g, '');
      example = `${who ? `**${who}**: ` : ''}${plain ? `${plain} = ` : ''}${c.expr.map(e => e[0]).join(' ').replace(/\s+/g, ' ').trim()}`; }
    // an operator's example is better taken from the figure than made up
    const op = opKeys.find(k => /^\\(sum|prod)/.test(k)) || opKeys.find(k => typeof notation[k] === 'string'); opKeys.filter(k => k !== op && typeof notation[k] === 'string').forEach(k => notation[k] = { is: notation[k], eg: { 'a / b': '6 / 3 = 2', '\\times': '3 × 4 = 12', '\\ln': 'ln 1 = 0', '|a|': '|−3| = 3', 'e^{a}': 'e⁰ = 1', '\\sum': '1 + 2 + 3 = 6', '\\prod': '2 × 3 × 4 = 24' }[k] || '' });
    if (op && example) { notation[op] = { ...(typeof notation[op] === 'string' ? { is: notation[op] } : notation[op]), eg: example.replace(/\*\*/g, '') }; example = null; }   // shown once, under the operator
    return { notation, example };
  }
  function merge(a, b) { if (!b) return a; a = typeof a === 'string' ? { text: a } : (a || {});
    return { ...b, ...a, notation: { ...b.notation, ...(a.notation || {}) }, example: a.example || b.example }; }

  // ---------- layout of the equation row ----------
  function sizeOf(T, cw, ch) {
    const R = T.data.length, C = T.data[0].length, fs = Math.min(28, ch * .44);
    const lab = T.rows ? Math.max(...T.rows.map(r => String(r).length)) * fs * .5 + 16 : 0;
    const top = (T.cols ? fs * 1.3 : 0) + fs * 1.6;
    return { w: C * cw, h: R * ch, lab, top, fs };
  }
  function layoutRow(g, items, TS, cw, ch) {
    const gap = 26, parts = [];
    let x = 0;
    for (const it of items) {
      if (it == null) continue;
      if (typeof it === 'string') { const w = Math.max(40, it.length * 17 + 24); parts.push({ op: it, x, w }); x += w + gap; continue; }
      const T = TS[it.t], s = sizeOf(T, cw, ch);
      const p = { t: it.t, x: x + s.lab, y: 0, s, below: it.below, right: it.right, sym: it.sym };
      let w = s.lab + s.w, h = s.h;
      if (it.right) { const V = TS[it.right], vs = sizeOf(V, cw, ch); p.rx = s.w + 70; w += 70 + vs.w; }
      if (it.below) { p.by = s.h + ch * .9; h += ch * 1.9; }
      p.W = w; p.Hh = h; parts.push(p); x += w + gap;
    }
    return { parts, width: x - gap };
  }
  function fit(g, st, TS) {
    const top = st.tex ? 110 : 64, bottom = 120, availH = g.H - top - bottom, availW = g.W - 80;
    for (let cw = 150; cw >= 40; cw -= 4) {
      const ch = Math.round(cw * .56), L = layoutRow(g, st.layout, TS, cw, ch);
      const H = Math.max(...L.parts.filter(p => p.t).map(p => p.s.top + (p.Hh || p.s.h)), 0);
      if (L.width <= availW && H <= availH) return { cw, ch, L, H, top, x0: (g.W - L.width) / 2, y0: top + (availH - H) / 2 };
    }
    const cw = 40, ch = 24, L = layoutRow(g, st.layout, TS, cw, ch);
    return { cw, ch, L, H: 0, top, x0: 40, y0: top + 10 };
  }

  // ---------- one operation ----------
  function drawOp(g, st, pl, t, TS) {
    const F = fit(g, st, TS), { cw, ch } = F, n = st.cells.length;
    // which cells are done, which one is live
    let live = null, done = 0, phase = 1;
    if (pl.one != null) { live = st.cells[pl.one]; done = pl.one; phase = t; }
    else if (n) { const k = pl.rest; const f = k + (n - k) * t; done = Math.floor(f); live = done < n ? st.cells[done] : null; if (t >= 1) { done = n; live = null; } }
    const isDone = (i, j) => { for (let c = 0; c < done; c++) { const o = st.cells[c].out; if (o[0] === i && o[1] === j) return true; } return false; };
    const reads = new Set((live ? live.reads : []).map(r => r.join(':')));
    const outCell = live ? live.out.join(':') : null;
    const showRead = pl.one != null ? P.seg(phase, 0, .25) : 1, showOut = pl.one != null ? P.seg(phase, .7, .95) : 1;

    if (st.tex) g.tex(g.W / 2, 58, st.tex, { size: 36, w: 1000, h: 80 });
    const y0 = F.y0;
    for (const p of F.L.parts) {
      const x = F.x0 + p.x;
      if (p.op) { g.text(F.x0 + p.x + p.w / 2, y0 + F.H / 2 + 12, p.op, { size: p.op.length > 3 ? 24 : 36, anchor: 'middle', weight: 700, fill: 'muted' }); continue; }
      const T = TS[p.t], top = y0 + p.s.top;
      drawT(g, T, p.t, x, top, cw, ch, st, { reads, outCell, isDone, showRead, showOut, phase });
      if (p.below) { const V = TS[p.below], vy = top + p.by;
        g.text(x - 12, vy + ch / 2, p.sym, { size: 26, anchor: 'end', weight: 800, fill: V.color });
        drawT(g, V, p.below, x, vy, cw, ch, st, { reads, outCell, isDone, showRead, showOut, phase, noTitle: true });
        g.text(x + p.s.w + 12, vy + ch / 2, V.label, { size: 17, fill: V.color, weight: 650 }); }
      if (p.right) { const V = TS[p.right], vx = x + p.rx;
        g.text(vx - 35, top + p.s.h / 2, p.sym, { size: 26, anchor: 'middle', weight: 800, fill: V.color });
        drawT(g, V, p.right, vx, top, cw, ch, st, { reads, outCell, isDone, showRead, showOut, phase }); }
    }
    // formula bar: the live cell's arithmetic, coloured by table
    const ex = live ? live.expr : (n ? st.cells[n - 1].expr : null);
    if (ex && st.op !== 'show') {
      const fy = g.H - 62, size = 34, upto = pl.one != null ? Math.ceil(ex.length * P.seg(phase, .2, .75)) : ex.length;
      const ws = ex.map(([s, name]) => P.measure(s, { size, mono: true, weight: name ? 750 : 500 })), w = ws.reduce((a, b) => a + b, 0);
      let x = g.W / 2 - w / 2;
      g.rect(g.W / 2 - w / 2 - 28, fy - 36, w + 56, 72, { fill: 'surf', stroke: 'line-dim', sw: 1.5, r: 4, free: true });
      ex.slice(0, upto).forEach(([s, name], q) => { const c = name ? TS[name].color : 'muted';
        g.text(x, fy, s, { size, fill: c, weight: name ? 750 : 500, mono: true, op: live ? 1 : .5 }); x += ws[q]; });
    }
  }

  function drawT(g, T, name, x, y, cw, ch, st, s) {
    const R = T.data.length, isOut = name === st.out;
    if (!s.noTitle) g.text(x + T.data[0].length * cw / 2, y - (T.cols ? Math.min(28, ch * .44) * 2.4 : Math.min(28, ch * .44) * 1.1), T.label + (T.unit ? ` (${T.unit})` : ''), { size: 18, anchor: 'middle', weight: 750, fill: T.color });
    g.matrix(x, y, T.disp, {
      cw, ch, rows: T.rows, cols: T.cols, fmt: v => v, size: Math.min(28, ch * .44),
      cell: (i, j) => {
        const key = `${name}:${i}:${j}`;
        if (isOut) {
          const here = s.outCell === `${i}:${j}`;
          if (here) return { fill: fcol(T.color), stroke: T.color, sw: 3, text: s.showOut > .5 ? T.disp[i][j] : '', top: s.showOut };
          if (!s.isDone(i, j)) return { fill: 'fig', stroke: 'line-dim', text: '' };
          return {};
        }
        if (s.reads.has(key)) return { fill: fcol(T.color), stroke: T.color, sw: 3, op: 1, top: 1, weight: 800, color: s.showRead > .3 ? T.color : 'ink' };
        return { };
      } });
  }

  // ---------- where a statistic falls on its distribution ----------
  function drawDist(g, st, pl, t, TS) {
    const prm = st.params, x = st.x, disc = ['pois', 'nb', 'binom'].includes(st.dist);
    const left = st.src ? 420 : 90;
    if (st.src) { const [nm, i, j] = st.src, T = TS[nm], cw = 66, ch = 40;
      const R = T.data.length, C = T.data[0].length, mx = 60 + (T.rows ? 70 : 0), my = (g.H - R * ch) / 2;
      g.text(mx + C * cw / 2, my - 48, T.label, { size: 18, anchor: 'middle', weight: 750, fill: T.color });
      g.matrix(mx, my, T.disp, { cw, ch, rows: T.rows, cols: T.cols, fmt: v => v, size: 18, cell: (a, b) => a === i && b === j ? { fill: fcol(T.color), stroke: T.color, sw: 3, color: T.color } : { op: .5, top: .5 } }); }
    let pdf, lo, hi;
    if (st.dist === 'norm') { const m = prm.mu ?? 0, s = prm.sd ?? 1; pdf = v => ST.normPdf(v, m, s); lo = Math.min(m - 4 * s, x - s); hi = Math.max(m + 4 * s, x + s); }
    else if (st.dist === 't') { pdf = v => ST.tPdf(v, prm.df); lo = Math.min(-5, x - 1); hi = Math.max(5, x + 1); }
    else if (st.dist === 'chi2') { const k = prm.df; pdf = v => ST.gammaPdf(v, k / 2, .5); lo = 0; hi = Math.max(k + 5 * Math.sqrt(2 * k), x * 1.15); }
    else { const pm = st.dist === 'pois' ? k => ST.poisPmf(k, prm.lam) : st.dist === 'nb' ? k => ST.nbPmf(k, prm.mu, prm.phi) : k => ST.binomPmf(k, prm.n, prm.p);
      pdf = pm; const mu = prm.lam ?? prm.mu ?? prm.n * prm.p; lo = 0; hi = Math.max(Math.ceil(mu * 2.6 + 6), x + 3); if (st.dist === 'binom') hi = prm.n; }
    const ymax = disc ? Math.max(...P.range(lo, hi, hi - lo + 1).map(k => pdf(Math.round(k)))) : Math.max(...P.range(lo, hi, 200).map(pdf));
    const ax = g.axes({ x: left, y: 120, w: g.W - left - 80, h: 380, xd: [lo, hi], yd: [0, ymax * 1.15], xt: 6, yt: 3, xl: st.xlabel || 'value', yl: disc ? 'probability' : 'density', size: 17 });
    const sh = P.seg(t, .3, 1), inTail = v => st.tail === 'upper' ? v >= x : st.tail === 'lower' ? v <= x : Math.abs(v) >= Math.abs(x);
    if (disc) { const ks = []; for (let k = Math.ceil(lo); k <= hi; k++) ks.push(k);
      g.bars(ks.map(k => [k, pdf(k)]), ax, { bw: .8, fill: (k) => inTail(k) && sh > 0 ? 'f3' : 'f1', stroke: 'c1' }); }
    else {
      g.area(pdf, ax, lo, hi, { fill: 'f1' });
      if (sh > 0) { if (st.tail !== 'lower') g.area(pdf, ax, st.tail === 'two' ? Math.abs(x) : x, hi, { fill: 'c3', op: .55 * sh });
        if (st.tail !== 'upper') g.area(pdf, ax, lo, st.tail === 'two' ? -Math.abs(x) : x, { fill: 'c3', op: .55 * sh }); }
      g.curve(pdf, ax, lo, hi, { stroke: 'c1', sw: 3, free: true }); }
    const X = ax.sx(x);
    g.line(X, ax.y - 6, X, ax.y + ax.h, { stroke: 'c3', sw: 3, free: true });
    g.text(X, ax.y - 22, `observed ${P.fmt(x)}`, { size: 20, anchor: X > g.W - 180 ? 'end' : 'middle', fill: 'c3', weight: 750 });
    if (sh > .5) g.text(ax.x + ax.w, ax.y + 30, `p = ${P.fmt(st.p, 3)}`, { size: 28, anchor: 'end', weight: 800, fill: 'c3', mono: true });
    if (st.tex) g.tex(g.W / 2, 50, st.tex, { size: 28, w: 900, h: 60 });
  }
})();
