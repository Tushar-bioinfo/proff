// Visual page: one live figure. Layout 'article'.
Proff.page({ title: 'Testing 20,000 genes at once', sub: 'FDR, Bonferroni and Benjamini–Hochberg', eyebrow: 'study page', layout: 'article' });

Proff.scene({
  title: 'The BH line on sorted p-values', acc: 4, h: 675,
  controls: [{ name: 'q', label: 'FDR target', min: .01, max: .2, step: .01, value: .05 }, { name: 'real', label: 'truly changed genes', min: 0, max: 40, step: 1, value: 15 }],
  info: { notation: { 'p_{(k)}': ['the k-th smallest p-value', 'p₍₁₎ is the leftmost dot'], k: ['rank, smallest p first', 'k = 1 is the leftmost dot'], m: ['number of tests', '200 genes here'], q: ['FDR target', '0.05: about 1 in 20 calls may be false'], FDR: ['false discovery rate: expected share of false calls in the list', '5% of 400 calls is about 20 duds'] } },
  steps: [
    { title: 'Real changes sit at tiny p-values.', cap: 'The smallest of 200 sorted p-values, log rank against log p. Filled dots: genes that truly changed. Open dots: no change.',
      info: { see: ['Both axes are log scale', 'Triangles in the bottom lane: p below 10⁻⁶'], read: ['Each tick step down is 10× smaller p', 'If no gene changed, 20,000 tests at p < 0.05 still give about 1,000 hits (20,000 × 0.05)'] } },
    { title: 'BH calls up to the last crossing.', cap: 'The BH line k/m × q is straight on log-log axes. Find the last dot under it; every gene up to that rank is called.',
      info: { see: ['Orange: the genes BH calls', 'Orange ring: a call on a gene that did not change'], read: ['A dot above the line still counts if a later dot is under it', 'BH (Benjamini–Hochberg) controls FDR; DESeq2 padj uses it'] } },
    { title: "Bonferroni’s flat bar calls fewer.", cap: 'Bonferroni uses one flat bar at q/m for every gene. Only dots under it are called.',
      info: { see: ['Blue dashed bar: q/m', 'Orange: the genes Bonferroni calls'], read: ['Bonferroni controls the chance of even one false call', 'Both start at q/m for rank 1; BH rises, Bonferroni stays flat'] } }],
  draw(g, k, t, p) {
    const m = 200, r = Proff.rng(5), ps = [];
    for (let i = 0; i < m; i++) { const real = i < p.real; ps.push({ p: real ? Math.pow(r(), 6) * .02 : r(), real }); }
    ps.sort((a, b) => a.p - b.p);
    let kk = 0; ps.forEach((d, i) => { if (d.p <= (i + 1) / m * p.q) kk = i + 1; });
    const bonf = ps.filter(d => d.p <= p.q / m).length;
    const on = (j) => k > j ? 1 : k === j ? t : 0;
    // Log axis: 10⁻⁶ … 1 holds where BH and Bonferroni decide; smaller p-values go to the lane below, marked, not clamped.
    // Log-log: the BH line k·q/m is straight (slope 1) and Bonferroni q/m flat. Two fixed rank ranges only.
    const xmax = kk + 3 > 32 ? 50 : 32, R = xmax > 32 ? 7 : 8;
    const ax = g.axes({ x: 110, y: 70, w: 790, h: 500, xd: [0.85, xmax * 1.05], xlog: true, yd: [1e-6, 1], ylog: true, yt: [1e-6, 1e-4, 1e-2, 1],
      xt: [1, 2, 5, 10, 20, 50].filter(v => v <= xmax), fmtx: v => String(v), below: '< 10^{−6}', xl: 'rank', yl: 'p-value' });
    const label = (y, word, tex, fill) => { const r0 = g.note(RX, y, word, { fill }); g.note(r0.x1 + 14, y, tex, { fill, tex: true }); };   // words in Inter, formula in KaTeX
       // the column right of the plot: legend, line labels, hero
    const RX = 930;   // the column right of the plot: legend, line labels, hero
    const bhAt = x => x / m * p.q;
    if (k >= 1) {
      g.fade(k === 1 ? on(1) : 1, g => {
        g.poly(Proff.range(1, xmax, 2).map(x => [ax.sx(x), ax.sy(bhAt(x))]), { stroke: 'ink', sw: 3 });
        label(ax.sy(bhAt(xmax)), 'BH line', 'kq/m');
        if (kk && k === 1) g.line(ax.sx(kk), ax.sy(bhAt(kk)), ax.sx(kk), ax.y + ax.h, { stroke: 'muted', sw: 2, dash: true, free: true });
      });
    }
    if (k === 2) g.fade(t, g => {
      g.line(ax.x, ax.sy(p.q / m), ax.x + ax.w, ax.sy(p.q / m), { stroke: 'c1', sw: 3, dash: '10 7' });
      label(ax.sy(p.q / m), 'Bonferroni', 'q/m', 'c1');
    });
    const called = i => k === 1 ? i < kk : k === 2 ? ps[i].p <= p.q / m : false;
    ps.slice(0, xmax - 1).forEach((d, i) => {
      const c = called(i), col = c ? 'c2' : null;
      ax.pt(i + 1, d.p, d.real ? { r: R, fill: col || 'ink' } : { r: R - 1, fill: 'fig', stroke: col || 'muted', sw: c ? 3 : 2.5 });
    });
    if (k < 2) {   // legend: shape carries the meaning, so it reads without colour
      g.circle(RX + 8, 84, 8, { fill: 'ink', stroke: 'none', free: true }); g.note(RX + 30, 84, 'truly changed');
      g.circle(RX + 8, 120, 7, { fill: 'fig', stroke: 'muted', sw: 2.5, free: true }); g.note(RX + 30, 120, 'no change');
    }
    if (k >= 1) {
      g.note(RX, 458, k === 1 ? 'BH calls' : 'Bonferroni calls');
      const n = String(k === 1 ? kk : bonf), hr = g.hero(RX, 538, n, { size: 72, anchor: 'start' });
      if (k === 2) g.note(hr.x1 + 24, 546, `vs BH ${kk}`, { fill: 'muted' });   // the BH count, for comparison, beside the hero
    }
  }
});
