// Interactive exemplar: what a t-test does with two groups. Layout 'article': no intro text, one big figure first (panels), values you drag, details in the i sidebar.
Proff.page({ title: 'What a t-test sees', sub: 'Two groups of cells, one treated. Is the treated group really higher, or is it noise?', eyebrow: 'interactive', layout: 'article' });

const S = Proff.stat;
// one simulated experiment: control ~ N(5, sd), treated ~ N(5 + diff, sd), n each. Same seed -> same dots while you drag.
function experiment(p, seed) {
  const r = Proff.rng(seed), z = S.normal(r), a = [], b = [];
  for (let i = 0; i < 30; i++) { a.push(z()); b.push(z()); }          // draw 30 always, use first n: dots stay put as n grows
  const A = a.slice(0, p.n).map(v => 5 + v * p.sd), B = b.slice(0, p.n).map(v => 5 + p.diff + v * p.sd);
  const mA = S.mean(A), mB = S.mean(B), sp = Math.sqrt((S.sd(A) ** 2 + S.sd(B) ** 2) / 2), se = sp * Math.sqrt(2 / p.n), t = (mB - mA) / se, df = 2 * p.n - 2;
  return { A, B, mA, mB, sp, se, t, df, p: 2 * tTail(Math.abs(t), df) };
}
function tTail(t, df) { let s = 0; const h = .01; for (let x = t; x < t + 60; x += h) s += S.tPdf(x + h / 2, df) * h; return Math.min(.5, s); }
const fp = p => p < .001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`;

Proff.scene({
  title: 'Signal, noise, and the t statistic', acc: 1, h: 640,
  // one big panel first; at most 2 side by side: when 't' arrives, 'data' (the oldest) retires
  panels: [{ id: 'data', from: 0 }, { id: 'bars', from: 2 }, { id: 't', from: 3 }],
  controls: [
    { name: 'diff', label: 'true effect', min: 0, max: 3, step: .1, value: 1.2 },
    { name: 'sd', label: 'spread (SD)', min: .3, max: 2.5, step: .1, value: 1.2 },
    { name: 'n', label: 'samples per group', min: 3, max: 30, step: 1, value: 6 },
    { type: 'button', name: 'reseed', label: 'new samples' }],
  info: {
    notation: { n: ['samples per group', '6 dots in each group at the start'], SD: ['standard deviation: spread of single samples', 'spread 1.2: most dots sit within ±1.2 of their line'], SE: ['standard error: how much the gap between averages wobbles across repeat experiments', 'the right bar, 0.51 at the start'], t: ['signal ÷ SE', '1.88 ÷ 0.51 ≈ 3.7 at the start'], df: ['degrees of freedom, 2n − 2', 'n = 6 gives df = 10'], p: ['chance of a t this far from 0 if there is no real effect', 'p = 0.004 at the start: rare by luck alone'] },
    try: 'Set **true effect** to 0 and press *new samples* a few times. About 1 time in 20, p drops below 0.05: a false positive.' },
  steps: [
    { cap: 'Each dot is one sample. Thick lines are the group averages.', info: { see: ['One dot per sample', 'Thick line: the group average'], read: ['Drag **spread** and watch the dots scatter'] } },
    { cap: 'The gap between the averages is the **signal**.', info: { see: ['Arrow: the gap between the two averages'] } },
    { cap: '**SE (standard error)**: how much that gap would wobble if you redid the experiment.', info: { see: ['Left bar: the signal', 'Right bar: SE, on the same scale'], read: ['SE = SD × √(2/n): more samples, smaller SE'] } },
    { cap: '**t = signal ÷ SE.** How many wobbles wide the gap is.', info: { see: ['Vertical line: your t'], read: ['t of 2 or more: the gap is at least twice its wobble'] } },
    { cap: 'With no real effect, t would land on this curve. The shaded tails past your t are the **p-value**.', info: { see: ['Curve: where t lands when nothing is going on', 'Shaded tails: the p-value'], read: ['Fewer samples, heavier tails: the same t is less convincing', 'p is not the chance the effect is real'] } }],
  draw(g, k, t, p, s) {
    const e = experiment(p, s.seed), on = j => k > j ? 1 : k === j ? t : 0;
    // panel: the data
    g.panel('data', D => { const A = g.axes({ ...D, xd: [0, 2], yd: [-2, 13], xt: [], yt: [0, 5, 10], grid: true, yl: 'expression' });
    const jit = Proff.rng(3);
    [[e.A, .55, 'c1', 'control', e.mA], [e.B, 1.45, 'c3', 'treated', e.mB]].forEach(([v, cx, c, name, m]) => {
      // sizes in stage units, not data units, so the groups look the same in a wide or a narrow panel
      v.forEach(y => g.circle(A.sx(cx) + (jit() - .5) * 110, A.sy(Proff.clamp(y, -2, 13)), 8, { fill: c, stroke: 'fig', sw: 1.5, op: .85, free: true }));
      g.line(A.sx(cx) - 75, A.sy(m), A.sx(cx) + 75, A.sy(m), { stroke: c, sw: 6, free: true });
      g.text(A.sx(cx), A.y + A.h + 26, name, { size: 20, anchor: 'middle', weight: 700, fill: c });
    });
    if (k >= 1) g.fade(on(1), g => { const x = A.sx(1.45) + 115, y1 = A.sy(e.mA), y2 = A.sy(e.mB);
      g.line(A.sx(.55) + 75, y1, x, y1, { stroke: 'c1', sw: 2, dash: true, free: true }); g.line(A.sx(1.45) + 75, y2, x, y2, { stroke: 'c3', sw: 2, dash: true, free: true });
      if (Math.abs(y1 - y2) > 8) g.arrow(x, y1, x, y2, { stroke: 'c2', sw: 3, head: 10, free: true }); });
    });
    // panel: signal and noise as two bars on the same scale
    g.panel('bars', P => {
      const B = g.axes({ ...P, xd: [0, 2], yd: [0, 4], xt: [], yt: [0, 1, 2, 3, 4], grid: true, yl: 'size' });
      const bar = (cx, v, c, name, val) => { const top = B.sy(Math.min(4, v)); g.rect(B.sx(cx - .32), top, B.sx(.64) - B.sx(0), B.y + B.h - top, { fill: c.replace('c', 'f'), stroke: c, sw: 3, free: true });
        g.text(B.sx(cx), B.y + B.h + 26, name, { size: 20, anchor: 'middle', weight: 700, fill: c });
        g.text(B.sx(cx), Math.max(B.y + 14, top - 20), val, { size: 20, anchor: 'middle', weight: 700, mono: true, fill: c }); };
      bar(.55, Math.abs(e.mB - e.mA), 'c2', 'signal', Proff.fmt(e.mB - e.mA, 2));
      bar(1.45, e.se, 'c4', 'SE', Proff.fmt(e.se, 2));
    });
    // panel: t on the null curve
    g.panel('t', P => {
      const tx = Proff.clamp(e.t, -6.2, 6.2), C = g.axes({ ...P, xd: [-6.5, 6.5], yd: [0, .66], xt: [-6, -3, 0, 3, 6], yt: [], grid: false, xl: 't' });
      g.text(C.x + C.w / 2, C.y + 40, `t = ${Proff.fmt(e.t, 2)}`, { size: 34, anchor: 'middle', weight: 900, fill: 'c2', mono: true });
      if (k >= 4) g.fade(on(4), g => {
        const f = x => S.tPdf(x, e.df), a = Math.abs(tx);
        if (a < 6.4) { g.area(f, C, a, 6.5, { fill: 'f5' }); g.area(f, C, -6.5, -a, { fill: 'f5' }); }
        g.curve(f, C, -6.5, 6.5, { stroke: 'muted', sw: 3 });
        g.text(C.x + C.w / 2, C.y + 90, fp(e.p), { size: 26, anchor: 'middle', weight: 800, fill: 'c5', mono: true });
        g.text(C.x + C.w / 2, C.y + 126, `df = ${e.df}`, { size: 18, anchor: 'middle', fill: 'muted', mono: true });
      });
      g.line(C.sx(tx), C.sy(.44), C.sx(tx), C.y + C.h, { stroke: 'c2', sw: 4, free: true });
      if (Math.abs(e.t) > 6.2) g.text(C.sx(tx) + (e.t > 0 ? -8 : 8), C.sy(.47), e.t > 0 ? 'off scale →' : '← off scale', { size: 16, anchor: e.t > 0 ? 'end' : 'start', fill: 'c2', weight: 700 });
    });
  }
});

Proff.scene({
  title: 'Where the curve comes from', acc: 3, h: 600,
  controls: [{ name: 'runs', label: 'experiments run', min: 200, max: 2000, step: 50, value: 400 }, { name: 'n', label: 'samples per group', min: 3, max: 30, step: 1, value: 6 }],
  steps: [
    { cap: 'Repeat the experiment many times with **no real effect**. Each bar counts the t values that landed there.' },
    { cap: 'The t curve predicts that pile before you run anything.' },
    { cap: 'Past the dashed lines sits 5% of the pile. Calling those "significant" is wrong 1 time in 20.', info: { see: ['Dashed lines: the critical t for α = 0.05, two-sided'], read: ['Any null experiment lands there 5% of the time', 'That is the false-positive rate the 0.05 cutoff buys'] } }],
  info: { notation: { 'α': ['the cutoff for calling a result significant', '0.05: 1 null experiment in 20 lands past the dashed lines'], df: ['degrees of freedom, 2n − 2', 'n = 6 gives df = 10'] }, try: 'Raise **experiments run**: the bars settle onto the curve.' },
  draw(g, k, t, p) {
    const df = 2 * p.n - 2, r = Proff.rng(11), z = S.normal(r), ts = [];
    for (let i = 0; i < p.runs; i++) { let a = 0, b = 0, a2 = 0, b2 = 0; for (let j = 0; j < p.n; j++) { const x = z(), y = z(); a += x; b += y; a2 += x * x; b2 += y * y; }
      const ma = a / p.n, mb = b / p.n, va = (a2 - p.n * ma * ma) / (p.n - 1), vb = (b2 - p.n * mb * mb) / (p.n - 1); ts.push((mb - ma) / Math.sqrt((va + vb) / p.n)); }
    const bw = .25, bins = {}; ts.forEach(v => { if (Math.abs(v) < 6) { const b = Math.floor(v / bw); bins[b] = (bins[b] || 0) + 1; } });
    let crit = 1.5; while (2 * tTail(crit, df) > .05) crit += .005;
    const ax = g.axes({ x: 110, y: 60, w: 980, h: 440, xd: [-6, 6], yd: [0, .45], xt: [-6, -4, -2, 0, 2, 4, 6], yt: [0, .1, .2, .3, .4], yl: 'share of experiments (per unit t)', xl: 't' });
    const out = ts.filter(v => Math.abs(v) > crit).length / ts.length;
    Object.entries(bins).forEach(([b, c]) => { const x0 = +b * bw, h = Math.min(.45, c / ts.length / bw),   /* few runs give spiky bins; keep them inside the axes */ tail = k >= 2 && (x0 >= crit || x0 + bw <= -crit);
      g.rect(ax.sx(x0) + 1, ax.sy(h), ax.sx(bw) - ax.sx(0) - 2, ax.y + ax.h - ax.sy(h), { fill: tail ? 'f5' : 'f1', stroke: tail ? 'c5' : 'c1', sw: 1.5, free: true }); });
    if (k >= 1) g.fade(k === 1 ? t : 1, g => g.curve(x => S.tPdf(x, df), ax, -6, 6, { stroke: 'ink', sw: 3 }));
    if (k >= 2) g.fade(k === 2 ? t : 1, g => { [-crit, crit].forEach(c => g.line(ax.sx(c), ax.y + 40, ax.sx(c), ax.y + ax.h, { stroke: 'c5', sw: 3, dash: true, free: true }));
      g.text(ax.sx(4.4), ax.y + 40, `${(out * 100).toFixed(1)}% beyond`, { size: 24, anchor: 'middle', weight: 800, fill: 'c5', mono: true });
      g.text(ax.sx(4.4), ax.y + 74, `±${crit.toFixed(2)} at df ${df}`, { size: 18, anchor: 'middle', fill: 'muted', mono: true }); });
  }
});
