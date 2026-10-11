// A Story-Driven Visual Guide to Statistical Notation for Biologists & Researchers.
// Story: Testing a novel metabolic drug to lower blood glucose in mice.
// Connects five core notation families across the experimental lifecycle:
// 1. Raw bench measurements & sample statistics (i, xᵢ, n, ∑, x̄, s, df)
// 2. Population truths vs sample estimates (N, n, μ, x̄, σ, s, μ̂)
// 3. Choosing error bars: biological spread vs mean precision (s vs SE = s ÷ √n)
// 4. Hypothesis testing & statistical proof (H₀, H₁, α, t, p)
// 5. Dose-response modeling (y, x, β₀, β₁, ŷ, ε, e)

Proff.page({
  title: 'Statistical Notation: The Lab Story',
  sub: 'Testing a metabolic drug in mice: from raw bench data to statistical proof',
  eyebrow: 'visual story',
  layout: 'article'
});

// ==========================================
// PROLOGUE: THE EXPERIMENT
// ==========================================
Proff.section('the experiment: testing a new metabolic drug');
Proff.tiles([
  {
    tag: 'the lab goal',
    big: '114 mg/dL',
    h: 'baseline glucose',
    text: 'You measure fasting blood glucose across lab mice to test if your compound lowers blood sugar.'
  },
  {
    tag: 'the core divide',
    big: 'Greek vs Latin',
    h: 'truth vs lab sample',
    text: 'Greek letters name unseeable biological constants; Latin letters name numbers computed from your data.'
  },
  {
    tag: 'the cardinal rule',
    big: 's vs SE',
    h: 'spread vs precision',
    text: 'Standard deviation describes mouse diversity; standard error describes how precisely you know the mean.'
  }
]);

// ==========================================
// SCENE 1: RAW BENCH MEASUREMENTS
// ==========================================
Proff.section('chapter 1 · at the bench: index, sum, and sample mean');
Proff.prose(
  'You begin by measuring fasting blood glucose in six control mice. Each tube gets an ID number, and each measurement produces a number on your bench meter. Here is how statistical notation records this raw lab work.'
);

Proff.scene({
  title: 'Bench Data: Mice, Sum, and the Mean',
  acc: 1,
  w: 1200,
  h: 560,
  controls: [
    { name: 'offset', label: 'glucose shift', min: -10, max: 10, step: 2, value: 0 }
  ],
  steps: [
    {
      cap: 'Six mice, indexed i = 1 to 6. Each dot is one fasting glucose reading xᵢ in mg/dL.',
      info: {
        see: ['Six dots: individual mouse blood glucose readings', 'x-axis: mouse replicate ID (i = 1 to 6)', 'y-axis: blood glucose level in mg/dL'],
        read: ['Subscript i labels which mouse you are observing', 'xᵢ is the numerical measurement for mouse i', 'n = 6 is your sample size (total mice)']
      }
    },
    {
      cap: 'Sum ∑ xᵢ adds all readings. Dividing by sample size n = 6 gives sample mean x̄.',
      info: {
        see: ['Horizontal line: sample mean x̄', 'All readings cluster above and below this average line'],
        read: ['Capital sigma ∑ means sum: add all measurements', 'Sample mean x̄ is the balance point of your cohort', 'x̄ is computed from data, so it uses Latin letters']
      }
    },
    {
      cap: 'Dashed vertical lines show deviations (xᵢ − x̄). Dividing their squared sum by df = 5 gives s.',
      info: {
        see: ['Dashed lines: gap from each mouse to the average', 'Pink band: sample standard deviation s (typical spread)'],
        read: ['Standard deviation s measures mouse-to-mouse diversity', 'Degrees of freedom df = n − 1 = 5 because x̄ is fixed', 'You divide by n − 1 to avoid underestimating true spread']
      }
    }
  ],
  info: {
    notation: {
      i: ['mouse index (1st, 2nd, ...)', 'i = 1 to 6 on x-axis'],
      'x_i': ['glucose reading for mouse i', 'x₁ = 98 mg/dL for mouse 1'],
      n: ['sample size (total mice measured)', 'n = 6 mice in this cohort'],
      '\\sum': ['capital sigma: sum all values', 'sum of all 6 readings'],
      '\\bar{x}': ['sample mean: sum divided by n', 'horizontal line at 114 mg/dL'],
      s: ['sample standard deviation', 's = 12.5 mg/dL spread band'],
      df: ['degrees of freedom: n − 1', 'df = 5 after estimating x̄']
    },
    try: 'Drag **glucose shift** to see the raw values and mean line slide together.'
  },
  draw(g, k, t, p) {
    const raw = [98, 104, 110, 118, 122, 132];
    const vals = raw.map(v => v + p.offset);
    const sum = vals.reduce((a, b) => a + b, 0);
    const xbar = sum / vals.length;
    const devSq = vals.reduce((a, b) => a + Math.pow(b - xbar, 2), 0);
    const sVal = Math.sqrt(devSq / (vals.length - 1));

    const ax = g.axes({
      x: 100, y: 50, w: 1000, h: 420,
      xd: [0.5, 6.5], yd: [80, 150],
      xt: [1, 2, 3, 4, 5, 6], yt: [90, 105, 120, 135],
      fmtx: v => `M${v}`,
      xl: 'mouse replicate (i)', yl: 'fasting glucose (mg/dL)',
      grid: true
    });

    // Step 0: Draw mouse dots
    vals.forEach((v, idx) => {
      const cx = ax.sx(idx + 1);
      const cy = ax.sy(v);
      g.circle(cx, cy, 8, { fill: 'c2', stroke: 'fig', sw: 2, free: true });
    });

    g.text(ax.x + 20, ax.y + 24, `n = 6 mice (x₁ … x₆)`, { size: 18, anchor: 'start', weight: 800, fill: 'c2' });

    // Step 1: Mean line
    if (k >= 1) {
      g.line(ax.x, ax.sy(xbar), ax.x + ax.w, ax.sy(xbar), { stroke: 'c1', sw: 3.5 });
      g.text(ax.x + ax.w - 20, ax.y + 24, `mean x̄ = ${xbar.toFixed(1)} mg/dL`, { size: 18, anchor: 'end', weight: 800, fill: 'c1' });
      g.text(ax.x + 220, ax.y + 24, `sum = ${sum.toFixed(0)}`, { size: 18, anchor: 'start', weight: 700, fill: 'c1' });
    }

    // Step 2: Deviations and standard deviation
    if (k >= 2) {
      vals.forEach((v, idx) => {
        const cx = ax.sx(idx + 1);
        g.line(cx, ax.sy(v), cx, ax.sy(xbar), { stroke: 'c3', sw: 2.5, dash: true });
      });

      // Spread band
      const yTop = ax.sy(xbar + sVal), yBot = ax.sy(xbar - sVal);
      g.rect(ax.x, yTop, ax.w, yBot - yTop, { fill: 'f3', stroke: 'none', op: 0.25, free: true });
      g.text(ax.x + 20, ax.y + 52, `s = ${sVal.toFixed(1)} mg/dL (df = 5)`, { size: 18, anchor: 'start', weight: 800, fill: 'c3' });
    }
  }
});

// ==========================================
// SCENE 2: POPULATION VS SAMPLE
// ==========================================
Proff.section('chapter 2 · the hidden reality: population vs sample');
Proff.prose(
  'Your 6 lab mice are not the entire species. In the wider animal colony (the population of size N), true biological glucose follows an unseeable distribution with fixed truth parameters: mean μ and spread σ. Every time you pull a cohort of n mice, your calculated mean x̄ wobbles around nature’s true μ.'
);

Proff.scene({
  title: 'Population Truth vs Lab Sample',
  acc: 2,
  w: 1200,
  h: 560,
  controls: [
    { name: 'n', label: 'cohort size (n)', min: 4, max: 28, step: 1, value: 6 },
    { name: 'sigma', label: 'true spread (σ)', min: 8, max: 20, step: 2, value: 12 },
    { type: 'button', name: 'reseed', label: 'new cohort' }
  ],
  steps: [
    {
      cap: 'The colony has true mean μ = 115 mg/dL and true spread σ = 12. You cannot test all N mice.',
      info: {
        see: ['Bell curve: true distribution of glucose across all mice', 'Dashed center line: true population mean μ = 115', 'Blue bracket: true biological spread σ = 12'],
        read: ['Greek letters (μ, σ) represent fixed biological constants', 'You can never measure all N individuals in nature', 'Parameters are true but permanently unseen']
      }
    },
    {
      cap: 'You measure n mice. Their sample mean x̄ estimates the unseeable population mean μ.',
      info: {
        see: ['Dots: your n sampled mice along the bottom', 'Yellow line: your calculated sample average x̄', 'Gap between x̄ and μ: random sampling wobble'],
        read: ['Latin letters (x̄, s) name numbers computed from lab data', 'Click **new cohort** to see how x̄ wobbles around true μ', 'Larger cohorts make x̄ stay closer to μ']
      }
    },
    {
      cap: 'A hat marks an estimate: μ̂ = x̄ and σ̂ = s. Sample statistics approximate true nature.',
      info: {
        see: ['Pink bracket: sample spread s (estimates true σ)', 'Yellow line: sample mean x̄ (estimates true μ)', 'Both estimates sit on the exact same glucose scale'],
        read: ['A hat (^) indicates a sample-based guess of a true parameter', 'μ̂ means: our lab estimate of nature’s true mean μ', 'As cohort size n grows, μ̂ converges on true μ']
      }
    }
  ],
  info: {
    notation: {
      N: ['population size (all mice in existence)', 'unseeable total in nature'],
      n: ['sample size (mice in your cage)', '6 mice in your cohort'],
      '\\mu': ['true population mean', 'colony truth at 115 mg/dL'],
      '\\bar{x}': ['sample mean (calculated average)', 'yellow line near 115 mg/dL'],
      '\\hat{\\mu}': ['estimator of true mean', 'μ̂ = x̄ from your bench data'],
      '\\sigma': ['true biological standard deviation', 'colony spread at 12 mg/dL'],
      s: ['sample standard deviation', 'calculated spread of your dots']
    },
    try: 'Raise **cohort size (n)** to 28. Notice how sample mean x̄ locks onto true μ.'
  },
  draw(g, k, t, p, s) {
    const mu = 115, sig = p.sigma, n = p.n;
    const r = Proff.rng(s.seed), zGen = Proff.stat.normal(r);
    const pool = [];
    for (let i = 0; i < 35; i++) pool.push(mu + zGen() * sig);
    const pts = pool.slice(0, n);
    const xbar = Proff.stat.mean(pts);
    const sVal = Proff.stat.sd(pts);

    const ax = g.axes({
      x: 100, y: 50, w: 1000, h: 420,
      xd: [70, 160], yd: [0, 0.065],
      xt: [80, 100, 115, 130, 150], yt: [],
      xl: 'fasting glucose (mg/dL)', yl: 'population density',
      grid: true
    });

    const pdf = x => Proff.stat.normPdf(x, mu, sig);

    // Colony distribution curve
    g.area(pdf, ax, mu - sig, mu + sig, { fill: 'f1', op: 0.5 });
    g.curve(pdf, ax, 70, 160, { stroke: 'c1', sw: 3 });

    // Center truth line
    const topY = pdf(mu);
    g.line(ax.sx(mu), ax.sy(0), ax.sx(mu), ax.sy(topY), { stroke: 'c1', sw: 2.5, dash: true });
    g.text(ax.sx(mu), ax.y + 24, 'truth μ = 115', { size: 20, anchor: 'middle', weight: 800, fill: 'c1' });
    g.text(ax.x + 20, ax.y + 24, 'population (N ≈ 10⁷ mice)', { size: 18, anchor: 'start', weight: 700, fill: 'c1' });

    // True spread bracket
    const ySig = ax.sy(0.054);
    const xSig0 = ax.sx(mu - sig), xSig1 = ax.sx(mu + sig);
    g.line(xSig0, ySig, xSig1, ySig, { stroke: 'c1', sw: 2.5 });
    g.line(xSig0, ySig - 6, xSig0, ySig + 6, { stroke: 'c1', sw: 2.5 });
    g.line(xSig1, ySig - 6, xSig1, ySig + 6, { stroke: 'c1', sw: 2.5 });
    g.text(ax.x + 20, ax.y + 52, `true spread σ = ${sig.toFixed(0)} mg/dL`, { size: 18, anchor: 'start', weight: 700, fill: 'c1' });

    // Step 1: Sample cohort dots & mean
    if (k >= 1) {
      const jit = Proff.rng(29);
      pts.forEach(v => {
        const clamped = Proff.clamp(v, 72, 158);
        const cy = ax.sy(0.005) + (jit() - 0.5) * 20;
        g.circle(ax.sx(clamped), cy, 6.5, { fill: 'c2', stroke: 'fig', sw: 1.5, op: 0.9, free: true });
      });

      const yTopXbar = pdf(xbar);
      g.line(ax.sx(xbar), ax.sy(0), ax.sx(xbar), ax.sy(yTopXbar), { stroke: 'c2', sw: 3.5 });
      g.text(ax.x + ax.w - 20, ax.y + 24, `sample mean x̄ = ${xbar.toFixed(1)}`, { size: 18, anchor: 'end', weight: 800, fill: 'c2' });
      g.text(ax.x + ax.w - 20, ax.y + 52, `cohort n = ${n} mice`, { size: 18, anchor: 'end', weight: 700, fill: 'c2' });
    }

    // Step 2: Estimates (hats) and sample spread s
    if (k >= 2) {
      const yS = ax.sy(0.046);
      const xS0 = ax.sx(Math.max(72, xbar - sVal)), xS1 = ax.sx(Math.min(158, xbar + sVal));
      g.line(xS0, yS, xS1, yS, { stroke: 'c3', sw: 2.5 });
      g.line(xS0, yS - 6, xS0, yS + 6, { stroke: 'c3', sw: 2.5 });
      g.line(xS1, yS - 6, xS1, yS + 6, { stroke: 'c3', sw: 2.5 });

      g.text(ax.x + 20, ax.y + 80, `sample spread s = ${sVal.toFixed(1)} mg/dL`, { size: 18, anchor: 'start', weight: 700, fill: 'c3' });
      g.text(ax.x + ax.w - 20, ax.y + 80, `estimates: μ̂ = ${xbar.toFixed(1)}, σ̂ = ${sVal.toFixed(1)}`, { size: 18, anchor: 'end', weight: 800, fill: 'c3' });
    }
  }
});

// ==========================================
// SCENE 3: SPREAD (s) VS STANDARD ERROR (SE)
// ==========================================
Proff.section('chapter 3 · the presentation dilemma: SD (s) vs SE (s ÷ √n)');
Proff.prose(
  'You are preparing a manuscript figure. A lab colleague asks: "Should our error bars show ± SD or ± SE?" This is where many papers stumble. Standard deviation (s) describes mouse diversity. Standard error (SE = s ÷ √n) describes how precisely you know the mean. Watch what happens when you quadruple the number of mice.'
);

Proff.scene({
  title: 'Standard Deviation (s) vs Standard Error (SE)',
  acc: 3,
  w: 1200,
  h: 560,
  controls: [
    { name: 'n', label: 'mice (n)', min: 4, max: 36, step: 1, value: 9 },
    { name: 'sigma', label: 'biology spread', min: 8, max: 20, step: 2, value: 12 },
    { type: 'button', name: 'reseed', label: 'new cohort' }
  ],
  steps: [
    {
      cap: 'Standard deviation s describes biological variation between mice. It does NOT shrink as n grows.',
      info: {
        see: ['Dots: individual mouse glucose readings', 'Pink bracket: sample spread s = 12.1 mg/dL', 's spans the natural diversity of individual animals'],
        read: ['s reflects real genetic and physiological diversity', 'Testing more mice gives a more accurate s, not a smaller s', 'Never use SE to describe population variation']
      }
    },
    {
      cap: 'Standard error SE = s ÷ √n measures how much the mean x̄ wobbles across repeat studies.',
      info: {
        see: ['Top bracket: sample spread s (stays wide)', 'Bottom bracket: standard error SE (much narrower)', 'Both centered at sample mean x̄'],
        read: ['SE measures the uncertainty of your mean estimate', 'SE shrinks because random highs and lows cancel out in x̄', 'SE is for hypothesis testing, not for describing spread']
      }
    },
    {
      cap: 'Quadrupling n from 9 to 36 cuts SE in half (√36 = 6 is 2× √9 = 3), while mouse spread s stays constant.',
      info: {
        see: ['At n = 9: SE is s ÷ 3 = 4.0 mg/dL', 'At n = 36: SE is s ÷ 6 = 2.0 mg/dL (halved)', 's remains steady near 12 mg/dL across all mice'],
        read: ['More mice sharpen your estimate of the mean', 'More mice do not make the biology more uniform', 'Reporting SE instead of SD to make error bars look tiny is misleading']
      }
    }
  ],
  info: {
    notation: {
      s: ['sample standard deviation (mouse spread)', 'top bracket, about 12 mg/dL'],
      SE: ['standard error: wobble of mean estimate', 'bottom bracket, s ÷ √n'],
      '\\sigma': ['true biological standard deviation', 'colony spread parameter, 12 mg/dL'],
      '\\sqrt{n}': ['square root of sample size', '√9 = 3 at start; divides s']
    },
    try: 'Drag **mice (n)** from 4 to 36. Watch SE plummet while s stays rock solid.'
  },
  draw(g, k, t, p, s) {
    const mu = 115, sig = p.sigma, n = p.n;
    const r = Proff.rng(s.seed), zGen = Proff.stat.normal(r);
    const pool = [];
    for (let i = 0; i < 40; i++) pool.push(mu + zGen() * sig);
    const pts = pool.slice(0, n);
    const xbar = Proff.stat.mean(pts);
    const sVal = Proff.stat.sd(pts);
    const seVal = sVal / Math.sqrt(n);

    const ax = g.axes({
      x: 100, y: 50, w: 1000, h: 420,
      xd: [70, 160], yd: [0, 100],
      xt: [80, 100, 115, 130, 150], yt: [],
      xl: 'fasting glucose (mg/dL)', yl: '',
      grid: true
    });

    // Step 0: Mouse dots and biological spread s
    const jit = Proff.rng(31);
    pts.forEach(v => {
      const clamped = Proff.clamp(v, 72, 158);
      const cy = ax.sy(75) + (jit() - 0.5) * 26;
      g.circle(ax.sx(clamped), cy, 6.5, { fill: 'c2', stroke: 'fig', sw: 1.5, op: 0.9, free: true });
    });

    // Mean marker
    g.circle(ax.sx(xbar), ax.sy(75), 8, { fill: 'c2', stroke: 'fig', sw: 2, free: true });
    g.line(ax.sx(xbar), ax.sy(60), ax.sx(xbar), ax.sy(90), { stroke: 'c2', sw: 3 });

    // Shaded biological spread band behind dots
    const xS0 = ax.sx(Math.max(72, xbar - sVal)), xS1 = ax.sx(Math.min(158, xbar + sVal));
    g.rect(xS0, ax.sy(90), xS1 - xS0, ax.sy(60) - ax.sy(90), { fill: 'f3', stroke: 'none', op: 0.25, free: true });

    // Spread bracket for s at y = 46
    const yS = ax.sy(46);
    g.line(xS0, yS, xS1, yS, { stroke: 'c3', sw: 3.5 });
    g.line(xS0, yS - 8, xS0, yS + 8, { stroke: 'c3', sw: 3.5 });
    g.line(xS1, yS - 8, xS1, yS + 8, { stroke: 'c3', sw: 3.5 });

    // Top labels
    g.text(ax.x + 20, ax.y + 24, `sample cohort: n = ${n} mice`, { size: 18, anchor: 'start', weight: 700, fill: 'c2' });
    g.text(ax.x + 20, ax.y + 52, `sample mean x̄ = ${xbar.toFixed(1)} mg/dL`, { size: 18, anchor: 'start', weight: 700, fill: 'c2' });
    g.text(ax.x + ax.w - 20, ax.y + 24, `sample spread s = ${sVal.toFixed(1)} mg/dL`, { size: 18, anchor: 'end', weight: 800, fill: 'c3' });
    g.text(ax.x + ax.w - 20, ax.y + 52, 'mouse diversity spread (SD)', { size: 18, anchor: 'end', weight: 600, fill: 'c3' });

    // Step 1: Standard error SE bracket and band
    if (k >= 1) {
      const xSE0 = ax.sx(Math.max(72, xbar - seVal)), xSE1 = ax.sx(Math.min(158, xbar + seVal));

      // Shaded SE precision band
      g.rect(xSE0, ax.sy(30), xSE1 - xSE0, ax.sy(10) - ax.sy(30), { fill: 'f4', stroke: 'none', op: 0.35, free: true });

      // SE bracket at y = 20
      const ySE = ax.sy(20);
      g.line(xSE0, ySE, xSE1, ySE, { stroke: 'c4', sw: 3.5 });
      g.line(xSE0, ySE - 8, xSE0, ySE + 8, { stroke: 'c4', sw: 3.5 });
      g.line(xSE1, ySE - 8, xSE1, ySE + 8, { stroke: 'c4', sw: 3.5 });

      // SE readouts
      g.text(ax.x + 20, ax.y + 80, `SE = ${seVal.toFixed(1)} mg/dL`, { size: 18, anchor: 'start', weight: 800, fill: 'c4' });
      g.text(ax.x + ax.w - 20, ax.y + 80, 'mean uncertainty (SE)', { size: 18, anchor: 'end', weight: 600, fill: 'c4' });
    }
  }
});

// ==========================================
// SCENE 4: TESTING, ALPHA, AND P-VALUE
// ==========================================
Proff.section('chapter 4 · proving the drug works: null, alpha, and p-value');
Proff.prose(
  'Now you give your metabolic compound to a treated cohort. Their glucose drops by 15 mg/dL compared to controls. Did the drug genuinely work, or did you just happen to pull 6 naturally healthier mice? Here is how hypothesis testing turns this into statistical evidence.'
);

Proff.scene({
  title: 'Hypothesis Testing: H₀, α, and the p-value',
  acc: 4,
  w: 1200,
  h: 560,
  controls: [
    { name: 'diff', label: 'glucose drop (mg/dL)', min: 0, max: 25, step: 1, value: 14 },
    { name: 'n', label: 'mice per group', min: 4, max: 30, step: 1, value: 10 }
  ],
  steps: [
    {
      cap: 'Null hypothesis H₀: the drug does nothing. The curve shows where test statistic t lands by luck.',
      info: {
        see: ['Curve: probability of seeing any t score if H₀ is true', 'Center at t = 0: exactly zero difference between groups'],
        read: ['Science assumes skepticism first: H₀ says the drug is inactive', 'Most experiments land near 0 if there is no real biological effect']
      }
    },
    {
      cap: 'Alpha α = 0.05 is your false-alarm threshold. Dashed lines mark the 5% rarest tail extremes.',
      info: {
        see: ['Dashed lines: critical t cutoff (about ±2.1)', 'Shaded outer tails: 5% rejection zone'],
        read: ['α is chosen BEFORE looking at the data', '0.05 means you accept a 1 in 20 chance of declaring a false hit']
      }
    },
    {
      cap: 'Signal ÷ SE gives t. The shaded tail area beyond your yellow line is the p-value.',
      info: {
        see: ['Yellow line: your experiment’s t score', 'Shaded tail area: p-value', 'p < 0.05: your result cleared the threshold'],
        read: ['p is the chance of data this extreme if H₀ were true', 'p is NOT the probability that your drug works', 'Small p means your 15 mg/dL drop is very hard to explain by luck alone']
      }
    }
  ],
  info: {
    notation: {
      H_0: ['null hypothesis: drug has zero effect', 'center of curve at t = 0'],
      H_1: ['alternative hypothesis: drug lowers glucose', 'claim that drop ≠ 0'],
      '\\alpha': ['significance threshold (false-positive rate)', '0.05 cutoff, dashed lines'],
      t: ['test statistic: signal ÷ standard error', 'vertical yellow line on curve'],
      p: ['p-value: chance of t this extreme under H₀', 'shaded tail area beyond t'],
      df: ['degrees of freedom: 2n − 2', 'controls thickness of t tails']
    },
    try: 'Raise **glucose drop** to 20 mg/dL. Watch t push into the tail and p plummet below 0.001.'
  },
  draw(g, k, t, p) {
    const df = 2 * p.n - 2;
    const se = 12.0 * Math.sqrt(2 / p.n);
    const tVal = p.diff / se;
    const crit = 2.10;

    const ax = g.axes({
      x: 100, y: 50, w: 1000, h: 420,
      xd: [-4.5, 4.5], yd: [0, 0.44],
      xt: [-4, -2, 0, 2, 4], yt: [0, 0.1, 0.2, 0.3, 0.4],
      xl: 'test statistic (t)', yl: 'probability density',
      grid: true
    });

    const pdf = x => Proff.stat.tPdf(x, df);

    // Null curve
    g.curve(pdf, ax, -4.5, 4.5, { stroke: 'muted', sw: 3 });

    // Center null line
    g.line(ax.sx(0), ax.sy(0), ax.sx(0), ax.sy(pdf(0)), { stroke: 'muted', sw: 2, dash: true });
    g.text(ax.sx(0), ax.y + 24, 'H₀: true difference = 0', { size: 18, anchor: 'middle', weight: 700, fill: 'muted' });

    // Step 1: Alpha cutoff
    if (k >= 1) {
      g.area(pdf, ax, crit, 4.5, { fill: 'f5' });
      g.area(pdf, ax, -4.5, -crit, { fill: 'f5' });
      g.line(ax.sx(crit), ax.sy(0), ax.sx(crit), ax.sy(0.25), { stroke: 'c5', sw: 2.5, dash: true });
      g.line(ax.sx(-crit), ax.sy(0), ax.sx(-crit), ax.sy(0.25), { stroke: 'c5', sw: 2.5, dash: true });
      g.text(ax.sx(3.4), ax.y + 24, 'α = 0.05 cutoff', { size: 18, anchor: 'middle', weight: 700, fill: 'c5' });
    }

    // Step 2: Observed t and p-value
    if (k >= 2) {
      const clampedT = Proff.clamp(tVal, -4.3, 4.3);
      const topT = pdf(clampedT);
      g.line(ax.sx(clampedT), ax.sy(0), ax.sx(clampedT), ax.sy(topT), { stroke: 'c2', sw: 3.5 });

      let pTail = 0;
      for (let x = Math.abs(tVal); x < 8; x += 0.05) pTail += pdf(x) * 0.05;
      const pTotal = Math.min(1.0, Math.max(0.0001, 2 * pTail));

      g.text(ax.x + 20, ax.y + 24, `t = ${tVal.toFixed(2)}`, { size: 22, anchor: 'start', weight: 800, fill: 'c2' });
      const pColor = pTotal < 0.05 ? 'c4' : 'c3';
      g.text(ax.x + 20, ax.y + 52, `p = ${pTotal < 0.001 ? '< 0.001' : pTotal.toFixed(3)}`, { size: 18, anchor: 'start', weight: 700, fill: pColor });
    }
  }
});

// ==========================================
// SCENE 5: LINEAR MODELS & REGRESSION
// ==========================================
Proff.section('chapter 5 · finding the optimal dose: linear regression');
Proff.prose(
  'To optimize your therapy, you administer six escalating doses (0, 2, 4, 6, 8, 10 mg/kg) and track glucose reduction. Here is how regression notation (y = β₀ + β₁x + ε) models drug potency and individual biological response.'
);

Proff.scene({
  title: 'Dose-Response: Slope, Fit, and Residuals',
  acc: 5,
  w: 1200,
  h: 560,
  controls: [
    { name: 'slope', label: 'potency slope (β₁)', min: 1.0, max: 3.5, step: 0.5, value: 2.0 },
    { name: 'noise', label: 'mouse variability', min: 0.5, max: 2.0, step: 0.5, value: 1.0 }
  ],
  steps: [
    {
      cap: 'Each dot is one mouse (dose xᵢ, glucose drop yᵢ). Intercept β₀ is baseline drop with 0 drug.',
      info: {
        see: ['Dots: paired measurements for each mouse', 'Point at dose 0: baseline intercept β₀ = 3.0 mg/dL'],
        read: ['x is the drug dose (predictor)', 'y is the glucose reduction (outcome)', 'β₀ is the placebo or baseline response']
      }
    },
    {
      cap: 'Slope β₁ is the biological effect size: how many mg/dL glucose drops per 1 mg/kg drug added.',
      info: {
        see: ['Solid line: fitted regression line ŷ', 'Slope triangle: 2 mg/kg dose across gives 2 × β₁ drop'],
        read: ['β₁ measures the drug’s potency in mg/dL per mg/kg', 'Steeper slope means a stronger, more potent medicine']
      }
    },
    {
      cap: 'Hat ŷ marks the fitted prediction. Vertical gaps eᵢ = yᵢ − ŷᵢ are residual biological noise ε.',
      info: {
        see: ['Dashed vertical lines: residuals eᵢ for each mouse', 'eᵢ measures how much each mouse departs from the trend'],
        read: ['y = β₀ + β₁x + ε: every mouse is line prediction plus residual error', 'Regression finds the line that minimizes the sum of squared residuals']
      }
    }
  ],
  info: {
    notation: {
      '\\beta_0': ['intercept: baseline outcome at dose 0', 'height of line at dose 0 mg/kg'],
      '\\beta_1': ['slope: glucose drop per 1 mg/kg drug', 'steepness of the fitted trend line'],
      '\\hat{y}': ['fitted prediction on the trend line', 'point directly on the line'],
      '\\epsilon': ['residual error: biological mouse noise', 'vertical gap from dot to line'],
      e_i: ['observed residual: yᵢ − ŷᵢ', 'length of dashed vertical gap']
    },
    try: 'Drag **potency slope** to make the dose-response line steeper.'
  },
  draw(g, k, t, p) {
    const b0 = 3.0;
    const b1 = p.slope;
    const xDoses = [0.0, 2.0, 4.0, 6.0, 8.0, 10.0];
    const rawRes = [-1.5, 2.5, -2.0, 3.0, -1.8, 1.5];
    const residuals = rawRes.map(v => v * p.noise);
    const pts = xDoses.map((x, i) => ({ x, y: b0 + b1 * x + residuals[i], yhat: b0 + b1 * x }));

    const ax = g.axes({
      x: 100, y: 50, w: 1000, h: 420,
      xd: [0, 10.5], yd: [0, 42],
      xt: [0, 2, 4, 6, 8, 10], yt: [0, 10, 20, 30, 40],
      xl: 'drug dose (mg/kg)', yl: 'glucose drop (mg/dL)',
      grid: true
    });

    // Step 0: Points and intercept
    pts.forEach(pt => {
      g.circle(ax.sx(pt.x), ax.sy(pt.y), 7, { fill: 'c2', stroke: 'fig', sw: 1.5, op: 0.9, free: true });
    });

    g.circle(ax.sx(0), ax.sy(b0), 8, { fill: 'c3', stroke: 'fig', sw: 2, free: true });
    g.text(ax.sx(0.6), ax.sy(b0) + 24, `β₀ (baseline) = ${b0.toFixed(1)} mg/dL`, { size: 18, anchor: 'start', weight: 800, fill: 'c3' });

    // Step 1: Fitted line and slope
    if (k >= 1) {
      g.line(ax.sx(0), ax.sy(b0), ax.sx(10), ax.sy(b0 + b1 * 10), { stroke: 'c1', sw: 3.5 });

      // Slope triangle at x = 4 to 6
      const xA = 4.0, xB = 6.0;
      const yA = b0 + b1 * xA, yB = b0 + b1 * xB;
      g.line(ax.sx(xA), ax.sy(yA), ax.sx(xB), ax.sy(yA), { stroke: 'c1', sw: 2, dash: true, free: true });
      g.line(ax.sx(xB), ax.sy(yA), ax.sx(xB), ax.sy(yB), { stroke: 'c1', sw: 2, dash: true, free: true });
      g.text(ax.sx(xB) + 12, (ax.sy(yA) + ax.sy(yB)) / 2, `β₁ = ${b1.toFixed(1)} mg/dL per mg/kg`, { size: 18, anchor: 'start', weight: 800, fill: 'c1' });
      g.text(ax.x + 20, ax.y + 24, 'fit: ŷ = β₀ + β₁x', { size: 20, anchor: 'start', weight: 800, fill: 'c1' });
    }

    // Step 2: Residuals
    if (k >= 2) {
      pts.forEach(pt => {
        g.line(ax.sx(pt.x), ax.sy(pt.y), ax.sx(pt.x), ax.sy(pt.yhat), { stroke: 'c3', sw: 2, dash: true });
      });
      g.text(ax.x + 20, ax.y + 52, 'residuals: e = y − ŷ', { size: 18, anchor: 'start', weight: 700, fill: 'c3' });
    }
  }
});

// ==========================================
// REFERENCE TABLES & CHEAT SHEET
// ==========================================
Proff.section('reference cheat sheet: greek vs latin vs hat');
Proff.compare(
  ['concept', 'population parameter (Greek)', 'sample statistic (Latin)', 'estimator (Hat)', 'biological meaning in the trial'],
  [
    ['mean (center)', 'μ (mu = 115 mg/dL)', 'x̄ (sample average)', 'μ̂ = x̄', 'True colony glucose vs your 6 mice.'],
    ['variance (spread²)', 'σ² (sigma squared)', 's² (sample variance)', 'σ̂²', 'Average squared distance of mice from mean.'],
    ['standard deviation', 'σ (sigma = 12 mg/dL)', 's (sample SD)', 'σ̂ = s', 'Real mouse-to-mouse biological diversity.'],
    ['effect size / slope', 'β₁ (true potency)', 'b₁ (regression slope)', 'β̂₁ = b₁', 'Glucose drop per mg/kg drug administered.'],
    ['baseline / intercept', 'β₀ (true baseline)', 'b₀ (sample intercept)', 'β̂₀ = b₀', 'Fasting glucose with zero drug given.']
  ]
);

Proff.section('testing decision reference');
Proff.compare(
  ['symbol', 'spoken name', 'exact role in the drug trial', 'what to watch out for'],
  [
    ['H₀', 'null hypothesis', 'Assumption that your drug does nothing (drop = 0).', 'You never prove H₀ true; you only fail to reject it.'],
    ['H₁', 'alternative hypothesis', 'Claim that the drug genuinely lowers glucose.', 'Must be specified before examining data.'],
    ['α', 'alpha (significance level)', 'Your pre-set false-alarm threshold (usually 0.05).', '0.05 means you accept a 1 in 20 risk of false discovery.'],
    ['p-value', 'probability value', 'Chance of seeing a 15 mg/dL drop if the drug is inactive.', 'p is NOT the probability that your drug is effective.'],
    ['t', 't statistic', 'Signal divided by noise: glucose drop ÷ SE.', 'Counts how many standard errors the drop sits from 0.'],
    ['CI', 'confidence interval', 'Range [x̄ ± t × SE] capturing true μ in 95% of repeats.', 'The true population mean μ is fixed; the interval wobbles.']
  ]
);

Proff.section('do not confuse: classic lab traps');
Proff.compare(
  ['notation A', 'notation B', 'crucial distinction', 'why it matters in the lab'],
  [
    ['SD (s)', 'SE (s ÷ √n)', 'SD is mouse diversity; SE is mean precision.', 'Reporting SE makes data look less variable than it is.'],
    ['p-value', 'α (alpha)', 'p is computed from data; α is your pre-set cutoff.', 'p tells you data extremity; α is your threshold decision rule.'],
    ['N', 'n', 'N is whole colony population; n is cage cohort size.', 'Formulas and degrees of freedom use n, never N.'],
    ['β₁', 'β̂₁', 'β₁ is true unmeasured drug potency; β̂₁ is estimate.', 'Your regression slope is an estimate with uncertainty.'],
    ['μ', 'x̄', 'μ is nature’s fixed truth; x̄ changes each experiment.', 'You never calculate μ; you only estimate it with x̄.']
  ]
);

Proff.section('three mental models');
Proff.tiles([
  {
    tag: 'as an alphabet',
    h: 'Greek = Nature, Latin = Lab',
    text: 'Think of Greek letters as true biological constants, and Latin letters as muddy bench measurements.'
  },
  {
    tag: 'as a shrinking ruler',
    h: 'Divide by square root of n',
    text: 'Biological spread (s) stays steady as you add mice, but uncertainty (SE = s ÷ √n) shrinks. More mice sharpen x̄.'
  },
  {
    tag: 'as a hat',
    h: 'The hat marks an estimate',
    text: 'Putting a hat on any Greek letter (μ̂, σ̂, β̂) declares: this is our lab best estimate of nature’s true value.'
  }
]);

Proff.section('test yourself');
Proff.quiz([
  {
    q: 'Your colleague reports mouse glucose as 114 ± 4 mg/dL. How do you know if 4 is biological variation or mean precision?',
    a: 'Check the error bar label: if it says **± SD**, 4 is biological spread between mice (s). If it says **± SE**, it is the wobble of the average (s ÷ √n), which is smaller by √n.'
  },
  {
    q: 'Why do we divide by n − 1 instead of n when calculating sample variance s² in 6 mice?',
    a: 'Because you already used the data once to calculate the mean x̄. Dividing by n − 1 (df = 5, Bessel correction) prevents s² from underestimating true colony variation σ².'
  },
  {
    q: 'If you expand your drug trial from 9 mice to 36 mice per group, what happens to s and SE?',
    a: 'Biological spread s stays roughly the same (~12 mg/dL). But standard error SE is cut in half because √36 = 6 is twice √9 = 3.'
  },
  {
    q: 'In the dose-response model y = β₀ + β₁x + ε, what does ε (epsilon) represent biologically?',
    a: 'ε is the individual biological variability between mice: genetic background, food intake, and measurement noise not captured by the linear dose trend.'
  }
]);
