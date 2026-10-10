// Study-page exemplar: facts, abbreviations, angles, questions, a comparison, and one small live figure. Layout 'article'.
Proff.page({ title: 'Testing 20,000 genes at once', sub: 'FDR, Bonferroni and Benjamini–Hochberg', eyebrow: 'study page', layout: 'article' });

Proff.section('the problem in numbers');
Proff.tiles([
  { big: '20,000', h: 'tests', text: 'One p-value per gene in a differential expression run.' },
  { big: '1,000', h: 'false hits', text: 'Expected at p < 0.05 if **no** gene truly changed: 20,000 × 0.05.' },
  { big: '5%', h: 'FDR target', text: 'Of the genes you call, about 1 in 20 may be false. That is what *padj < 0.05* promises.' },
]);

Proff.section('abbreviations');
Proff.compare(['term', 'stands for', 'plain meaning'], [
  ['FWER', 'family-wise error rate', 'Chance of **even one** false hit across all tests.'],
  ['FDR', 'false discovery rate', 'Expected **share** of false hits among the genes you call.'],
  ['BH', 'Benjamini–Hochberg', 'The usual way to control FDR. DESeq2 *padj* uses it.'],
  ['q-value', '—', 'Smallest FDR at which this gene would be called. Close cousin of BH *padj*.'],
]);

Proff.section('see it');
Proff.scene({
  title: 'The BH line on sorted p-values', acc: 4, h: 560,
  controls: [{ name: 'q', label: 'FDR target', min: .01, max: .2, step: .01, value: .05 }, { name: 'real', label: 'truly changed genes', min: 0, max: 40, step: 1, value: 15 }],
  steps: [{ cap: 'The 31 smallest of 200 sorted p-values. Coloured dots: genes that truly changed; grey: no change.' },
    { cap: 'Solid line: rank ÷ 200 × FDR target. Called genes are left of the last dot under it.', info: { notation: { 'p_{(k)}': ['the k-th smallest p-value', 'p₍₁₎ is the leftmost dot'], m: ['number of tests', '200 genes here'], q: ['FDR target', '0.05: about 1 in 20 calls may be false'] }, read: ['BH: find the largest rank k with p₍ₖ₎ ≤ k/m × q, call genes 1…k', 'Bonferroni uses one flat line at q/m, so it calls far fewer'] } },
    { cap: 'Dashed line: Bonferroni, q ÷ 200 for every gene. Only the ringed dots pass it.' }],
  draw(g, k, t, p) {
    const m = 200, r = Proff.rng(5), ps = [];
    for (let i = 0; i < m; i++) { const real = i < p.real; ps.push({ p: real ? Math.pow(r(), 6) * .02 : r(), real }); }
    ps.sort((a, b) => a.p - b.p);
    const ax = g.axes({ x: 110, y: 40, w: 980, h: 400, xd: [0, 32], yd: [0, .06], xt: [1, 5, 10, 15, 20, 25, 30], yt: [0, .02, .04, .06], fmty: v => v.toFixed(2), xl: 'rank (smallest p first)', yl: 'p-value' });
    let kk = 0; ps.forEach((d, i) => { if (d.p <= (i + 1) / m * p.q) kk = i + 1; });
    const bonf = ps.filter(d => d.p <= p.q / m).length, show = ps.slice(0, 31);
    if (k >= 1 && kk) g.rect(ax.sx(.5), ax.y, ax.sx(kk + .5) - ax.sx(.5), ax.h, { fill: 'f4', stroke: 'none', free: true, op: k === 1 ? t : 1 });
    show.forEach((d, i) => g.circle(ax.sx(i + 1), ax.sy(Math.min(d.p, .06)), 7, { fill: d.real ? 'c2' : 'muted', stroke: k >= 2 && d.p <= p.q / m ? 'c3' : 'none', sw: 3, op: d.p > .06 ? .35 : 1, free: true }));   // off-scale p drawn faint at the top
    if (k >= 1) g.fade(k === 1 ? t : 1, g => { const xe = Math.min(32, .06 * m / p.q); g.line(ax.sx(0), ax.sy(0), ax.sx(xe), ax.sy(xe / m * p.q), { stroke: 'c4', sw: 3 });
      g.text(ax.sx(4), ax.y + 20, `BH calls ${kk}`, { size: 24, weight: 800, fill: 'c4', mono: true, halo: true }); });
    if (k >= 2) g.fade(k === 2 ? t : 1, g => { g.line(ax.sx(0), ax.sy(p.q / m), ax.sx(32), ax.sy(p.q / m), { stroke: 'c3', sw: 3, dash: true });
      g.text(ax.sx(4), ax.y + 56, `Bonferroni calls ${bonf}`, { size: 24, weight: 800, fill: 'c3', mono: true, halo: true }); });
  }
});

Proff.section('three angles');
Proff.tiles([
  { tag: 'as a budget', h: 'You buy a list', text: 'FDR is the impurity you accept in the list you hand to the bench. 5% of 400 genes is about 20 duds.' },
  { tag: 'as a ranking', h: 'Order matters, not one p', text: 'BH compares each p-value with its **rank**. The same p = 0.01 may pass in one experiment and fail in another.' },
  { tag: 'as a trade', h: 'Power vs purity', text: 'Bonferroni guards against any false hit and misses real ones. BH accepts a few duds to find many more.' },
]);

Proff.section('test yourself');
Proff.quiz([
  { q: 'A gene has p = 0.003 and padj = 0.08. Is it called at FDR 5%?', a: 'No. The call uses **padj** (BH-adjusted), not the raw p.' },
  { q: 'You filter out low-count genes before testing. Why can that *add* hits?', a: 'Fewer tests (smaller m) lowers the bar each rank must clear. DESeq2 does this automatically (independent filtering).' },
  { q: 'Does FDR 5% mean each called gene is 95% likely to be real?', a: 'Not exactly. It is the expected share of false calls in the **whole list**. Genes near the cutoff are less certain than the top ones.' },
]);
