/* Proff calc engine: replays a calctrace.py trace. Proff.calc(trace, {phase, acc}) adds one scene per operation.
   One cell size for the whole page. Elementwise steps stack input, operator row, and output (G+D); others put inputs side by side
   over the output (grid). The formula and hero always sit in the right-hand column. */
(function () {
  'use strict';
  const P = window.Proff, ST = P.stat;
  const fcol = c => 'f' + c.slice(1);
  const CAP_ALL = 'Same rule for every cell.';

  P.calcFallback = [];
  P.calc = (tr, opt = {}) => {
    const TS = tr.tensors;
    deck.traces.push(tr); deck.v = null;   // every calc on the page shares one cell size (object constancy)
    (tr.warn || []).forEach(w => P.errors.push(w));   // calctrace found a formula it cannot explain: check.py fails
    tr.steps.forEach((st, si) => {
      const n = st.cells.length, k = Math.min(st.expand || 0, n), plan = [];
      for (let c = 0; c < k; c++) plan.push({ one: c });
      if (n > k || !n) plan.push({ rest: k });
      // the sidebar lead keeps the step's own sentence on every step; the stage shows the cells moving
      const steps = plan.map((p, j) => { const o = { cap: j === 0 ? st.cap : `${st.cap} ${p.rest != null ? (st.cap_all || CAP_ALL) : 'Next cell, same rule.'}` };
        if (p.rest != null && n > k && st.op !== 'dist') { const per = P.clamp(16000 / (n - k), 450, 1300); Object.assign(o, { anim: per * (n - k), linear: true, wave: true }); }   // slow wave
        return o; });
      P.scene({ title: st.title, phase: opt.phase || st.phase, labelBudget: 60, wordBudget: 60, acc: opt.acc, steps, info: merge(st.info, explain(st, tr)), anim: st.op === 'show' ? 450 : 1600, w: 1200, h: 675,
        draw: (g, j, t, prm, sc) => st.op === 'dist' ? drawDist(g, st, plan[j], t, TS) : drawOp(g, st, plan[j], t, TS, sc) });
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
      example = `${who ? `**${who}**: ` : ''}${plain ? `${plain} = ` : ''}${signs(c.expr.map(e => e[0]).join(' ').replace(/\s+/g, ' ').trim())}`; }
    // an operator's example is better taken from the figure than made up
    const op = opKeys.find(k => /^\\(sum|prod)/.test(k)) || opKeys.find(k => typeof notation[k] === 'string'); opKeys.filter(k => k !== op && typeof notation[k] === 'string').forEach(k => notation[k] = { is: notation[k], eg: { 'a / b': '6 / 3 = 2', '\\times': '3 × 4 = 12', '\\ln': 'ln 1 = 0', '|a|': '|−3| = 3', 'e^{a}': 'e⁰ = 1', '\\sum': '1 + 2 + 3 = 6', '\\prod': '2 × 3 × 4 = 24' }[k] || '' });
    if (op && example) { notation[op] = { ...(typeof notation[op] === 'string' ? { is: notation[op] } : notation[op]), eg: example.replace(/\*\*/g, '') }; example = null; }   // shown once, under the operator
    return { notation, example };
  }
  function merge(a, b) { if (!b) return a; a = typeof a === 'string' ? { text: a } : (a || {});
    return { ...b, ...a, notation: { ...b.notation, ...(a.notation || {}) }, example: a.example || b.example }; }

  // ---------- formula line: the shown arithmetic; the result is the hero ----------
  // Operands get the precision the shown arithmetic needs to give the shown answer (500 − 493.124 = 6.876), from the trace's
  // full values; display strings in the tables never change. e^x and a^(1/3) are drawn as superscripts, sqrt as √.
  const MED = (...a) => { a = a.slice().sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
  const num = s => Number(String(s).replace(/,/g, '').replace(/[−–]/g, '-'));
  function evalShown(s) {   // the formula as written -> its value, or null if it is not plain arithmetic
    let e = String(s); const w = e.match(/^(.*)\swith\s(\S+)\s=\s(.*)$/); if (w) e = w[1].split(w[2]).join(`(${w[3]})`);
    e = e.replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/sqrt\s*/g, '√').replace(/[−–]/g, '-').replace(/[×·⋅]/g, '*').replace(/÷/g, '/')
      .replace(/log₂/g, 'Math.log2').replace(/log₁₀/g, 'Math.log10').replace(/\bln\b/g, 'Math.log').replace(/\bmedian\b/g, 'MED').replace(/\bmax\b/g, 'Math.max').replace(/\bmin\b/g, 'Math.min')
      .replace(/(\(-?[\d.]+\)|-?[\d.]+)²/g, '(($1)**2)').replace(/\be\^/g, 'Math.E^').replace(/\^/g, '**')
      .replace(/√\s*([\d.]+)/g, 'Math.sqrt($1)').replace(/√\s*\(/g, 'Math.sqrt(').replace(/(?<![A-Za-z\d.])([\d.]+)\s*\(/g, '$1*(');
    if (/[^\d\s.+\-*/(),]/.test(e.replace(/Math\.(E|log2|log10|log|max|min|sqrt)|MED/g, ''))) return null;
    try { const v = Function('MED', `"use strict"; return (${e});`)(MED); return Number.isFinite(v) ? v : null; } catch (err) { return null; }
  }
  function precise(c, TS, kept, hero) {
    const A = num(hero); if (!hero || !Number.isFinite(A)) return kept;
    const dec = (String(hero).split('.')[1] || '').match(/^\d*/)[0].length, tol = .5 * 10 ** -dec * (1 + 1e-9) + 1e-12;
    const ok = parts => { const v = evalShown(parts.map(p => p[0]).join('')); return v != null && Math.abs(v - A) <= tol; };
    if (evalShown(kept.map(p => p[0]).join('')) == null || ok(kept)) return kept;
    const q = {}; (c.reads || []).forEach(r => (q[r[0]] ||= []).push(r));
    const full = kept.map(([t, n]) => { if (!n || !q[n] || !q[n].length || !/^[−-]?[\d,]*\.?\d+$/.test(t.trim())) return null;
      const [, i, j] = q[n].shift(), v = TS[n] && TS[n].data[i] && TS[n].data[i][j]; return typeof v === 'number' ? v : null; });
    // A widened operand keeps its trailing zero when it was rounded (0.3197 -> 0.320, beside 0.456); an exact one keeps its own digits (1.9).
    for (let L = 1; L <= 4; L++) {
      const parts = kept.map(([t, n], k) => { const v = full[k]; if (v == null) return [t, n];
        const s = t.trim(), d0 = (s.split('.')[1] || '').length, body = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d0 && Math.abs(Math.abs(v) - +Math.abs(v).toFixed(d0 + L)) > 1e-12 ? d0 + L : d0, maximumFractionDigits: d0 + L, useGrouping: /,/.test(s) });
        return [t.replace(s, (v < 0 ? (/^−/.test(s) ? '−' : '-') : '') + body), n]; });
      if (ok(parts)) return parts;
    }
    return kept;
  }
  const FS = 30, runW = ([t, , up]) => P.measure(t, { size: up ? FS * .7 : FS, weight: 500, mono: true, boost: false });
  const runWidth = runs => (runs || []).reduce((w, r) => w + runW(r), 0);
  const heroWidth = (s, hs = 72) => s ? P.measure(P.pretty(s), { size: hs, weight: 800, boost: false }) : 0;
  const metrics = () => [P.measure('0.0−×⁻⁶', { size: 72, weight: 800, boost: false }), P.measure('0.0−×⁻⁶', { size: 30, weight: 500, mono: true, boost: false })].map(v => v.toFixed(2)).join('/');
  const RM = 28;   // the right column keeps clear of the stage edge (and the › button)
  const group = chars => { const out = []; for (const c of chars) { const l = out[out.length - 1];
    if (l && l[1] === c.f && !!l[2] === c.up) l[0] += c.x; else out.push([c.x, c.f, c.up]); } return out; };
  // Negative operands read as maths: a + −b -> a − b, a − −b -> a − (−b), a × −b -> a × (−b); 1e-7 -> 1 × 10^−7.
  // Kept only if the rewritten line still evaluates to the same value.
  function signs(s0) {
    const N = '−\\d[\\d,]*(?:\\.\\d+)?';
    let s = s0.replace(/(^|[^\w.])([-−]?\d+(?:\.\d+)?)e([+\-−]?)(\d+)(?![\w.])/g, (_, pre, m, sg, e) => `${pre}${m}×10^${sg && sg !== '+' ? '−' : ''}${+e}`)
      .replace(/(^|[\s(\[,=×÷·+−^])-(?=\.?\d|\()/g, '$1−').replace(/ - /g, ' − ');
    s = s.replace(new RegExp(`([×÷·]\\s*)(${N})(?![\\d.^])`, 'g'), '$1($2)')                       // × −b
      .replace(new RegExp(`([+−×÷]\\s*)(${N})(?=\\s*[×÷·])`, 'g'), '$1($2)')                      // + −a × b
      .replace(new RegExp(`(^|[^^])\\+(\\s*)−(?=\\d)`, 'g'), '$1−$2')                                 // + −b
      .replace(new RegExp(`(^|[^^\\s(])(\\s*)−(\\s*)(${N})(?![\\d.^])`, 'g'), '$1$2−$3($4)');        // − −b
    const a = evalShown(s0), b = evalShown(s);
    return a == null || (b != null && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a))) ? s : s0;
  }
  function formulaModel(c, TS) {
    const expr = c && c.expr; if (!expr || !expr.length) return null;
    if (c._fm && c._fm.key === metrics()) return c._fm;
    const parts = expr.map(([t, n]) => [String(t), n]);
    let end = parts.length;
    if (end >= 2 && parts[end - 1][1] && /=/.test(parts[end - 2][0])) end -= 1;
    let kept = parts.slice(0, end).map(([t, n], i) => [i === end - 1 ? t.replace(/\s*=\s*$/, '') : t, n]);   // only the trailing '=' goes ("with μ = 493" keeps its own)
    while (kept.length && !kept[kept.length - 1][0].trim()) kept.pop();
    const hero = end < parts.length ? parts[parts.length - 1][0].trim() : '';
    kept = precise(c, TS, kept, hero);
    const ch = [];   // characters: numbers ink, the rest muted
    for (const t0 of [signs(kept.map(p => p[0]).join(''))]) { const t = t0.replace(/sqrt\s*/g, '√').replace(/√\s+/g, '√'), re = /([0-9][0-9,]*(?:\.[0-9]+)?)/g; let i = 0, m;
      const push = (s, f) => { for (const x of s) ch.push({ x, f, up: false }); };
      while ((m = re.exec(t))) { if (m.index > i) push(t.slice(i, m.index), 'muted'); push(m[0], 'ink'); i = m.index + m[0].length; }
      if (i < t.length) push(t.slice(i), 'muted'); }
    for (let i = 0; i < ch.length; i++) { if (ch[i].x !== '^') continue;   // ^x, ^(1/3), ^−(a+b) -> superscript
      ch.splice(i, 1); let j = i;
      if (ch[j] && ch[j].x === '(') { let d = 0; for (; j < ch.length; j++) { if (ch[j].x === '(') d++; else if (ch[j].x === ')' && --d === 0) break; }
        if (j < ch.length) { ch.splice(j, 1); ch.splice(i, 1); j -= 1; } }
      else { if (ch[j] && /[−-]/.test(ch[j].x)) j++;
        if (ch[j] && ch[j].x === '(') { let d = 0; for (; j < ch.length; j++) { if (ch[j].x === '(') d++; else if (ch[j].x === ')' && --d === 0) { j++; break; } } }
        else while (ch[j] && /[0-9.,]/.test(ch[j].x)) j++; }
      for (let k = i; k < j && k < ch.length; k++) ch[k].up = true; }
    // break points for a narrow column: before a spaced + or −, after ", "
    const atoms = []; let a = [];
    ch.forEach((c, i) => { const s3 = ch.slice(i, i + 3).map(q => q.x).join('');
      if (a.length && !c.up && (s3 === ' + ' || s3 === ' − ')) { atoms.push(a); a = []; }
      a.push(c); if (c.x === ' ' && i && ch[i - 1].x === ',') { atoms.push(a); a = []; } });
    if (a.length) atoms.push(a);
    const runs = group(ch), A = atoms.map(group);
    return (c._fm = { key: metrics(), runs, atoms: A, hero, width: runWidth(runs), atomMax: Math.max(0, ...A.map(r => runWidth(trimRuns(r)))) });
  }
  function trimRuns(r) { r = r.map(x => [...x]); if (r.length) r[0][0] = r[0][0].replace(/^\s+/, ''); if (r.length) r[r.length - 1][0] = r[r.length - 1][0].replace(/\s+$/, ''); return r.filter(x => x[0]); }
  function wrapLines(m, wrap) {
    if (!(wrap < Infinity)) return [m.runs];
    const lines = []; let cur = [];
    for (const at of m.atoms) { const next = cur.concat(at);
      if (cur.length && runWidth(trimRuns(next)) > wrap) { lines.push(trimRuns(cur)); cur = at; } else cur = next; }
    if (cur.length) lines.push(trimRuns(cur));
    return lines;
  }
  // The right-hand column: formula over the hero, at least GAP clear of the nearest table. null if it cannot fit.
  // Tries, before the deck has to shrink: hero 72 then 64; formula 30, 26, 22; each on one line, then wrapped at + − , .
  const GAP = 48;   // 44 clear of the table box (its last tile keeps a GP margin)
  function formulaFit(st, TS, avail) {
    const ms = (st.cells || []).map(c => formulaModel(c, TS)).filter(Boolean);
    if (!ms.length) return { need: 0, wrap: Infinity, lines: 1, hs: 72, fs: FS };
    avail -= RM + GAP;
    const full = Math.max(...ms.map(m => m.width)), atom = Math.max(...ms.map(m => m.atomMax));
    for (const hs of [72, 64]) {
      const hw = Math.max(...ms.map(m => heroWidth(m.hero, hs)));
      for (const fs of [30, 26, 22]) { const k = fs / FS;
        if (Math.max(full * k, hw, 40) <= avail) return { need: Math.max(full * k, hw, 40) + GAP + RM, wrap: Infinity, lines: 1, hs, fs };
        const wrap = Math.min(avail, 480) / k;   // in 30-unit widths; a wrapped formula keeps a calm column
        if (atom > wrap || hw > avail) continue;
        const ls = ms.map(m => wrapLines(m, wrap)), lines = Math.max(...ls.map(l => l.length));
        if (lines <= 4) return { need: Math.max(hw, ...ls.flat().map(r => runWidth(r) * k)) + GAP + RM, wrap, lines, hs, fs };
      }
    }
    return null;
  }
  // x of the column centre: the free space right of the table, past the gap
  const colX = (tableRight, W) => (tableRight + GAP + W - RM) / 2;
  function drawFormula(g, geo, cell, TS, heroOp) {
    const m = formulaModel(cell, TS); if (!m || !geo.fc) return;
    const fs = geo.fc.fs || FS, pitch = fs * 52 / FS;
    const L = geo.fc.lines, hy = geo.y0 + geo.height / 2 + 30 + (L - 1) * pitch / 2, ls = wrapLines(m, geo.fc.wrap);
    ls.forEach((r, l) => g.runs(geo.hx, hy - 96 - (ls.length - 1 - l) * pitch, r, { size: fs, weight: 500, fx: 1 }));
    if (m.hero && heroOp > .01) g.fade(heroOp, () => g.hero(geo.hx, hy, m.hero, { size: geo.fc.hs }));
  }

  function opGlyph(sym) {
    const s = String(sym || '').trim(), m = s.match(/^(÷|×|\+|−|-|·|log₂|log2|exp|√|ReLU|Σ)/);
    if (!m) return (s.split(/\s+/)[0] || '');
    return m[1] === 'log2' ? 'log₂' : m[1];
  }
  function scalarText(sym) {
    const s = String(sym || ''); if (/log|·|⋅/i.test(s)) return null;
    const m = s.match(/([0-9][0-9,]*(?:\.[0-9]+)?)/); return m ? m[1] : null;
  }
  // Stacked G+D only for one input plus an output (ewise/map). A second full matrix goes on the top row of the grid instead.
  function stackSpec(st, TS) {
    if (st.op !== 'ewise' && st.op !== 'map') return null;
    const items = (st.layout || []).filter(it => it != null);
    const tensors = items.filter(it => typeof it === 'object');
    const words = items.filter(it => typeof it === 'string');
    if (tensors.length < 2) return null;
    const outItem = tensors.find(it => it.t === st.out) || tensors[tensors.length - 1];
    const inputs = tensors.filter(it => it !== outItem);
    if (inputs.length !== 1) return null;
    const inn = inputs[0], Tin = TS[inn.t], Tout = TS[outItem.t];
    if (!Tin || !Tout) return null;
    const C = Tin.data[0].length;
    if (inn.right) { const R = TS[inn.right]; if (!(R && R.data.length === 1 && R.data[0].length === C)) return null; }
    if (inn.below) { const B = TS[inn.below]; if (!(B && B.data.length === 1 && (B.data[0].length === C || B.data[0].length === 1))) return null; }
    const opStr = words.find(s => s.trim() !== '=') || inn.sym || '';
    return { kind: 'stack', inn, outItem, opStr, below: inn.below || null, scalar: inn.below ? null : scalarText(opStr), glyph: opGlyph(inn.sym || opStr) };
  }
  function columnSpec(st, TS) {
    if (st.op !== 'reduce') return null;
    const inn = (st.layout || []).find(it => it && typeof it === 'object' && it.below);
    if (!inn || !TS[inn.t] || !TS[inn.below]) return null;
    const B = TS[inn.below], C = TS[inn.t].data[0].length;
    if (!(B.data.length === 1 && (B.data[0].length === C || B.data[0].length === 1))) return null;
    return { kind: 'column', inn, outItem: null, opStr: inn.sym || '', below: inn.below, scalar: null, glyph: opGlyph(inn.sym || 'Σ') };
  }

  // ---------- deck geometry: one cell size for every step of every calc on the page ----------
  // Rows 56 (CPM look) down to 40; values never below 20. The first rung at which every step fits wins.
  const GP = 4, RUNGS = [[56, 26], [52, 26], [48, 24], [44, 22], [40, 20]];
  const titleOf = T => (T.label || '') + (T.unit ? ` (${T.unit})` : '');
  const sameRows = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
  const mopt = (T, D, x = {}) => ({ ch: D.ch, cw: D.cw, size: D.size, lock: true, chMin: 36, sizeMin: 20, fmt: v => v, values: T.data, heat: T.heat ?? true, ...x });
  const deck = { traces: [], v: null };
  function needCW(st, TS, D) {
    const spec = stackSpec(st, TS) || columnSpec(st, TS), names = new Map();
    (st.layout || []).forEach(it => { if (it && typeof it === 'object') { [it.t, it.right].forEach(n => n && names.set(n, D.size)); if (it.below) names.set(it.below, spec ? D.size - 2 : D.size); } });
    if (st.out && !names.has(st.out)) names.set(st.out, D.size);
    let w = 0;
    names.forEach((size, n) => { const T = TS[n]; if (T) w = Math.max(w, P.matrixMetrics(T.disp, mopt(T, D, { size, cw: 0 })).minCW); });
    if (spec && spec.scalar) w = Math.max(w, P.measure(spec.scalar, { size: D.size - 2, weight: 800, boost: false }) + 20);
    return Math.ceil(w);
  }
  // A step too tall even at the smallest rung is split over its two clicks: inputs + first cell, then the output fill.
  // It does not drag the rest of the deck down.
  function fitStep(g, st, TS, D, part) {
    const spec = part === 'out' ? null : stackSpec(st, TS) || columnSpec(st, TS);
    return spec ? computeGD(g, st, TS, spec, D, part) : computeGrid(g, st, TS, D, part);
  }
  function deckGeo(g) {
    const key = g.W + ':' + g.H + ':' + metrics(); if (deck.v && deck.v.key === key) return deck.v;   // fonts can settle after the first layout
    const all = deck.traces.flatMap(tr => tr.steps.filter(st => st.op !== 'dist').map(st => ({ st, TS: tr.tensors })));
    const rung = ([ch, size]) => { const D = { ch, size }; D.cw = Math.max(Math.round(124 * ch / 56), ...all.map(({ st, TS }) => needCW(st, TS, D))); return D; };
    const Dmin = rung(RUNGS[RUNGS.length - 1]), split = new Set(all.filter(({ st, TS }) => !fitStep(g, st, TS, Dmin)).map(x => x.st));
    let v = null;
    for (const r of RUNGS) {
      const D = rung(r), geo = new Map(), bad = [];
      for (const { st, TS } of all) {
        if (split.has(st)) { const a = fitStep(g, st, TS, D, 'in'), b = fitStep(g, st, TS, D, 'out'); if (a && b) geo.set(st, { split: true, in: a, out: b }); else bad.push(st); }
        else { const x = fitStep(g, st, TS, D); if (x) geo.set(st, x); else bad.push(st); } }
      v = { key, D, geo, bad, split }; if (!bad.length) break;
    }
    return (deck.v = v);
  }
  // for checking: which steps fail at each rung (split steps are tried split), and the size in use
  P.calcGeo = title => { const v = deckGeo({ W: 1200, H: 675 }); for (const [st, x] of v.geo) if (st.title === title) return { ...x, parts: undefined }; };   // for checking
  P.calcRungs = () => { const g = { W: 1200, H: 675 }, v = deckGeo(g); return { use: v.D, split: [...v.split].map(st => st.title), rungs: RUNGS.map(([ch, size]) => {
    const D = { ch, size, cw: v.D.cw * ch / v.D.ch }; return [ch, deck.traces.flatMap(tr => tr.steps.filter(st => st.op !== 'dist' && !v.split.has(st) && !fitStep(g, st, tr.tensors, D)).map(st => st.title))]; }) }; };

  // G+D: the input on top, its divisor/multiplier row under it (operator at the left), a rule, the output below; formula + hero on the right.
  function computeGD(g, st, TS, spec, D, part) {
    const Tin = TS[spec.inn.t], C = Tin.data[0].length, R = Tin.data.length;
    const Tout = spec.kind === 'stack' && part !== 'in' ? TS[spec.outItem.t] : null, Ro = Tout ? Tout.data.length : 0, { ch, cw, size } = D;
    const glyphW = spec.glyph ? P.measure(spec.glyph, { size: 30, weight: 500, mono: true, boost: false }) + 24 : 0;   // clear of the column band's 8-unit peek
    const inM = P.matrixMetrics(Tin.disp, mopt(Tin, D, { rows: Tin.rows, cols: Tin.cols, title: titleOf(Tin) }));
    const outTop = Tout ? P.matrixMetrics(Tout.disp, mopt(Tout, D, { title: titleOf(Tout) })).top : 0;
    for (const mode of spec.below ? ['tensor'] : spec.scalar ? ['scalar', 'none'] : ['none']) {
      const labW = Math.max(inM.lab, mode === 'none' ? 0 : glyphW), visualW = C * cw - GP, xMin = labW + 8;
      const fc = formulaFit(st, TS, g.W - xMin - visualW); if (!fc) continue;
      const xMax = g.W - fc.need - visualW; if (xMax < xMin - .5) continue;
      const x = Math.min(Math.max(labW + 134, xMin), xMax);
      const opH = mode === 'none' ? 0 : ch, gap = mode === 'none' ? 0 : 16, block = Tout ? 48 : 0;
      const height = inM.top + R * ch + gap + opH + block + outTop + Ro * ch, y0 = (g.H - height) / 2;
      if (y0 < 2) continue;
      const tableRight = x + visualW;
      return { kind: 'gd', part, mode, cw, ch, size, x, y0, labW, height, tableRight, C, R, Ro, fc, glyph: spec.glyph, scalar: spec.scalar,
        hx: colX(tableRight, g.W), inTop: inM.top, headerH: inM.headerH, opH, gap, block, outTop };
    }
    return null;
  }
  // Grid: every other step. Inputs side by side on the top row with the operator between them, a rule, the output centred below;
  // formula + hero in the right-hand column. A show step is the top row alone, centred.
  // A mono "·" at operator size is a speck; draw the dot product's dot in the sans face, larger and bold.
  const opStyle = op => /^[·⋅]$/.test(op) ? { size: 52, weight: 800, mono: false, boost: false } : { size: 30, weight: 500, mono: true, boost: false };
  function opText(raw, st, a, b) {
    const s = String(raw ?? '').trim(); if (s) return s.length <= 3 ? s.replace(/^-$/, '−') : '';
    const e = st.cells && st.cells[0] && st.cells[0].expr; if (!e) return '';
    const ia = e.findIndex(p => p[1] === a); if (ia < 0) return '';
    let txt = ''; for (let k = ia + 1; k < e.length && e[k][1] !== b; k++) { if (e[k][1]) return ''; txt += e[k][0]; }
    txt = txt.trim(); return /^[×÷+−\-·]$/.test(txt) ? txt.replace('-', '−') : '';
  }
  function gridSpec(st, TS) {
    const out = st.op === 'show' ? null : st.out, top = [];
    let outName = null, op = null;
    const add = t => { if (!TS[t]) return; if (top.length) top.push({ op: opText(op, st, top[top.length - 1].t, t) }); top.push({ t }); op = null; };
    for (const it of st.layout || []) {
      if (it == null) continue;
      if (typeof it === 'string') { if (it.trim() !== '=') op = it; continue; }
      if (it.t === out) { outName = it.t; op = null; continue; }
      add(it.t);
      if (it.right) { op = it.sym ?? ''; add(it.right); }
      if (it.below) { op = it.sym ?? ''; add(it.below); }
    }
    return { top, out: outName };
  }
  function computeGrid(g, st, TS, D, part) {
    const sp = part === 'out' ? { top: [{ t: st.out }], out: null } : gridSpec(st, TS); if (part === 'in') sp.out = null;
    if (!sp.top.length || !TS[sp.top[0].t]) return null;
    const { ch, cw } = D, firstRows = TS[sp.top[0].t].rows, parts = [];
    let x = 0, maxTop = 0, Rmax = 0;
    sp.top.forEach((p, idx) => {
      if (p.op != null) { const w = p.op ? P.measure(p.op, opStyle(p.op)) : 0;
        parts.push({ op: p.op, x: x + 16 + w / 2 }); x += p.op ? w + 32 : 44; return; }
      const T = TS[p.t], rows = idx === 0 || !sameRows(T.rows, firstRows) ? T.rows : null;
      const m = P.matrixMetrics(T.disp, mopt(T, D, { rows, cols: T.cols, title: titleOf(T) }));
      const q = { t: p.t, rows, m, x: x + m.lab, R: T.data.length, C: T.data[0].length }; parts.push(q);
      x = q.x + q.C * cw - GP; maxTop = Math.max(maxTop, m.top); Rmax = Math.max(Rmax, q.R);
    });
    const L0 = parts.find(p => p.t).x, R0 = x;
    let out = null;
    if (sp.out) { const T = TS[sp.out], m = P.matrixMetrics(T.disp, mopt(T, D, { rows: T.rows, cols: T.cols, title: titleOf(T) })), C = T.data[0].length;
      out = { t: sp.out, rows: T.rows, m, R: T.data.length, C, x: (L0 + R0) / 2 - (C * cw - GP) / 2 }; }
    const left = Math.min(0, out ? out.x - out.m.lab : 0), right = Math.max(R0, out ? out.x + out.C * cw - GP : 0), bw = right - left;
    const height = maxTop + Rmax * ch + (out ? 48 + out.m.top + out.R * ch : 0), y0 = (g.H - height) / 2;
    if (y0 < 2) return null;
    let ox, fc = null;
    if (st.op === 'show' || !st.cells.length) { if (bw > g.W - 16) return null; ox = (g.W - bw) / 2 - left; }
    else { fc = formulaFit(st, TS, g.W - 8 - bw); if (!fc) return null;
      const bl = Math.min(134, g.W - fc.need - bw); if (bl < 8 - .5) return null; ox = bl - left; }
    return { kind: 'grid', parts, out, ox, y0, maxTop, Rmax, height, ch, cw, size: D.size, fc, L0, R0, hx: colX(ox + right, g.W) };
  }

  // ---------- which cells are done, which one is live ----------
  // First-cell click: reads, then the cell (eased). Next click: a slow wave, one cell per slot of linear time: reads and formula
  // switch at the start of the slot, the cell fills and the hero shows at 55 %. A finished step shows its worked example
  // (first cell), or the cell the reader is inspecting (sc.inspect).
  function stateOf(st, pl, t, sc) {
    const n = st.cells.length; let live = null, done = 0, showRead = 1, showOut = 1, heroOp = 1;
    if (pl.one != null) { live = st.cells[pl.one]; done = pl.one; showRead = P.seg(t, 0, .25); showOut = P.seg(t, .7, .95); }
    else if (n) {
      if (t >= 1) done = n;
      else { const f = (n - pl.rest) * t, c = Math.min(n - 1, pl.rest + Math.floor(f)); done = c; live = st.cells[c]; showOut = heroOp = P.seg(f - Math.floor(f), .55, .62); }
    }
    const complete = n > 0 && done >= n;
    if (complete) live = st.cells[sc && sc.inspect != null && st.cells[sc.inspect] ? sc.inspect : 0];
    const isDone = (i, j) => { for (let c = 0; c < done; c++) { const o = st.cells[c].out; if (o[0] === i && o[1] === j) return true; } return false; };
    return { live, complete, isDone, reads: new Set((live ? live.reads : []).map(r => r.join(':'))), outCell: live ? live.out.join(':') : null, showRead, showOut, heroOp };
  }
  function cellLook(st, TS, name, i, j, s) {
    // A show step has no formula, so nothing is "read" unless the author marks it.
    if (st.op === 'show') {
      const a = st.active;
      if (a && a[0] === name && a[1] === i && a[2] === j) return { state: 'active' };
      if ((st.mark || []).some(m => m[0] === name && m[1] === i && m[2] === j)) return { state: 'read' };
      return { state: 'input' };
    }
    const isOut = name === st.out;
    if (isOut) {
      if (s.outCell === `${i}:${j}`) return { state: s.showOut > .01 ? 'active' : 'pending', text: s.showOut > .5 ? TS[name].disp[i][j] : '', top: s.showOut };
      return { state: s.isDone(i, j) ? 'filled' : 'pending' };
    }
    return { state: s.reads.has(`${name}:${i}:${j}`) && s.showRead > .1 ? 'read' : 'input' };
  }
  function paintMatrix(g, T, name, x, y, geo, st, s, extra, TS) {
    const M = g.matrix(x, y, T.disp, { cw: geo.cw, ch: geo.ch, lock: true, chMin: 36, sizeMin: 20, size: extra.small ? geo.size - 2 : geo.size, rows: extra.rows, cols: extra.cols, colFill: extra.colFill || undefined, title: extra.title,
      fmt: v => v, values: T.data, heat: T.heat ?? true, progress: s.showOut,
      cell: (i, j) => extra.cell ? extra.cell(i, j) : cellLook(st, TS, name, i, j, s) });
    if (name === st.out && s.complete) st.cells.forEach((c, k) => { const p = M.pos(c.out[0], c.out[1]); g.hit(p.x, p.y, p.tw, p.th, k); });   // inspect targets
    return M;
  }
  function drawGD(g, st, s, TS, spec, geo) {
    const live = s.live, Tin = TS[spec.inn.t], x = geo.x, yIn = geo.y0 + geo.inTop;
    const col = live ? live.out[1] : null;
    // user (2026-10-15): no filled column band (orange over near-black reads brown). The read column gets an orange header and a bar under it.
    const band = () => {};
    if (col != null) {
      const wide = (disp, size) => Math.max(0, ...[].concat(...disp).map(v => P.measure(v == null ? '' : String(v), { size, weight: 800, boost: false })));
      const textW = Math.max(wide(Tin.disp, geo.size), geo.mode === 'scalar' ? P.measure(spec.scalar, { size: geo.size - 2, weight: 800, boost: false }) : 0,
        geo.mode === 'tensor' ? wide(TS[spec.below].disp, geo.size - 2) : 0, spec.kind === 'stack' ? wide(TS[spec.outItem.t].disp, geo.size) : 0);
      // An 8-unit peek is the example. A snug number needs the band to stop before the next column's text.
      const pad = Math.max(0, Math.min(8, (geo.cw - textW) / 2 - 12));
      const tileX = x + col * geo.cw; let bx = tileX - pad, bw = geo.cw - GP + 2 * pad;
      if (Tin.rows && bx < x - 2) { bw -= (x - 2) - bx; bx = x - 2; }
      const yOp = yIn + geo.R * geo.ch + geo.gap;
      const headerTop = Tin.cols && geo.headerH ? yIn - 12 - geo.headerH : yIn;
      if (Tin.cols && geo.headerH) g.rect(tileX + 10, yIn - 8, geo.cw - GP - 20, 3, { fill: 'c2', r: 1.5, stroke: 'none', free: true, deco: true });
      if (spec.kind === 'stack' && geo.part !== 'in') { const yOut = yOp + geo.opH + geo.block + geo.outTop; band(bx, yOut - 6, bw, geo.Ro * geo.ch + 8); }
    }
    paintMatrix(g, Tin, spec.inn.t, x, yIn, geo, st, s, { rows: Tin.rows, cols: Tin.cols, title: titleOf(Tin), colFill: col != null ? j => j === col ? 'c2' : 'muted' : null }, TS);
    const yOp = yIn + geo.R * geo.ch + geo.gap;
    if (geo.mode === 'tensor') {
      const B = TS[spec.below];
      if (spec.glyph) g.text(x - 24, yOp + (geo.ch - GP) / 2, spec.glyph, { size: 30, boost: false, anchor: 'end', weight: 500, fill: 'muted', mono: true });
      paintMatrix(g, B, spec.below, x, yOp, geo, st, s, { small: true, cell: (i, j) => spec.below === st.out ? cellLook(st, TS, spec.below, i, j, s) : (live && live.out[1] === j && s.showRead > .1 ? { state: 'read' } : { state: 'input' }) }, TS);
    } else if (geo.mode === 'scalar') {
      if (spec.glyph) g.text(x - 24, yOp + (geo.ch - GP) / 2, spec.glyph, { size: 30, boost: false, anchor: 'end', weight: 500, fill: 'muted', mono: true });
      const row = [Array.from({ length: geo.C }, () => spec.scalar)];
      g.matrix(x, yOp, row, { cw: geo.cw, ch: geo.ch, lock: true, chMin: 36, sizeMin: 20, size: geo.size - 2, fmt: v => v, heat: true, values: row.map(r => r.map(t => Number(String(t).replace(/,/g, '')))),
        cell: (i, j) => live && live.out[1] === j && s.showRead > .1 ? { state: 'read' } : { state: 'input' } });
    }
    if (spec.kind === 'stack' && geo.part !== 'in') {
      const yAfter = yOp + geo.opH, yRule = yAfter + geo.block / 2 - 2, yOut = yAfter + geo.block + geo.outTop;
      g.line(x, yRule, x + geo.C * geo.cw - GP, yRule, { stroke: 'ink', sw: 2, op: .5, free: true });
      const Tout = TS[spec.outItem.t];
      paintMatrix(g, Tout, spec.outItem.t, x, yOut, geo, st, s, { title: titleOf(Tout) }, TS);
    }
    drawFormula(g, geo, live, TS, s.heroOp);
  }
  function drawGrid(g, st, s, TS, geo) {
    const { ox, ch, cw } = geo, cellTop = geo.y0 + geo.maxTop, first = geo.parts.find(p => p.t);
    for (const p of geo.parts) {
      if (p.op != null) { if (p.op) g.text(ox + p.x, cellTop + (first.R * ch - GP) / 2, p.op, { ...opStyle(p.op), fill: 'muted', anchor: 'middle' }); continue; }
      const T = TS[p.t];
      // Same read-column cue as the stacked layout: orange header and a bar under it, when this table is read down one column.
      const rd = s.showRead > .1 && s.live ? (s.live.reads || []).filter(r => r[0] === p.t) : [], cols = new Set(rd.map(r => r[2]));
      const col = rd.length && cols.size === 1 && T.data[0].length > 1 ? rd[0][2] : null;
      if (col != null) g.rect(ox + p.x + col * cw + 10, cellTop - 8, cw - GP - 20, 3, { fill: 'c2', r: 1.5, stroke: 'none', free: true, deco: true });
      paintMatrix(g, T, p.t, ox + p.x, cellTop, geo, st, s, { rows: p.rows, cols: T.cols, title: titleOf(T), colFill: col != null ? j => j === col ? 'c2' : 'muted' : null }, TS);
    }
    if (geo.out) { const o = geo.out, T = TS[o.t], yAfter = cellTop + geo.Rmax * ch;
      g.line(ox + Math.min(geo.L0, o.x), yAfter + 22, ox + Math.max(geo.R0, o.x + o.C * cw - GP), yAfter + 22, { stroke: 'ink', sw: 2, op: .5, free: true });
      paintMatrix(g, T, o.t, ox + o.x, yAfter + 48 + o.m.top, geo, st, s, { rows: o.rows, cols: T.cols, title: titleOf(T) }, TS); }
    if (st.op !== 'show') drawFormula(g, geo, s.live, TS, s.heroOp);
  }

  // ---------- one operation ----------
  function drawOp(g, st, pl, t, TS, sc) {
    const dk = deckGeo(g); let geo = dk.geo.get(st);
    if (geo && geo.split) geo = pl.rest != null ? geo.out : geo.in;   // split step: first click(s) inputs, the wave the output
    if (!geo) { if (st.title && !P.calcFallback.includes(st.title)) P.calcFallback.push(st.title); return; }
    const s = stateOf(st, pl, t, sc);
    if (geo.kind === 'gd') drawGD(g, st, s, TS, stackSpec(st, TS) || columnSpec(st, TS), geo); else drawGrid(g, st, s, TS, geo);
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
