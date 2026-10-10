// Biology walk exemplar: a pooled CRISPR knockout screen, from DNA letters to the count matrix. Layout 'walk': one stage, one slider.
// All sequences and counts come from make_data.py (data/crispr.json). Identity colours hold across scenes:
// guide spacer c1, PAM c2, cut c3; essential-gene guides warm (RPL3 c3, POLR2A c5), control guides cool (AAVS1 c4, NT c6).
const D = PROFF_DATA.crispr, P_ = Proff;
P_.page({ title: 'A CRISPR knockout screen', sub: 'From 20 letters of DNA to a count matrix', eyebrow: 'biology walk' });
const on = (k, j, t) => k > j ? 1 : k === j ? t : 0;
const GENE_COL = { RPL3: 'c3', POLR2A: 'c5', AAVS1: 'c4', NT: 'c6' }, gcol = r => GENE_COL[r.split('_')[0]];
const BW = 30, X0 = (1200 - D.seq.length * BW) / 2, T = [D.t0, D.t1], PAM = D.pam;
const hi = [[T[0], T[1], 'c1'], [PAM[0], PAM[1], 'c2']];
const guideSeq = D.seq.slice(T[0], T[1]);

P_.scene({ title: 'The target: 20 letters in a gene', phase: 'design', acc: 1,
  steps: [{ cap: 'The start of a gene: two DNA strands, paired letter by letter (A with T, C with G).', info: 'The sequence is made up for this page. Real guides are picked by design tools that score on-target cutting and off-target matches.' },
    { cap: 'Pick 20 letters that sit right before **AGG**. That AGG is the **PAM**, the tag Cas9 must find first.', info: { notation: { PAM: ['protospacer adjacent motif: the short tag Cas9 checks first', 'AGG, right after the 20 letters'], NGG: ['any letter, then G, G: the PAM of the common Cas9 (SpCas9)', 'AGG, CGG, TGG and GGG all work'] }, read: ['No PAM right after the target, no cut'] } }],
  draw(g, k, t) {
    const d = g.dna(X0, 290, { seq: D.seq, bw: BW, hi: k >= 1 ? hi : [], ends: true });
    g.label(d.cx(1), d.bot + 70, 'ATG: the gene starts here', { to: [d.cx(1), d.bot + 4], size: 20, fill: 'muted', weight: 600, anchor: 'start' });
    if (k >= 1) g.fade(t, g => { g.brace(d.x(T[0]), 252, d.x(T[1]), 252, '20-letter target', { stroke: 'c1', fill: 'c1', size: 22 });
      g.label(d.cx(PAM[0] + 1), 480, 'PAM', { to: [d.cx(PAM[0] + 1), d.bot + 6], size: 22, weight: 800, anchor: 'middle', fill: 'c2', lc: 'c2' }); });
  } });

P_.scene({ title: 'The guide RNA carries those letters', phase: 'design', acc: 1,
  steps: [{ cap: 'The **sgRNA** (single guide RNA): the same 20 letters, with U in place of T, plus a folded tail.' },
    { cap: 'The **spacer** finds the target. The **scaffold** is the handle Cas9 holds.', info: { see: ['Spacer: 20 letters, written like the top strand', 'Scaffold: the folded handle Cas9 holds'], read: ['The spacer pairs with the bottom strand', 'Every guide in a library shares the scaffold; only the spacer changes'] } }],
  draw(g, k, t) {
    const d = g.dna(X0, 360, { seq: D.seq, bw: BW, hi, ends: true });
    const gd = g.guide(d.x(T[0]), 190, { seq: guideSeq, bw: BW });
    if (k >= 1) g.fade(t, g => { g.brace(gd.x(0), 180, gd.x(20), 180, 'spacer', { stroke: 'c1', fill: 'c1', size: 22 });
      g.text(gd.end + 150, 108, 'scaffold', { size: 22, weight: 800, fill: 'c1', anchor: 'middle' }); });
  } });

P_.scene({ title: 'Cas9 opens the DNA and cuts', phase: 'cut', acc: 5,
  steps: [{ cap: 'Cas9 protein holds the guide and slides along DNA, checking every NGG.' },
    { cap: 'At the match the strands part. The guide pairs with one strand, letter by letter.' },
    { cap: 'Cas9 cuts **both** strands, 3 letters before the PAM.' },
    { cap: 'A **double-strand break**. The cell has to repair it.' }],
  draw(g, k, t) {
    const sep = k === 1 ? 74 * t : k === 2 ? 74 : k === 3 ? 74 * (1 - t) : 0, cs = k === 3 ? t : 0, y = 290;
    const casOp = k <= 2 ? 1 : 1 - t, cx = X0 + (T[0] + 10) * BW;
    const dy = k === 0 ? (1 - t) * -30 : 0;
    const top = y - 120, bot = y + BW * .95 * 2.9 + sep + 40;   // body spans guide, both strands and the bubble
    if (casOp > .02) g.fade(casOp, g => g.cas9(X0 + 15 * BW, (top + bot) / 2 + dy, { w: 28 * BW, h: bot - top }));
    const d = g.dna(X0, y, { seq: D.seq, bw: BW, hi, open: [T[0], T[1]], sep, cut: k >= 2 ? D.cut : null, cutShift: cs });
    // the guide settles onto the strand it pairs with
    if (casOp > .02) g.fade(casOp, g => { const low = y + BW * .95 * 1.9 + sep, gy = k === 0 ? y - 90 : P_.lerp(y - 90, low - BW * .95 - 6, k === 1 ? t : 1); g.guide(d.x(T[0]), gy, { seq: guideSeq, bw: BW, scaffold: false }); });
    if (k >= 2) g.fade(k === 2 ? t : 1, g => { const x = (d.x(D.cut - 1) + BW + d.x(D.cut)) / 2;
      [y - 18, y + BW * .95 * 2.9 + sep + 18].forEach((yy, i) => g.poly([[x - 11, yy + (i ? 14 : -14)], [x + 11, yy + (i ? 14 : -14)], [x, yy]], { fill: 'c3', stroke: 'c3', close: true }));
      g.text(x, y - 56, 'cut', { size: 22, weight: 800, fill: 'c3', anchor: 'middle' }); });
  } });

P_.scene({ title: 'Sloppy repair breaks the gene', phase: 'knockout', acc: 3,
  steps: [{ cap: 'Repair often adds or loses a few letters. Here one letter is lost at the cut.' },
    { cap: 'Read in threes, every codon after the gap shifts. A **stop** appears early, so the protein is cut short.', info: { notation: { NHEJ: ['non-homologous end joining: the quick, sloppy repair', 'one extra letter pasted in at the cut'], indel: ['a small insertion or deletion left by the repair', '+1 or −2 letters at the cut'] }, read: ['2 of 3 indel sizes shift the reading frame', 'An in-frame indel can leave a working protein, so libraries use ~4 guides per gene'] } }],
  draw(g, k, t) {
    const row = (seq, aa, y, label, mark) => {
      const d = g.dna(X0, y, { seq, bw: BW, single: true });
      g.text(X0 - 14, y + 14, label, { size: 18, anchor: 'end', fill: 'muted', weight: 700 });
      for (let c = 0; c * 3 + 2 < seq.length; c++) g.rect(d.x(c * 3) + 1, y - 3, BW * 3 - 2, BW * .95 + 6, { stroke: 'line', sw: 2, r: 4, fill: 'none', free: true });
      if (k >= 1) g.fade(t, g => [...aa.slice(0, (aa.indexOf('*') + 1) || aa.length)].forEach((a, c) => g.text(d.x(c * 3) + BW * 1.5, y + 66, a === '*' ? 'STOP' : a, { size: a === '*' ? 18 : 26, anchor: 'middle', weight: 900, mono: true, fill: a === '*' ? 'c3' : (mark && c * 3 + 3 > D.cut - 1 ? 'c5' : 'ink') })));
      return d; };
    row(D.seq, D.aa, 170, 'before');
    const d2 = row(D.mut, D.aa_mut, 400, 'after', true);
    const x = d2.x(D.cut - 1);
    g.label(x, 520, 'letter lost', { to: [x, 434], size: 20, weight: 800, anchor: 'middle', fill: 'c3', lc: 'c3' });
  } });

const cellsIn = (g, cx, cy, rx, ry, n, colOf, opOf, seed) => { const r = P_.rng(seed);
  for (let i = 0; i < n; i++) { const a = r() * 6.283, q = Math.sqrt(r()) * .86, c = colOf(i, r);
    g.ellipse(cx + Math.cos(a) * rx * q, cy + Math.sin(a) * ry * q, 11, 7, { fill: c.replace(/^c/, 'f'), stroke: c, sw: 2, op: opOf ? opOf(i, c) : 1 }); } };
const pick = (r, w) => { let x = r() * w.reduce((a, b) => a + b[1], 0); for (const [c, v] of w) if ((x -= v) < 0) return c; return w[0][0]; };

P_.scene({ title: 'One guide per cell', phase: 'library', acc: 6,
  steps: [{ cap: 'Each guide sits in a **plasmid** (a ring of DNA). A genome-wide library holds ~4 guides for every gene.' },
    { cap: 'Packaging cells turn the plasmids into **lentivirus** that can deliver a guide into a cell’s genome.' },
    { cap: 'Infect at a low dose (**MOI** ≈ 0.3), so an infected cell almost always gets just one guide.', info: { notation: { MOI: ['multiplicity of infection: viruses per cell', 'MOI 0.3: about 3 viruses per 10 cells'], coverage: ['cells per guide, often ≥ 500', '500 cells carry the same guide'] }, read: ['At MOI 0.3 most cells get no virus', 'Of the infected cells, about 85% carry exactly one guide'] } },
    { cap: 'An antibiotic (**puromycin**) kills cells with no guide. Every survivor carries one.' }],
  draw(g, k, t) {
    const pl = g.plasmid(200, 330, 110, { parts: [{ from: .03, to: .12, color: 'c1' }, { from: .4, to: .62, color: 'c6' }] });
    g.label(...pl.at(.075, 1.45), 'guide', { to: pl.at(.075, 1.08), size: 20, weight: 800, fill: 'c1', lc: 'c1', anchor: 'start' });
    g.label(...pl.at(.51, 1.42), 'puro resistance', { to: pl.at(.51, 1.08), size: 18, weight: 700, fill: 'c6', lc: 'c6', anchor: 'middle' });
    if (k >= 1) g.fade(on(k, 1, t), g => { g.arrow(340, 330, 440, 330, { stroke: 'muted', sw: 3 }); [[520, 250], [560, 360], [500, 450]].forEach(([x, y]) => g.virus(x, y, 38)); });
    if (k >= 2) g.fade(on(k, 2, t), g => { g.arrow(610, 340, 680, 340, { stroke: 'muted', sw: 3 });
      g.dish(930, 360, 230, { cells: 0 });
      cellsIn(g, 930, 354, 205, 64, 46, (i, r) => i % 3 === 0 ? pick(r, [['c3', 1], ['c5', 1], ['c4', 1], ['c6', 1]]) : 'muted', (i, c) => c === 'muted' && k >= 3 ? 1 - on(k, 3, t) : 1, 21); });
  } });

const share = arr => { const s = {}; D.rows.forEach((r, i) => { const gname = r.split('_')[0]; s[gname] = (s[gname] || 0) + arr[i]; }); const tot = Object.values(s).reduce((a, b) => a + b, 0); for (const k in s) s[k] /= tot; return s; };
const S0 = share(D.d0), S21 = share(D.d21);

P_.scene({ title: 'Weeks later, some guides drop out', phase: 'screen', acc: 3,
  steps: [{ cap: 'Grow the cells for about three weeks, keeping enough cells for every guide.' },
    { cap: 'Cells whose guide broke an **essential gene** (RPL3, POLR2A) stop dividing. Their share shrinks.' }],
  draw(g, k, t) {
    const dish = (cx, S, label, seed) => { g.dish(cx, 300, 250, { cells: 0 }); const w = Object.entries(S).map(([gname, v]) => [GENE_COL[gname], v]);
      cellsIn(g, cx, 294, 225, 70, 60, (i, r) => pick(r, w), null, seed); g.text(cx, 420, label, { size: 22, weight: 800, anchor: 'middle' }); };
    dish(320, S0, 'day 0', 5); dish(880, k >= 1 ? S21 : S0, 'day 21', 5);
    const bar = (x, S, y) => { let xx = x; ['RPL3', 'POLR2A', 'AAVS1', 'NT'].forEach(gname => { const w = S[gname] * 440; g.rect(xx, y, w, 34, { fill: GENE_COL[gname].replace('c', 'f'), stroke: GENE_COL[gname], sw: 2, free: true });
      if (w > 60) g.text(xx + w / 2, y + 17, `${Math.round(S[gname] * 100)}%`, { size: 16, anchor: 'middle', weight: 700, mono: true, fill: GENE_COL[gname], free: true }); xx += w; }); };
    bar(100, S0, 470); bar(660, k >= 1 ? S21 : S0, 470);
    [['RPL3', 'c3'], ['POLR2A', 'c5'], ['AAVS1', 'c4'], ['NT (no target)', 'c6']].forEach(([n, c], i) => { g.rect(150 + i * 250, 572, 22, 22, { fill: c.replace('c', 'f'), stroke: c, sw: 2 }); g.text(182 + i * 250, 583, n, { size: 18, weight: 700, fill: c }); });
  } });

P_.scene({ title: 'Read the guides back', phase: 'sequence', acc: 4,
  steps: [{ cap: 'Harvest DNA from each sample. Each cell’s guide is now part of its genome.' },
    { cap: '**PCR** copies just the guide region, millions of times. It copies DNA, not cells.' },
    { cap: 'A sequencer reads the copies: billions of short reads.' },
    { cap: 'Each read = adapter + sample tag + the 20-letter spacer. The spacer names the guide.' }],
  draw(g, k, t) {
    const tb = g.tube(110, 140, 220, { level: .45, fill: 'f1' }); g.text(tb.cx, 400, 'genomic DNA', { size: 20, weight: 700, anchor: 'middle' });
    if (k >= 1) g.fade(on(k, 1, t), g => { g.arrow(220, 250, 300, 250, { stroke: 'muted', sw: 3 });
      const r = P_.rng(4); for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) { const c = ['c3', 'c5', 'c4', 'c6'][Math.floor(r() * 4)]; g.rect(330 + j * 120, 150 + i * 24, 100, 14, { fill: c.replace('c', 'f'), stroke: c, sw: 1.5, r: 3, free: true }); }
      g.text(440, 400, 'guide copies', { size: 20, weight: 700, anchor: 'middle' }); });
    if (k >= 2) g.fade(on(k, 2, t), g => { g.arrow(580, 250, 660, 250, { stroke: 'muted', sw: 3 }); g.flowcell(690, 130, 420, 240, { lanes: 4, n: 34 }); g.text(900, 400, 'sequencer flow cell', { size: 20, weight: 700, anchor: 'middle' }); });
    if (k >= 3) g.fade(on(k, 3, t), g => { const rd = g.read(110, 480, { w: 1000, h: 44, parts: [{ len: 3, color: 'muted', text: 'adapter' }, { len: 2.4, color: 'c2', text: 'sample tag' }, { len: 10, color: 'c1', text: guideSeq }, { len: 2.4, color: 'muted', text: 'scaffold' }] });
      g.brace(rd.parts[2].x1, 534, rd.parts[2].x0, 534, 'the guide we designed', { stroke: 'c1', fill: 'c1', size: 20 }); });
  } });

P_.scene({ title: 'The count matrix', phase: 'analysis', acc: 2,
  steps: [{ cap: 'Count reads for every guide in every sample. Rows are guides, columns are samples.' },
    { cap: 'Scale to the control guides, then take **log₂ fold change**: −3 means 8× fewer cells.', info: { notation: { LFC: ['log₂ fold change, day 21 vs day 0, each scaled to the control guides', '−3: 8× fewer cells by day 21'] }, read: ['−1 = half as many cells, −3 = 8× fewer'], more: 'Scaling to control guides (AAVS1, non-targeting) is MAGeCK’s *control* normalisation. Scaling to all guides also works when most guides are neutral, as in a real genome-wide library.' } },
    { cap: 'Guides of the same gene agree. Tools like **MAGeCK** turn that agreement into a gene-level score.' }],
  draw(g, k, t) {
    const cw = 120, ch = 38, x = 380, y = 110;
    const M = g.matrix(x, y, D.rows.map((r, i) => [D.d0[i], D.d21[i]]), { cw, ch, cols: ['day 0', 'day 21'], rows: D.rows, rowFill: i => gcol(D.rows[i]), size: 21,
      cell: (i, j) => j === 1 && k >= 1 ? { fill: gcol(D.rows[i]).replace('c', 'f') } : {} });
    if (k >= 1) g.fade(on(k, 1, t), g => { g.text(x + 2 * cw + 30, y + ch * 6, '→', { size: 34, anchor: 'middle', fill: 'muted', weight: 800 });
      g.matrix(x + 2 * cw + 60, y, D.lfc.map(v => [v]), { cw: 130, ch, cols: ['log₂ FC'], size: 21, fmt: v => (v > 0 ? '+' : '') + v.toFixed(2),
        cell: (i, j, v) => ({ fill: v < -1 ? 'f3' : 'surf', color: v < -1 ? 'c3' : 'ink' }) }); });
    if (k >= 2) g.fade(on(k, 2, t), g => { const gx = x + 2 * cw + 210, mean = (a, b) => D.lfc.slice(a, b).reduce((s, v) => s + v, 0) / (b - a);
      [['RPL3', 0, 4], ['POLR2A', 4, 8]].forEach(([n, a, b]) => g.brace(gx, y + a * ch + 4, gx, y + b * ch - 4, `${n} ${mean(a, b).toFixed(1)}`, { stroke: GENE_COL[n], fill: GENE_COL[n], size: 22 }));
      g.brace(gx, y + 8 * ch + 4, gx, y + 12 * ch - 4, 'controls ≈ 0', { stroke: 'c4', fill: 'c4', size: 22 }); });
  } });
