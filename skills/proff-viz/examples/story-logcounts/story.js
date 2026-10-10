// Static story exemplar: matplotlib plots (plot.py) with native annotations placed in data units. No controls; steps reveal one point each.
const F = PROFF_DATA.facts;
Proff.page({ title: 'Why counts get logged', sub: `${F.n_genes.toLocaleString()} simulated genes × 6 samples`, eyebrow: 'data story' });
const pop = (k, j, t) => k > j ? 1 : k === j ? t : 0;

Proff.scene({
  title: 'Most genes are rare; a few are huge', acc: 1,
  info: `Genes with 0 reads (${F.zeros} here) cannot sit on a log axis, so they are not drawn; they are counted in the percentage.`,
  steps: ['Reads per gene in one sample. The x axis is logged so the shape fits.',
    `**${Math.round(F.frac_under_100 * 100)}%** of genes get fewer than 100 reads.`,
    `One gene gets **${F.max.toLocaleString()}**. On a plain scale, it would flatten everything else.`],
  draw(g, k, t) {
    const [A] = g.svgfile('hist', 0, 0, 1200, 675);
    if (k >= 1) g.fade(pop(k, 1, t), g => { const yb = A.sy(F.hist_top * 1.08); g.brace(A.sx(1), yb, A.sx(100), yb, `${Math.round(F.frac_under_100 * 100)}% of genes`, { stroke: 'c2', fill: 'c2', size: 22 }); });
    if (k >= 2) g.fade(pop(k, 2, t), g => g.label(A.sx(F.max) - 30, A.y + A.h * .45, `max ${F.max.toLocaleString()}`, { to: [A.sx(F.max), A.y + A.h - 6], size: 22, anchor: 'end', weight: 700, fill: 'c3', lc: 'c3' }));
  }
});

Proff.scene({
  title: 'Noise grows faster than the mean', acc: 6,
  steps: ['Each dot is a gene: its average and its variance across 6 samples.',
    'If reads were pure sampling noise (**Poisson**), variance would equal the mean.',
    'Real counts sit higher: **variance = mean + φ × mean²**. φ is the extra biological spread.'],
  info: { notation: { 'φ': ['dispersion of the negative binomial model in DESeq2 and edgeR', `${F.phi} here: variance = mean + ${F.phi} × mean²`] }, read: ['At high counts the φ × mean² part dominates', '10× more reads, about 100× more variance'] },
  draw(g, k, t) {
    const [A] = g.svgfile('meanvar', 0, 0, 1200, 675);
    if (k >= 1) g.fade(pop(k, 1, t), g => g.label(A.sx(3e3), A.sy(3e3) + 70, 'Poisson', { to: [A.sx(3e3), A.sy(3e3) + 4], size: 22, weight: 800, anchor: 'middle', fill: 'c4', lc: 'c4', halo: true }));
    if (k >= 2) g.fade(pop(k, 2, t), g => g.label(A.sx(30), A.sy(5e5), 'mean + φ·mean²', { to: [A.sx(1.4e3), A.sy(1.4e3 + F.phi * 1.4e3 ** 2)], size: 22, weight: 800, anchor: 'middle', fill: 'c6', lc: 'c6', halo: true }));
  }
});

Proff.scene({
  title: 'After log₂(count + 1), spread is level', acc: 5,
  steps: ['Same genes after taking log₂(count + 1). Now plot the SD instead of the variance.',
    `Above ~5 on this scale the SD stays near **${F.flat_sd.toFixed(2)}**, whatever the mean.`,
    'Low counts stay noisy: log cannot fix too few reads. Tools like DESeq2 shrink these.'],
  draw(g, k, t) {
    const [A] = g.svgfile('logsd', 0, 0, 1200, 675);
    if (k >= 1) g.fade(pop(k, 1, t), g => g.text(A.sx(13), A.sy(F.flat_sd) - 40, `SD ≈ ${F.flat_sd.toFixed(2)}`, { size: 24, weight: 800, anchor: 'middle', fill: 'c6', halo: true }));
    if (k >= 2) g.fade(pop(k, 2, t), g => { g.rect(A.sx(0.05), A.y + 4, A.sx(4) - A.sx(0.05), A.h - 8, { fill: 'none', stroke: 'c3', sw: 3, dash: true, free: true });
      g.text(A.sx(2), A.y + 30, 'low counts', { size: 22, weight: 800, anchor: 'middle', fill: 'c3', halo: true }); });
  }
});
