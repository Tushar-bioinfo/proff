// Study page + calculation walkthroughs: the notation you meet in deep-learning papers.
// Simple (indices, sums, softmax) -> probability words -> gradients -> nested (a layer stack, attention).
// Every number is computed here or in make_forward.py / make_attn.py. The data are made up for teaching.
Proff.page({ title: 'Reading deep-learning notation', sub: 'From x_ij to softmax(QKᵀ/√d)V: what each symbol says and how the numbers move', eyebrow: 'notation guide', layout: 'article' });

// ---- identity colours: the same colour means the same thing in every scene ----
const DATA = 'c1', MODEL = 'c4', LOSS = 'c3', PICK = 'c2', SUM = 'c5';
const on = (k, j, t) => k > j ? 1 : k === j ? t : 0;
const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2), f3 = v => v.toFixed(3);
const softmax = (z, tau = 1) => { const e = z.map(v => Math.exp(v / tau)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
const CLASSES = ['tumour', 'stroma', 'immune'];
const LOGITS = PROFF_DATA.forward.tensors.z2.data.map(r => r[0]);   // from the forward-pass trace below
const P0 = softmax(LOGITS);

// ======================================================================
Proff.section('three habits that make any formula readable');
Proff.tiles([
  { tag: 'habit 1', big: 'shape', h: 'write the shape under every symbol', text: 'x is 3 numbers, W is 4×3, so Wx is 4×1. Most wrong readings die at the shape check.' },
  { tag: 'habit 2', big: 'inside-out', h: 'peel the brackets from the middle', text: 'In σ(W⁽¹⁾x + b⁽¹⁾) do the inner sum first, then σ. Nested formulas are just steps in a row.' },
  { tag: 'habit 3', big: 'who is i?', h: 'name each index once', text: 'i is a sample, j a feature, k a class, t a step. A paper reuses the letters; the sentence next to the formula says which.' },
]);

// ======================================================================
Proff.section('chapter 1 · simple: indices, shapes, and where a number lives');
Proff.prose('A paper writes a whole table as one letter. Subscripts and superscripts then say which number, row or column you mean. The i button lists every symbol with a number from the figure.');
const X1 = [[5.1, .2, 3.4], [4.8, .1, 2.9], [.3, 6.2, .5], [.4, 5.8, .7]];
Proff.scene({
  title: 'x_ij is one number, x⁽ⁱ⁾ is one row, X is the table', acc: 1, h: 620,
  controls: [{ name: 'i', label: 'row i (cell)', min: 1, max: 4, step: 1, value: 2 }, { name: 'j', label: 'column j (gene)', min: 1, max: 3, step: 1, value: 3 }],
  steps: [
    { cap: 'One number: row i, column j. Here, the expression of gene j in cell i.',
      info: { notation: { 'x_{ij}': ['one entry: row i, column j', 'x₂₃ = 2.9: cell 2, gene 3'], i: ['row index: which sample (cell)', 'i = 2'], j: ['column index: which feature (gene)', 'j = 3'] },
              try: 'Drag **row i** and **column j** and watch the readout.' } },
    { cap: 'A whole row is one sample, written x with a bracketed i. The bracket means "which example", not a power.',
      info: { notation: { 'x^{(i)}': ['row i: the whole sample as a list of numbers', 'x⁽²⁾ = [4.8, 0.1, 2.9]'], '\\in': ['"is an element of"', 'x⁽²⁾ is one list of 3 numbers'],
                          '\\mathbb{R}^{d}': ['lists of d real numbers', 'd = 3 genes, so ℝ³'] } } },
    { cap: 'A colon means "all of them". Column j across every sample is one feature.',
      info: { notation: { 'x_{:,j}': ['column j: all rows, one feature', 'column 3 = [3.4, 2.9, 0.5, 0.7]'], ':': ['"every index"', 'rows 1 to 4'] } } },
    { cap: 'The whole table X has N rows (samples) and d columns (features).',
      info: { notation: { X: ['the whole table, capital letter', 'all 12 numbers'], N: ['number of samples (rows)', 'N = 4 cells'], d: ['number of features (columns)', 'd = 3 genes'],
                          '\\times': ['"by": rows by columns', 'N × d = 4 × 3'] } } },
  ],
  draw(g, k, t, p) {
    const cw = 150, ch = 70, x0 = (g.W - 3 * cw) / 2, y0 = 215, i = p.i - 1, j = p.j - 1;
    const hit = (a, b) => k === 0 ? a === i && b === j : k === 1 ? a === i : k === 2 ? b === j : true;
    const TEX = [`x_{ij}`, `x^{(i)}=\\left[x_{i1},\\,x_{i2},\\,x_{i3}\\right]\\in\\mathbb{R}^{d}`, `x_{:,j}`, `X\\in\\mathbb{R}^{N\\times d}`];
    g.tex(g.W / 2, 52, TEX[k], { size: 34, w: 900, h: 80 });
    g.matrix(x0, y0, X1, { cw, ch, fmt: f1, size: 24, rows: X1.map((_, r) => `cell ${r + 1}`), cols: ['gene 1', 'gene 2', 'gene 3'],
      cell: (a, b) => hit(a, b) ? { fill: 'f2', stroke: PICK, sw: 3, weight: 800, color: PICK } : { op: .55, top: .55 } });
    if (k === 3) {
      g.brace(x0 - 100, y0 + 4 * ch, x0 - 100, y0, 'N = 4 samples', { depth: 12, fill: DATA });
      g.brace(x0, y0 - 64, x0 + 3 * cw, y0 - 64, 'd = 3 features', { depth: 12, fill: DATA });
    }
    const row = X1[i].map(f1).join(', '), col = X1.map(r => f1(r[j])).join(', ');
    const read = [`x_{${p.i}${p.j}}=${f1(X1[i][j])}`, `x^{(${p.i})}=[${row}]`, `x_{:,${p.j}}=[${col}]`, `N\\times d=4\\times 3`][k];
    g.tex(g.W / 2, y0 + 4 * ch + 62, read, { size: 30, w: 800, h: 60, fill: PICK });
  }
});

// ======================================================================
Proff.section('chapter 2 · simple: sums, averages and the loss');
Proff.prose('Σ is a for-loop that adds. Putting 1/N in front makes it an average. Almost every training loss in a paper has this shape.');
const QS = p => [P0[0], .6, p.q3, .9, .5];
const q0 = QS({ q3: .3 }), l0 = q0.map(q => -Math.log(q)), s0 = l0.reduce((a, b) => a + b, 0);
Proff.scene({
  title: 'The loss L is the average of per-sample losses ℓ_i', acc: 3, h: 620, panelPad: { l: 90, r: 40, t: 120, b: 90 },
  controls: [{ name: 'q3', label: 'q for sample 3', min: .05, max: .95, step: .05, value: .3 }],
  panels: [{ id: 'bars', from: 0, to: 2 }, { id: 'prod', from: 3 }],
  steps: [
    { cap: 'Five samples. Each bar is one loss: how surprised the model was by the true class of that sample.',
      info: { notation: { 'q_i': ['probability the model gave the true class of sample i', `q_1 = ${f2(q0[0])}`], '\\ell_i': ['loss of sample i: small if q_i is near 1', `ℓ_1 = −ln ${f2(q0[0])} = ${f2(l0[0])}`], '-\\ln': ['minus natural log: 0 at q = 1, grows as q → 0', 'ln(0.5) = −0.69, so −ln 0.5 = 0.69'] },
              try: 'Drag **q for sample 3** toward 1 and watch bar 3 collapse.' } },
    { cap: 'The big sigma adds the bars into one tower. It is a for-loop over i.',
      info: { notation: { '\\sum_{i=1}^{N}': ['add the terms for i = 1, then 2, … up to N', l0.map(f2).join(' + ') + ' = ' + f2(s0)], N: ['number of samples', 'N = 5'] } } },
    { cap: 'Multiplying by 1/N turns the sum into an average. That average is the loss L.',
      info: { notation: { 'L': ['loss of the whole batch (capital); ℓ_i is one sample (lowercase)', `L = ${f2(s0)} ÷ 5 = ${f2(s0 / 5)}`], '\\frac{1}{N}': ['divide by the count', '1/5 = 0.2'] } } },
    { cap: 'Why logs? The probability of all samples together is a product. The log turns that product into this sum.',
      info: { notation: { '\\prod_{i=1}^{N}': ['multiply the terms for i = 1 … N (Π is to × what Σ is to +)', `${q0.map(f2).join(' × ')} = ${f3(q0.reduce((a, b) => a * b, 1))}`], '-\\ln\\prod q_i=\\sum \\ell_i': ['log of a product = sum of logs', `−ln ${f3(q0.reduce((a, b) => a * b, 1))} = ${f2(s0)}`] } } },
  ],
  draw(g, k, t, p) {
    const q = QS(p), l = q.map(v => -Math.log(v)), S = l.reduce((a, b) => a + b, 0), N = 5;
    const TEX = ['\\ell_i=-\\ln q_i', '\\sum_{i=1}^{N}\\ell_i', 'L=\\frac{1}{N}\\sum_{i=1}^{N}\\ell_i', '-\\ln\\prod_{i=1}^{N}q_i=\\sum_{i=1}^{N}\\ell_i'];
    g.tex(g.W / 2, 44, TEX[k], { size: 34, w: 900, h: 70 });
    g.panel('bars', D => {
      const ax = g.axes({ ...D, xd: [.4, 7], yd: [0, 4.5], xt: [1, 2, 3, 4, 5], yt: [0, 1, 2, 3, 4], xl: 'sample i', yl: 'loss ℓ_i (nats)' });
      const bw = ax.sx(1) - ax.sx(0);
      l.forEach((v, i) => { const x = ax.sx(i + 1), pos = k === 1 ? 0 : 1;
        g.rect(x - bw * .34, ax.sy(v), bw * .68, ax.sy(0) - ax.sy(v), { fill: i === 2 ? 'f3' : 'f1', stroke: i === 2 ? LOSS : DATA, sw: 2, free: true, op: k >= 1 ? .55 : 1 });
        if (k < 2) g.text(x, ax.sy(v) - 18, f2(v), { size: 18, anchor: 'middle', weight: 700, fill: i === 2 ? LOSS : DATA }); });
      if (k >= 1) { const tx = ax.sx(6.3), w = bw * .9, a = on(k, 1, t); let acc = 0;
        g.fade(k === 1 ? a : 1, g => { l.forEach((v, i) => { const y1 = ax.sy(acc * (k === 1 ? a : 1)), y2 = ax.sy((acc + v) * (k === 1 ? a : 1)); acc += v;
          g.rect(tx - w / 2, y2, w, y1 - y2, { fill: i % 2 ? 'f5' : 'f4', stroke: SUM, sw: 1.5, free: true }); });
          g.text(tx, ax.sy(S) - 22, `sum = ${f2(S)}`, { size: 22, anchor: 'middle', weight: 800, fill: SUM }); }); }
      if (k === 2) { const m = S / N, a = t;
        g.line(ax.sx(.4), ax.sy(m), ax.sx(5.6), ax.sy(m), { stroke: SUM, sw: 3.5, dash: true, op: a });
        g.text(ax.sx(.45), ax.sy(m) - 16, `L = ${f2(m)}`, { size: 26, weight: 800, fill: SUM, op: a }); }
    });
    g.panel('prod', () => {
      const bx = i => 100 + i * 170, bw = 120, bh = 86, ty = 175, by = 395;
      g.text(bx(0), ty - 26, 'q for samples 1 to 5 (multiply)', { size: 20, fill: 'muted' }); g.text(bx(0), by - 26, 'ℓ = −ln q (add)', { size: 20, fill: 'muted' });
      q.forEach((v, i) => {
        g.rect(bx(i), ty, bw, bh, { fill: 'f1', stroke: DATA, sw: 2, free: true });
        g.text(bx(i) + bw / 2, ty + bh / 2, f2(v), { size: 28, anchor: 'middle', weight: 700, mono: true, fill: DATA });
        g.rect(bx(i), by, bw, bh, { fill: 'f3', stroke: LOSS, sw: 2, free: true });
        g.text(bx(i) + bw / 2, by + bh / 2, f2(l[i]), { size: 28, anchor: 'middle', weight: 700, mono: true, fill: LOSS });
      });
      const px = bx(4) + bw + 60, pw = 190, pr = q.reduce((a, b) => a * b, 1);
      g.text(px - 30, ty + bh / 2, '=', { size: 30, anchor: 'middle', fill: 'muted' });
      g.rect(px, ty, pw, bh, { fill: 'f1', stroke: DATA, sw: 3, free: true });
      g.text(px + pw / 2, ty + bh / 2, f3(pr), { size: 30, anchor: 'middle', weight: 800, mono: true, fill: DATA });
      g.text(px - 30, by + bh / 2, '=', { size: 30, anchor: 'middle', fill: 'muted' });
      g.rect(px, by, pw, bh, { fill: 'f4', stroke: SUM, sw: 3, free: true });
      g.text(px + pw / 2, by + bh / 2, f2(S), { size: 30, anchor: 'middle', weight: 800, mono: true, fill: SUM });
      g.arrow(px + pw / 2, ty + bh + 8, px + pw / 2, by - 8, { stroke: LOSS, sw: 3 });
      g.text(px + pw / 2 + 18, (ty + bh + by) / 2, '−ln', { size: 26, weight: 800, fill: LOSS });
    });
  }
});

// ======================================================================
Proff.section('chapter 3 · simple: softmax, argmax and the 0/1 indicator');
Proff.prose('The network ends in raw scores called logits. Softmax turns them into probabilities. Argmax picks the winner. The bracket 1[…] counts a right answer as 1. The logits here are the output of the forward pass in chapter 7.');
Proff.scene({
  title: 'softmax turns scores z into probabilities p that sum to 1', acc: 4, h: 620, panelPad: { l: 110, r: 40, t: 120, b: 90 },
  controls: [{ name: 'tau', label: 'temperature τ', min: .7, max: 3, step: .1, value: 1 }],
  panels: [{ id: 'z', from: 0 }, { id: 'e', from: 1 }, { id: 'p', from: 2 }],
  steps: [
    { cap: 'Three raw scores (logits), one per class, each divided by the temperature τ.',
      info: { notation: { 'z_k': ['logit: raw score of class k', `z_1 = ${f2(LOGITS[0])} (tumour)`], k: ['class index', 'k = 1, 2, 3'], '\\tau': ['temperature: τ > 1 flattens, τ < 1 sharpens', 'τ = 1 leaves z unchanged'] },
              try: 'Drag **temperature τ**.' } },
    { cap: 'Raise e (≈ 2.718) to each score. All numbers turn positive; the biggest grows the most.',
      info: { notation: { 'e^{z_k/\\tau}': ['e to the power of the scaled score', `e^${f2(LOGITS[0])} = ${f2(Math.exp(LOGITS[0]))}`] } } },
    { cap: 'Divide each by the total of all three. The results are probabilities and add to 1.',
      info: { notation: { 'p_k': ['probability of class k', `p_1 = ${f2(Math.exp(LOGITS[0]))} ÷ ${f2(LOGITS.reduce((a, z) => a + Math.exp(z), 0))} = ${f2(P0[0])}`], '\\sum_{j}': ['add up over every class j in the bottom', LOGITS.map(z => f2(Math.exp(z))).join(' + ') + ' = ' + f2(LOGITS.reduce((a, z) => a + Math.exp(z), 0))] } } },
    { cap: 'argmax names the class with the biggest p. The bracket 1[…] is 1 if the statement is true, else 0.',
      info: { notation: { '\\arg\\max_k': ['the k at which p_k is largest (not the value)', 'p_1 = 0.88 is largest, so argmax = 1 (tumour)'], '\\hat y': ['the prediction (hat = estimated by the model)', 'ŷ = tumour'], '\\mathbb{1}[\\cdot]': ['indicator: 1 if true, 0 if false', 'true class is tumour, so 1[ŷ = y] = 1'] },
              read: ['τ reshapes p but never changes the argmax.'] } },
  ],
  draw(g, k, t, p) {
    const z = LOGITS.map(v => v / p.tau), e = LOGITS.map(v => Math.exp(v / p.tau)), pr = softmax(LOGITS, p.tau), Z = e.reduce((a, b) => a + b, 0);
    const TEX = ['z_k/\\tau', 'e^{z_k/\\tau}', 'p_k=\\frac{e^{z_k/\\tau}}{\\sum_{j}e^{z_j/\\tau}}', '\\hat y=\\arg\\max_k\\,p_k,\\quad \\mathbb{1}[\\hat y=y]'];
    g.tex(g.W / 2, 44, TEX[k], { size: 34, w: 900, h: 70 });
    const bars = (D, vals, yd, yl, lab, hi) => {
      const ax = g.axes({ ...D, xd: [.4, 3.6], yd, xt: [1, 2, 3], fmtx: v => CLASSES[v - 1], yt: 5, yl });
      const bw = ax.sx(1) - ax.sx(0);
      vals.forEach((v, i) => { const x = ax.sx(i + 1), win = hi && i === vals.indexOf(Math.max(...vals));
        g.rect(x - bw * .3, Math.min(ax.sy(v), ax.sy(0)), bw * .6, Math.abs(ax.sy(0) - ax.sy(v)), { fill: win ? 'f4' : 'f1', stroke: win ? MODEL : DATA, sw: win ? 3.5 : 2, free: true });
        g.text(x, (v >= 0 ? ax.sy(v) - 18 : ax.sy(v) + 20), lab(v), { size: 20, anchor: 'middle', weight: 700, fill: win ? MODEL : DATA }); });
      return ax;
    };
    g.panel('z', D => bars(D, z, [-1.5, 4.2], 'score z_k / τ', f2));
    g.panel('e', D => { bars(D, e, [0, 34], 'e^(z_k/τ)', f2); g.text(D.x + D.w - 10, D.y + 26, `total = ${f2(Z)}`, { size: 22, anchor: 'end', weight: 800, fill: SUM }); });
    g.panel('p', D => { const ax = bars(D, pr, [0, 1], 'probability p_k', f2, k >= 3), bw0 = ax.sx(1) - ax.sx(0);
      g.text(D.x + D.w - 10, D.y + 26, `sum of p = ${f2(pr.reduce((a, b) => a + b, 0))}`, { size: 22, anchor: 'end', weight: 800, fill: SUM });
      if (k >= 3) { const w = pr.indexOf(Math.max(...pr)); g.text(ax.sx(w + 1) + bw0 * .36, ax.sy(pr[w]) + 6, `argmax = ${CLASSES[w]}`, { size: 22, weight: 800, fill: MODEL });
        g.text(ax.sx(3.6) - 10, ax.sy(.55), `1[ŷ = y] = ${w === 0 ? 1 : 0}`, { size: 24, anchor: 'end', weight: 800, fill: PICK }); } });
  }
});

// ======================================================================
Proff.section('chapter 4 · common: probability words (p, q, ∼, 𝔼, KL)');
Proff.prose('Papers compare two distributions: what the labels say (p) and what the model says (q). The symbols below measure how far apart they are.');
const PT = [.7, .2, .1];
const ent = d => -d.reduce((a, v) => a + (v ? v * Math.log(v) : 0), 0);
const Q4 = p => softmax([p.zA, LOGITS[1], LOGITS[2]]);
const q4 = Q4({ zA: LOGITS[0] }), ce4 = -PT.reduce((a, v, i) => a + v * Math.log(q4[i]), 0), kl4 = ce4 - ent(PT);
Proff.scene({
  title: 'Cross-entropy and KL divergence compare p with q_θ', acc: 5, h: 620, panelPad: { l: 110, r: 40, t: 120, b: 90 },
  controls: [{ name: 'zA', label: 'tumour logit z₁', min: -1, max: 5, step: .25, value: LOGITS[0] }, { type: 'button', name: 'reseed', label: 'new draws' }],
  panels: [{ id: 'dist', from: 0 }, { id: 'ce', from: 1 }, { id: 'kl', from: 2 }, { id: 'draws', from: 3 }],
  steps: [
    { cap: 'Two answers to "which class is it?": the annotators (p, outlined) and the model (q_θ, filled).',
      info: { notation: { 'p(y)': ['target distribution: how often annotators pick each class', 'p(tumour) = 0.7'], 'p_\\theta(y\\mid x)': ['model probability of class y given input x, with parameters θ', `p_θ(tumour | x) = ${f2(q4[0])}`], '\\mid': ['"given": what is known on the right', 'given this image x'], '\\theta': ['all learnable numbers of the model', 'every W and b of chapter 7'] },
              try: 'Drag **tumour logit** to make the model more or less sure.' } },
    { cap: 'Cross-entropy: weight each class\'s surprise −ln q by how often p picks it, then add.',
      info: { notation: { 'H(p,q)': ['cross-entropy: the average surprise of q on data drawn from p', `H = ${f2(ce4)}`], 'p_k\\ln q_k': ['class k\'s share', `0.7 × ln ${f2(q4[0])} = ${f2(PT[0] * Math.log(q4[0]))}`] } } },
    { cap: 'KL divergence is the extra surprise over the best possible, H(p). It is 0 only when q = p.',
      info: { notation: { 'D_{\\mathrm{KL}}(p\\,\\|\\,q)': ['KL divergence from q to p; not symmetric', `${f2(kl4)}`], 'H(p)': ['entropy of p alone: the floor of cross-entropy', `H(p) = ${f2(ent(PT))}`], '\\|': ['a separator, not "absolute value"', 'read: KL of p from q'] },
              read: ['H(p, q) = H(p) + KL'] } },
    { cap: 'The ∼ sign means "drawn from". Averaging −ln q over draws y ∼ p approaches H(p, q).',
      info: { notation: { 'y\\sim p': ['y is a random draw from p', 'draw 1 may be tumour, stroma or immune'], '\\mathbb{E}_{y\\sim p}[\\cdot]': ['expectation: the long-run average over draws from p', `exact value = ${f2(ce4)}`] },
              try: 'Press **new draws** and see the mean bounce around the exact value.' } },
  ],
  draw(g, k, t, p, s) {
    const q = Q4(p), cet = PT.map((v, i) => -v * Math.log(q[i])), klt = PT.map((v, i) => v * Math.log(v / q[i])), ce = cet.reduce((a, b) => a + b, 0), hp = ent(PT), kl = ce - hp;
    const TEX = ['p(y)\\ \\text{vs}\\ p_\\theta(y\\mid x)', 'H(p,q)=-\\sum_{k}p_k\\ln q_k', 'D_{\\mathrm{KL}}(p\\,\\|\\,q)=\\sum_k p_k\\ln\\frac{p_k}{q_k}=H(p,q)-H(p)', 'H(p,q)=\\mathbb{E}_{y\\sim p}\\left[-\\ln q(y)\\right]'];
    g.tex(g.W / 2, 44, TEX[k], { size: 34, w: 1000, h: 70 });
    const cat = (D, yd, yl) => g.axes({ ...D, xd: [.4, 3.6], yd, xt: [1, 2, 3], fmtx: v => CLASSES[v - 1], yt: 5, yl });
    g.panel('dist', D => { const ax = cat(D, [0, 1], 'probability'), bw = ax.sx(1) - ax.sx(0);
      PT.forEach((v, i) => { const x = ax.sx(i + 1);
        g.rect(x - bw * .36, ax.sy(v), bw * .3, ax.sy(0) - ax.sy(v), { fill: undefined, stroke: DATA, sw: 3, free: true });
        g.rect(x + bw * .06, ax.sy(q[i]), bw * .3, ax.sy(0) - ax.sy(q[i]), { fill: 'f4', stroke: MODEL, sw: 2, free: true });
        g.text(x - bw * .21, ax.sy(v) - 18, f2(v), { size: 20, anchor: 'middle', weight: 700, fill: DATA });
        g.text(x + bw * .21, ax.sy(q[i]) - 18, f2(q[i]), { size: 20, anchor: 'middle', weight: 700, fill: MODEL }); });
      g.rect(ax.sx(2.1), ax.sy(.93) - 12, 26, 24, { fill: undefined, stroke: DATA, sw: 3, free: true }); g.text(ax.sx(2.1) + 38, ax.sy(.93), 'p: annotators', { size: 20, fill: DATA });
      g.rect(ax.sx(2.1), ax.sy(.80) - 12, 26, 24, { fill: 'f4', stroke: MODEL, sw: 2, free: true }); g.text(ax.sx(2.1) + 38, ax.sy(.80), 'q_θ: model', { size: 20, fill: MODEL }); });
    g.panel('ce', D => { const ax = cat(D, [0, 1.3], '−p_k ln q_k'), bw = ax.sx(1) - ax.sx(0);
      cet.forEach((v, i) => { const x = ax.sx(i + 1); g.rect(x - bw * .3, ax.sy(v), bw * .6, ax.sy(0) - ax.sy(v), { fill: 'f3', stroke: LOSS, sw: 2, free: true });
        g.text(x, ax.sy(v) - 18, f2(v), { size: 20, anchor: 'middle', weight: 700, fill: LOSS }); });
      g.text(D.x + D.w - 10, D.y + 26, `H(p, q) = ${f2(ce)}`, { size: 26, anchor: 'end', weight: 800, fill: SUM }); });
    g.panel('kl', D => { const ax = cat(D, [-.5, 1.2], 'p_k ln(p_k / q_k)'), bw = ax.sx(1) - ax.sx(0);
      g.line(ax.sx(.4), ax.sy(0), ax.sx(3.6), ax.sy(0), { stroke: 'muted', sw: 2, free: true });
      klt.forEach((v, i) => { const x = ax.sx(i + 1); g.rect(x - bw * .3, Math.min(ax.sy(v), ax.sy(0)), bw * .6, Math.abs(ax.sy(0) - ax.sy(v)), { fill: v >= 0 ? 'f3' : 'f1', stroke: v >= 0 ? LOSS : DATA, sw: 2, free: true });
        g.text(x, v >= 0 ? ax.sy(v) - 18 : ax.sy(v) + 20, f2(v), { size: 20, anchor: 'middle', weight: 700, fill: v >= 0 ? LOSS : DATA }); });
      g.text(D.x + D.w - 10, D.y + 26, `KL = ${f2(kl)}`, { size: 26, anchor: 'end', weight: 800, fill: SUM });
      g.text(D.x + D.w - 10, D.y + 58, `${f2(ce)} − ${f2(hp)}`, { size: 20, anchor: 'end', fill: 'muted', mono: true }); });
    g.panel('draws', D => { const ax = g.axes({ ...D, xd: [0, 25], yd: [0, 8], xt: [1, 5, 10, 15, 20, 24], yt: [0, 2, 4, 6], xl: 'draw number', yl: '−ln q(y) per draw' }), r = Proff.rng(s.seed);
      const ys = []; for (let n = 0; n < 24; n++) { const u = r(); ys.push(u < PT[0] ? 0 : u < PT[0] + PT[1] ? 1 : 2); }
      const ls = ys.map(y => -Math.log(q[y])), m = ls.reduce((a, b) => a + b, 0) / ls.length, col = ['c1', 'c2', 'c3'];
      g.line(ax.sx(0), ax.sy(ce), ax.sx(25), ax.sy(ce), { stroke: SUM, sw: 3, dash: true, free: true });
      ls.forEach((v, n) => g.circle(ax.sx(n + 1), ax.sy(Math.min(v, 6)), 8, { fill: col[ys[n]], stroke: 'fig', sw: 2, free: true }));
      g.text(ax.sx(25) - 8, ax.sy(7.4), `exact H(p, q) = ${f2(ce)} (dashed)`, { size: 20, anchor: 'end', weight: 700, fill: SUM });
      g.text(ax.sx(25) - 8, ax.sy(6.6), `mean of 24 draws = ${f2(m)}`, { size: 20, anchor: 'end', weight: 800, fill: 'ink' });
      CLASSES.forEach((c, i) => { g.circle(ax.sx(1.2 + i * 3.6), ax.sy(7.4), 7, { fill: col[i], stroke: 'none', free: true }); g.text(ax.sx(1.2 + i * 3.6) + 16, ax.sy(7.4), c, { size: 18, fill: 'muted' }); }); });
  }
});

// ======================================================================
Proff.section('chapter 5 · common: gradient, learning rate and the update rule');
Proff.prose('Training is one rule repeated: step downhill. The symbols tell you the slope (∇), the step size (η), and where you started, are, and want to end (θ⁽⁰⁾, θ⁽ᵗ⁾, θ*).');
const Lf = th => .5 * (th - 2) ** 2 + .3, dLf = th => th - 2, TH0 = -.5;
Proff.scene({
  title: 'θ ← θ − η∇L: walk downhill by learning rate × slope', acc: 2, h: 620,
  controls: [{ name: 'eta', label: 'learning rate η', min: .1, max: 1.9, step: .1, value: .4 }],
  steps: [
    { cap: 'The curve is the loss L as one parameter θ changes. The gradient is the slope at the current point.',
      info: { notation: { '\\nabla_\\theta L': ['gradient: slope of L with respect to θ (a list, one slope per parameter)', `slope at θ = ${TH0}: ${dLf(TH0)}`], '\\theta^{(0)}': ['starting value; (t) counts steps', 'θ⁽⁰⁾ = −0.5'], '\\frac{dL}{d\\theta}': ['the same slope, written as a derivative', 'L falls 2.5 per unit of θ here'] },
              try: 'Drag **learning rate η**.' } },
    { cap: 'One update: move against the slope by η times its size. A steep slope gives a big step.',
      info: { notation: { '\\theta^{(t+1)}': ['the next value of θ', `θ⁽¹⁾ = −0.5 − 0.4 × (−2.5) = ${f2(TH0 - .4 * dLf(TH0))}`], '\\eta': ['learning rate: step-size knob (α in some papers)', 'η = 0.4'], '-': ['minus: go downhill', 'slope is −2.5, so θ moves right'] } } },
    { cap: 'Repeat. Small η crawls; η near 2 overshoots and zig-zags; above 2 it would blow up.',
      info: { notation: { 't': ['step counter', 't = 0, 1, 2, …'], T: ['final step', 'T = 6'] } } },
    { cap: 'The star marks the true best θ*. The hat marks where training stopped, θ̂.',
      info: { notation: { '\\theta^{*}': ['the optimum: the value we wish we could find', 'θ* = 2'], '\\hat\\theta': ['hat = our estimate, here θ⁽ᵀ⁾', 'θ̂ = value after 6 steps'], '\\arg\\min_\\theta': ['the θ that makes L smallest (not the smallest L)', 'argmin = 2, min L = 0.3'] } } },
  ],
  draw(g, k, t, p) {
    const TEX = ['\\nabla_\\theta L(\\theta)=\\frac{dL}{d\\theta}', '\\theta^{(t+1)}=\\theta^{(t)}-\\eta\\,\\nabla_\\theta L\\left(\\theta^{(t)}\\right)', '\\theta^{(0)},\\ \\theta^{(1)},\\ \\dots,\\ \\theta^{(T)}', '\\theta^{*}=\\arg\\min_\\theta L(\\theta),\\qquad \\hat\\theta=\\theta^{(T)}'];
    g.tex(g.W / 2, 44, TEX[k], { size: 34, w: 1000, h: 70 });
    const ax = g.axes({ x: 110, y: 120, w: 980, h: 400, xd: [-1.5, 5.5], yd: [0, 7], xt: [-1, 0, 1, 2, 3, 4, 5], yt: [0, 2, 4, 6], xl: 'parameter θ', yl: 'loss L(θ)' });
    g.curve(Lf, ax, -1.5, 5.5, { stroke: DATA, sw: 4 });
    const path = [TH0]; for (let n = 0; n < 6; n++) path.push(path[n] - p.eta * dLf(path[n]));
    const dot = (th, c, r = 9) => g.circle(ax.sx(th), ax.sy(Lf(th)), r, { fill: c, stroke: 'fig', sw: 2.5, free: true });
    if (k === 0) { const sl = dLf(TH0); g.line(ax.sx(TH0 - 1), ax.sy(Lf(TH0) - sl), ax.sx(TH0 + 1), ax.sy(Lf(TH0) + sl), { stroke: LOSS, sw: 3, dash: true, free: true });
      dot(TH0, PICK, 11); g.label(ax.sx(TH0) + 40, ax.sy(Lf(TH0)) - 36, `θ⁽⁰⁾ = ${TH0}`, { size: 20, fill: PICK, to: [ax.sx(TH0), ax.sy(Lf(TH0))], lc: PICK });
      g.text(ax.sx(TH0) + 40, ax.sy(Lf(TH0)) - 78, `slope = ${f1(sl)}`, { size: 24, weight: 800, fill: LOSS }); }
    if (k === 1) { const a = path[1]; dot(TH0, PICK, 11); g.arrow(ax.sx(TH0), ax.sy(Lf(TH0)) - 24, ax.sx(a), ax.sy(Lf(a)) - 24, { stroke: LOSS, sw: 3.5, bend: -40 }); dot(a, MODEL, 11);
      g.tex(ax.sx(2.4), ax.sy(6.1), `\\theta^{(1)}=${f1(TH0)}-${f1(p.eta)}\\times(${f1(dLf(TH0))})=${f2(a)}`, { size: 26, w: 700, h: 60 }); }
    if (k >= 2) { path.forEach((th, n) => { if (n) g.line(ax.sx(path[n - 1]), ax.sy(Lf(path[n - 1])), ax.sx(th), ax.sy(Lf(th)), { stroke: LOSS, sw: 2, dash: true, op: .8, free: true }); });
      path.forEach((th, n) => dot(th, n === 0 ? PICK : n === 6 ? MODEL : DATA, n === 0 || n === 6 ? 11 : 7));
      g.text(ax.sx(5.4), ax.sy(6.3), `θ⁽⁶⁾ = ${f2(path[6])}`, { size: 26, anchor: 'end', weight: 800, fill: MODEL, mono: true }); }
    if (k >= 3) { const x = ax.sx(2), y = ax.sy(Lf(2)); g.poly([[x, y - 20], [x + 6, y - 7], [x + 20, y - 6], [x + 9, y + 3], [x + 12, y + 17], [x, y + 10], [x - 12, y + 17], [x - 9, y + 3], [x - 20, y - 6], [x - 6, y - 7]], { close: true, fill: SUM, stroke: 'fig', sw: 2, free: true });
      g.label(x + 120, y - 110, 'θ* (best)', { size: 22, weight: 800, fill: SUM, to: [x, y - 22], lc: SUM });
      g.label(ax.sx(path[6]) - 130, ax.sy(Lf(path[6])) - 120, 'θ̂ (stopped)', { size: 22, weight: 800, fill: MODEL, to: [ax.sx(path[6]), ax.sy(Lf(path[6])) - 12], lc: MODEL }); }
  }
});

// ======================================================================
Proff.section('chapter 6 · common: the chain rule on a computation graph');
Proff.prose('Backpropagation is the chain rule written along arrows. Each arrow contributes one local slope. Multiply them from the loss back to the weight.');
const X6 = 1.5, B6 = .5, Y6 = 1, sig = z => 1 / (1 + Math.exp(-z));
Proff.scene({
  title: 'ŷ = σ(wx + b); ∂L/∂w is a product of three local slopes', acc: 6, h: 620,
  controls: [{ name: 'w', label: 'weight w', min: -2, max: 2, step: .1, value: .8 }],
  steps: [
    { cap: 'Forward pass: left to right. Each arrow applies one function and passes the value on.',
      info: { notation: { 'z=wx+b': ['pre-activation: weight × input + bias', `z = 0.8 × ${X6} + ${B6} = ${f2(.8 * X6 + B6)}`], '\\sigma(z)': ['sigmoid: squashes any number into 0–1', `σ(${f2(.8 * X6 + B6)}) = ${f2(sig(.8 * X6 + B6))}`], '\\hat y': ['the model output (prediction)', `ŷ = ${f2(sig(.8 * X6 + B6))}`], '(\\hat y-y)^2': ['squared error against the target y = 1', `(${f2(sig(.8 * X6 + B6))} − 1)² = ${f3((sig(.8 * X6 + B6) - 1) ** 2)}`] },
              try: 'Drag **weight w**.' } },
    { cap: 'Backward pass, first arrow: how much does L change if ŷ moves a little?',
      info: { notation: { '\\frac{\\partial L}{\\partial \\hat y}': ['partial derivative: slope of L with respect to ŷ, others held fixed', `2(ŷ − y) = 2(${f2(sig(.8 * X6 + B6))} − 1) = ${f3(2 * (sig(.8 * X6 + B6) - 1))}`] } } },
    { cap: 'Second arrow: how much does ŷ move if z moves? Multiply by the slope so far.',
      info: { notation: { '\\frac{\\partial \\hat y}{\\partial z}': ['slope of the sigmoid at z: ŷ(1 − ŷ)', `${f2(sig(.8 * X6 + B6))} × ${f2(1 - sig(.8 * X6 + B6))} = ${f3(sig(.8 * X6 + B6) * (1 - sig(.8 * X6 + B6)))}`], '\\cdot': ['multiply the local slopes', 'slopes multiply along a path'] } } },
    { cap: 'Third arrow: z = wx + b, so ∂z/∂w is just x. The product is the gradient for w.',
      info: { notation: { '\\frac{\\partial z}{\\partial w}': ['slope of z with respect to w: equals x', `x = ${X6}`], '\\frac{\\partial L}{\\partial w}': ['the gradient the optimizer uses for w', `${f3(2 * (sig(.8 * X6 + B6) - 1))} × ${f3(sig(.8 * X6 + B6) * (1 - sig(.8 * X6 + B6)))} × ${X6}`] },
              read: ['Negative gradient: raising w lowers L.'] } },
  ],
  draw(g, k, t, p) {
    const w = p.w, z = w * X6 + B6, yh = sig(z), L = (yh - Y6) ** 2, dLy = 2 * (yh - Y6), dyz = yh * (1 - yh), dzw = X6;
    const TEX = ['L=\\left(\\sigma(wx+b)-y\\right)^{2}', '\\frac{\\partial L}{\\partial \\hat y}', '\\frac{\\partial L}{\\partial z}=\\frac{\\partial L}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial z}', '\\frac{\\partial L}{\\partial w}=\\frac{\\partial L}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w}'];
    g.tex(g.W / 2, 46, TEX[k], { size: 36, w: 1000, h: 80 });
    const NX = [150, 450, 750, 1050], names = ['w', 'z', 'ŷ', 'L'], vals = [w, z, yh, L], fn = [`× ${X6} + ${B6}`, 'sigmoid', '(· − 1)²'];
    NX.forEach((x, i) => { g.rect(x - 78, 140, 156, 104, { fill: i === 3 ? 'f3' : 'f1', stroke: i === 3 ? LOSS : DATA, sw: 2.5, r: 10, free: true });
      g.text(x, 170, names[i], { size: 22, anchor: 'middle', fill: 'muted', weight: 700 }); g.text(x, 214, i === 3 ? f3(vals[i]) : f2(vals[i]), { size: 32, anchor: 'middle', weight: 800, mono: true, fill: i === 3 ? LOSS : DATA });
      if (i < 3) { g.arrow(x + 82, 192, NX[i + 1] - 82, 192, { stroke: DATA, sw: 3 }); g.text((x + NX[i + 1]) / 2, 160, fn[i], { size: 20, anchor: 'middle', fill: 'muted' }); } });
    const back = (i, a) => g.fade(a, g => { g.arrow(NX[i + 1] - 60, 292, NX[i] + 60, 292, { stroke: LOSS, sw: 3.5 }); });
    const loc = [`\\frac{\\partial L}{\\partial \\hat y}=${f3(dLy)}`, `\\frac{\\partial \\hat y}{\\partial z}=${f3(dyz)}`, `\\frac{\\partial z}{\\partial w}=${f2(dzw)}`];
    [2, 1, 0].forEach((i, n) => { const a = on(k, n + 1, t); if (a > 0) { back(i, a); g.fade(a, g => g.tex((NX[i] + NX[i + 1]) / 2, 352, loc[n], { size: 26, w: 270, h: 70, fill: LOSS })); } });
    if (k >= 2) g.fade(on(k, 2, t), g => g.tex(g.W / 2, 480, `\\frac{\\partial L}{\\partial z}=${f3(dLy)}\\times${f3(dyz)}=${f3(dLy * dyz)}`, { size: 34, w: 900, h: 80, fill: 'ink' }));
    if (k >= 3) g.fade(on(k, 3, t), g => g.tex(g.W / 2, 560, `\\frac{\\partial L}{\\partial w}=${f3(dLy * dyz)}\\times${f2(dzw)}=${f3(dLy * dyz * dzw)}`, { size: 36, w: 900, h: 80, fill: SUM }));
  }
});

// ======================================================================
Proff.section('chapter 7 · nested: a layer stack read inside-out');
Proff.prose('This is the nested form you see in every methods section: W⁽²⁾ σ(W⁽¹⁾x + b⁽¹⁾) + b⁽²⁾. Each step below is one piece of it, with real numbers. Open the i card on every step.');
Proff.calc(PROFF_DATA.forward, { acc: 1 });

Proff.section('chapter 8 · nested: attention, softmax(QKᵀ/√d_k)V');
Proff.prose('The most cited formula of the decade, taken apart. Three amino-acid tokens, keys of length d_k = 2. The weights A show which token each token reads from.');
Proff.calc(PROFF_DATA.attn, { acc: 3 });

// ======================================================================
Proff.section('symbol atlas: objects and sizes');
Proff.compare(['symbol', 'read as', 'what it usually is', 'watch out for'], [
  ['x, y', 'x, y', 'One input and its target (label). Plain lowercase = one example.', 'y can be a number, a class, or a whole sequence.'],
  ['X, Y', 'big X, big Y', 'A batch or dataset stacked into a matrix. X ∈ ℝ^(N×d): N samples, d features.', 'Some papers stack samples as columns instead (d×N).'],
  ['x⁽ⁱ⁾, x_i, x_ij', 'x of i; x sub i j', 'x⁽ⁱ⁾: sample i. x_j: feature j. x_ij: entry in row i, column j.', 'A bracketed superscript is a label, not a power.'],
  ['W, b', 'weights, bias', 'W: weight matrix; b: bias vector. W⁽ˡ⁾ belongs to layer l.', 'Some papers write W[l] or W_l.'],
  ['θ', 'theta', 'Every learnable number of the model, bundled into one name.', 'Φ, ϕ, ψ are other groups of parameters (e.g. an encoder).'],
  ['ŷ', 'y hat', 'What the model predicts. The hat means "estimated".', 'y without a hat is the truth.'],
  ['N, B, T, d, D', 'sizes', 'N samples, B batch size, T sequence length (or time steps), d or D feature or model width.', 'Letters are re-used: always find where the paper defines them.'],
  ['ℓ, L', 'little ell, loss', 'ℓ: loss of one sample. L: loss of the batch or the whole objective.', 'L is also used for "number of layers".'],
]);
Proff.section('symbol atlas: operators');
Proff.compare(['symbol', 'read as', 'what it does', 'example'], [
  ['Σ, Π', 'sum, product', 'Add (Σ) or multiply (Π) the terms for i = 1 … N.', 'Σ 1,2,3 = 6; Π 1,2,3 = 6'],
  ['·, ×, ⊙', 'dot, times, element-wise', '· often matrix or dot product; ⊙ multiplies cell by cell.', '[1,2] ⊙ [3,4] = [3,8]'],
  ['ᵀ (⊤)', 'transpose', 'Flip rows and columns. (4×3)ᵀ is 3×4.', 'QKᵀ in attention'],
  ['∇, ∂', 'gradient, partial', '∂L/∂w: slope of L along w. ∇ stacks all such slopes into a list.', '∇_θ L has one number per parameter.'],
  ['argmax, argmin', 'argmax', 'The input that gives the biggest (smallest) output, not the output.', 'argmax of [0.1, 0.7, 0.2] is 2'],
  ['‖x‖₂, ‖x‖₁', 'norm', 'Length of a vector: ‖x‖₂ = √(Σ x_i²); ‖x‖₁ = Σ |x_i|.', '‖[3, 4]‖₂ = 5'],
  ['1[·], [a; b]', 'indicator, concatenate', '1[cond] is 1 if true, else 0. [a; b] glues vectors end to end.', '1[3 > 2] = 1'],
  ['∘, ←, :=, ≜', 'compose, assign, defined as', 'f ∘ g: apply g, then f. θ ← … : overwrite θ. := and ≜ define a name.', 'f(g(x)) = (f ∘ g)(x)'],
]);
Proff.section('symbol atlas: probability and sets');
Proff.compare(['symbol', 'read as', 'what it says', 'example'], [
  ['p(y | x)', 'probability of y given x', 'Chance of y once x is known.', 'p(tumour | image) = 0.88'],
  ['p_θ, q_φ', 'p theta, q phi', 'A distribution produced by a model with parameters θ (or φ).', 'The model\'s softmax output is p_θ(y | x).'],
  ['x ∼ p', 'x drawn from p', 'x is a random sample from distribution p.', 'ε ∼ 𝒩(0, 1)'],
  ['𝔼[f(x)]', 'expectation of f', 'Long-run average of f over draws. 𝔼_(x∼p) names the distribution.', 'Mean of 1000 draws of f(x)'],
  ['𝒩(μ, σ²)', 'normal', 'Bell curve with mean μ and variance σ². Variance, not SD, goes in the bracket.', 'σ here is the SD; not the sigmoid.'],
  ['KL(p ‖ q), H(p)', 'KL, entropy', 'KL: extra surprise from using q for data from p. H(p): surprise of p itself.', 'KL(p ‖ q) ≠ KL(q ‖ p)'],
  ['ℝ, ℝ^d, {0,1}', 'reals, d-vectors, binary', 'ℝ^d: lists of d real numbers. {0,1}: only 0 or 1.', 'x ∈ ℝ^3'],
  ['[N], |S|', 'one to N, size of S', '[N] = {1, …, N}. |S| = number of items in the set.', '|{a, b, c}| = 3'],
]);
Proff.section('symbol atlas: hats, stars and other marks');
Proff.compare(['mark', 'read as', 'meaning', 'example'], [
  ['θ̂', 'theta hat', 'An estimate computed from data.', 'θ̂ = value training ended on'],
  ['θ*', 'theta star', 'The ideal or optimal value.', 'θ* = argmin L(θ)'],
  ['x̄', 'x bar', 'An average.', 'x̄ = (1/N) Σ x_i'],
  ['x̃, x′', 'x tilde, x prime', 'A modified or second copy of x (noised, augmented, next step).', 'x̃ = x + noise'],
  ['θ⁽ᵗ⁾', 'theta at step t', 'Value after t updates.', 'θ⁽⁰⁾ is the starting value'],
  ['ẋ, ẍ', 'x dot', 'Derivative with respect to time.', 'Seen in neural ODE papers.'],
]);

Proff.section('very common nested forms, read inside-out');
Proff.compare(['formula', 'inside-out reading', 'shapes (typical)'], [
  ['ŷ = softmax(W⁽²⁾ σ(W⁽¹⁾x + b⁽¹⁾) + b⁽²⁾)', 'W⁽¹⁾x → + b⁽¹⁾ → σ → W⁽²⁾· → + b⁽²⁾ → softmax', 'x d; hidden m; ŷ K classes'],
  ['O = softmax(QKᵀ / √d_k) V', 'QKᵀ → ÷ √d_k → softmax per row → × V', 'Q, K: N×d_k; A: N×N; O: N×d_v'],
  ['LN(x) = γ ⊙ (x − μ) / √(σ² + ε) + β', 'subtract mean → divide by spread → scale γ → shift β', 'x, γ, β: d; μ, σ²: single numbers'],
  ['h = x + F(x)', 'compute F(x), then add the original x back (a residual connection)', 'F(x) has the same shape as x'],
  ['L(θ) = (1/N) Σ_i ℓ(f_θ(x_i), y_i)', 'f_θ(x_i) → ℓ against y_i → average over i', 'one number'],
  ['θ ← θ − η ∇_θ L(θ)', 'compute gradient → scale by η → subtract', 'θ and ∇ have the same shape'],
  ['ELBO = 𝔼_(q(z|x)) [log p(x|z)] − KL(q(z|x) ‖ p(z))', 'draw z from the encoder q → score reconstruction → subtract KL to the prior', 'one number'],
]);

Proff.section('do not confuse');
Proff.compare(['looks alike', 'versus', 'how to tell'], [
  ['σ', 'sigmoid vs standard deviation vs "any activation"', 'σ(z) with a bracket and a number inside is an activation. σ in 𝒩(μ, σ²) is a spread.'],
  ['x² vs x⁽²⁾', 'power vs example number 2', 'Brackets or square brackets around the superscript mean a label.'],
  ['N vs 𝒩', 'sample count vs normal distribution', 'Script 𝒩 always has (μ, σ²) after it.'],
  ['L vs ℓ vs ℒ', 'batch loss, one-sample loss, objective', 'Check whether there is a sum over i in front of it.'],
  ['log vs ln', 'base 10 or e (or 2)', 'In machine learning, log is almost always natural (base e) unless stated.'],
  ['‖p ‖ q‖ vs |x|', 'KL separator vs absolute value', 'The double bar sits between two distributions in KL.'],
  ['⊙ vs ⊗ vs ∘', 'cell-by-cell, outer product, function composition', 'Ask: do both sides have the same shape? Then ⊙.'],
]);

Proff.section('three angles');
Proff.tiles([
  { tag: 'as a for-loop', h: 'Σ, Π and 𝔼 are loops', text: 'Σ_i adds, Π_i multiplies, 𝔼 averages over random draws. Write the loop in code and the symbol reads itself.' },
  { tag: 'as shapes', h: 'Every formula is a pipeline of boxes', text: 'Draw each symbol as a box of its shape. Matrix times vector eats the matching sizes and leaves the others.' },
  { tag: 'as bookkeeping', h: 'Marks carry status', text: 'Hat = estimated, star = optimal, bar = averaged, bracketed superscript = which example or layer.' },
]);

Proff.section('test yourself');
Proff.quiz([
  { q: 'A paper has W ∈ ℝ^(512×64) and x ∈ ℝ^64. What is the shape of Wx, and what is the shape of xᵀW?', a: 'Wx is 512×1 (the 64s match and vanish). xᵀ is 1×64, and (1×64)(512×64) does not fit: the inner sizes 64 and 512 differ, so xᵀW is invalid. Write xᵀWᵀ for a 1×512 row.' },
  { q: 'In attention, why divide QKᵀ by √d_k before the softmax?', a: 'Dot products of longer keys are larger on average. Big scores make the softmax one-hot and its slopes vanish. Dividing by √d_k keeps the scores on a similar scale (here √2 = 1.414).' },
  { q: 'You change the temperature τ from 1 to 3. What happens to p, and to argmax?', a: 'p flattens toward equal shares (less confident). argmax does not change: dividing every score by the same positive number keeps their order.' },
  { q: 'Cross-entropy H(p, q) = 1.01 and the entropy H(p) = 0.80. What is KL(p ‖ q), and could it be negative?', a: 'KL = H(p, q) − H(p) = 0.21. KL is never negative; it is 0 only if q = p. Individual terms p_k ln(p_k/q_k) can be negative, as in chapter 4.' },
  { q: 'Reading ∂L/∂w = (∂L/∂ŷ)(∂ŷ/∂z)(∂z/∂w): if the sigmoid is saturated (ŷ ≈ 0 or 1), what happens to the gradient for w?', a: '∂ŷ/∂z = ŷ(1 − ŷ) is near 0, so the whole product is near 0. The weight barely updates: this is the vanishing gradient.' },
]);
