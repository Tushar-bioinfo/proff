// Thorough Visual Guide to Statistical Notation for Beginners.
// Five interactive visual scenes covering the fundamental notation families,
// plus reference tables, mental models, and flip quizzes.

Proff.page({
  title: 'A Visual Guide to Statistical Notation',
  sub: 'From simple sums and sample counts to population truths, hypothesis tests, and linear models',
  eyebrow: 'visual guide',
  layout: 'article'
});

// ==========================================
// SECTION 1: THE CORE SPLIT IN NUMBERS
// ==========================================
Proff.section('the core split in numbers');
Proff.tiles([
  {
    big: 'N vs n',
    h: 'population vs sample',
    text: 'N is the full biological population (e.g. 10 million cells); n is what you measure (n = 8).'
  },
  {
    big: 'μ vs x̄',
    h: 'truth vs estimate',
    text: 'μ is the true unseeable mean; x̄ is the average calculated from your finite sample data.'
  },
  {
    big: 'σ vs s',
    h: 'spread vs wobble',
    text: 'σ is natural variation; s is sample spread. Standard error SE = s ÷ √n measures wobble of x̄.'
  }
]);

// ==========================================
// SCENE 1: BUILDING BLOCKS & BALANCE BEAM
// ==========================================
Proff.section('visual 1 · building blocks: index, sum, and mean');
Proff.scene({
  title: 'The Balance Beam: Index, Sum, and the Mean',
  acc: 1,
  w: 1200,
  h: 560,
  controls: [
    { name: 'shift', label: 'offset', min: -1.5, max: 1.5, step: 0.5, value: 0 }
  ],
  steps: [
    {
      cap: 'The index i numbers each observation xᵢ in your data table, from i = 1 to n = 5.',
      info: {
        see: ['Five blocks: individual measurements x₁ through x₅', 'Horizontal beam: the measurement axis'],
        read: ['Subscript i tells you which individual you are looking at', 'n is the total number of blocks (sample size)']
      }
    },
    {
      cap: 'Capital sigma ∑ adds all values. Dividing sum 25 by n = 5 gives mean x̄ = 5.0 at the fulcrum.',
      info: {
        see: ['Triangle: sample mean x̄ as the fulcrum', 'Left distances balance right distances perfectly'],
        read: ['∑ is the Greek capital S for Sum', 'Mean x̄ is literally the center of gravity of your data']
      }
    },
    {
      cap: 'Degrees of freedom df = n − 1. Once x̄ is fixed, the last value is locked to keep balance.',
      info: {
        see: ['Blue blocks: free to vary', 'Pink block: locked value', 'df = 4 free values out of 5'],
        read: ['You spend 1 degree of freedom estimating the mean', 'Only n − 1 independent pieces of information remain']
      }
    }
  ],
  info: {
    notation: {
      i: ['index numbering each observation', 'i = 1 to 5 here'],
      'x_i': ['the i-th measurement value', 'x₁ = 2 at the start'],
      n: ['sample size (total observations)', 'n = 5 blocks on the beam'],
      '\\sum': ['capital sigma: add all values', '2 + 3 + 5 + 7 + 8 = 25'],
      '\\bar{x}': ['sample mean: sum divided by n', '25 ÷ 5 = 5.0 at fulcrum'],
      df: ['degrees of freedom: n − 1', 'df = 4 free blocks']
    },
    try: 'Drag **offset** to watch the fulcrum x̄ slide while distances stay balanced.'
  },
  draw(g, k, t, p) {
    const raw = [2, 3, 5, 7, 8];
    const vals = raw.map(v => v + p.shift);
    const sum = vals.reduce((a, b) => a + b, 0);
    const xbar = sum / vals.length;

    const ax = g.axes({
      x: 100, y: 50, w: 1000, h: 420,
      xd: [0, 10], yd: [-1, 5],
      xt: [0, 2, 4, 6, 8, 10], yt: [],
      xl: 'measurement value (x)', yl: '',
      grid: false
    });

    const fy = ax.sy(2.0);

    // Horizontal beam
    g.line(ax.sx(0.5), fy, ax.sx(9.5), fy, { stroke: 'muted', sw: 5, free: true });

    // Step 0: Draw blocks
    vals.forEach((v, idx) => {
      const cx = ax.sx(v);
      const isLocked = k >= 2 && idx === vals.length - 1;
      const cTok = isLocked ? 'c3' : 'c1';
      g.rect(cx - 20, fy - 40, 40, 40, { fill: cTok.replace('c', 'f'), stroke: cTok, sw: 2.5, r: 4, free: true });
      g.text(cx, fy - 20, `x${idx + 1}`, { size: 18, anchor: 'middle', weight: 800, fill: 'ink' });
      g.text(cx, fy - 48, `${v.toFixed(1)}`, { size: 18, anchor: 'middle', weight: 600, mono: true, fill: 'muted' });
    });

    // Step 1: Fulcrum and mean
    if (k >= 1) {
      const fx = ax.sx(xbar);
      g.poly([[fx, fy + 2], [fx - 18, fy + 38], [fx + 18, fy + 38]], { fill: 'c2', stroke: 'none', close: true, free: true });
      g.text(fx, fy + 60, `x̄ = ${xbar.toFixed(1)} (mean)`, { size: 18, anchor: 'middle', weight: 800, fill: 'c2' });
      g.text(ax.x + 20, ax.y + 24, `sum = ${sum.toFixed(1)}`, { size: 18, anchor: 'start', weight: 800, fill: 'c1' });
    }

    // Step 2: Degrees of freedom
    if (k >= 2) {
      g.text(ax.x + ax.w - 20, ax.y + 24, 'df = n − 1 = 4', { size: 20, anchor: 'end', weight: 800, fill: 'c3' });
    }
  }
});

// ==========================================
// SECTION 2: GREEK VS LATIN REFERENCE TABLE
// ==========================================
Proff.section('the golden rule: Greek vs Latin vs Hat');
Proff.compare(
  ['concept', 'population parameter (Greek)', 'sample statistic (Latin)', 'estimator (Hat)', 'plain meaning'],
  [
    ['mean (center)', 'μ (mu)', 'x̄ (x-bar) or m', 'μ̂ (mu-hat)', 'The balance point of the distribution.'],
    ['variance (spread²)', 'σ² (sigma squared)', 's² (s squared)', 'σ̂²', 'Average squared distance from the mean.'],
    ['standard deviation', 'σ (sigma)', 's (or SD)', 'σ̂', 'Spread in original units (square root of variance).'],
    ['proportion (share)', 'p or π (pi)', 'p̂ or p', 'p̂ (p-hat)', 'Fraction of successes or events (0 to 1).'],
    ['regression slope', 'β (beta)', 'b or β̂', 'β̂ (beta-hat)', 'Change in outcome per unit increase in predictor.'],
    ['correlation', 'ρ (rho)', 'r', 'ρ̂ (rho-hat)', 'Linear association strength between -1 and +1.']
  ]
);

// ==========================================
// SCENE 2: POPULATION VS SAMPLE SIMULATOR
// ==========================================
Proff.section('visual 2 · population truth vs lab sample');
Proff.scene({
  title: 'Population Truth vs Lab Sample',
  acc: 2,
  w: 1200,
  h: 620,
  panels: [
    { id: 'dist', from: 0 },
    { id: 'compare', from: 2 }
  ],
  controls: [
    { name: 'n', label: 'sample size', min: 4, max: 28, step: 1, value: 8 },
    { name: 'sigma', label: 'spread (σ)', min: 1.2, max: 3.2, step: 0.2, value: 2.0 },
    { type: 'button', name: 'reseed', label: 'new sample' }
  ],
  steps: [
    {
      cap: 'The population has true mean μ and spread σ. In nature, you cannot observe all N individuals.',
      info: {
        see: ['Curve: true population distribution', 'Dashed line: true center μ', 'Shaded region: 68% of population within ±σ'],
        read: ['Greek letters name unseen population parameters', 'μ and σ are fixed constants in nature']
      }
    },
    {
      cap: 'You measure n samples xᵢ. Their center is sample mean x̄, which estimates the unseeable μ.',
      info: {
        see: ['Dots: n individual sample observations xᵢ', 'Solid line: sample mean x̄', 'Gap between x̄ and μ: sampling error'],
        read: ['Latin letters name numbers computed from data', 'Click **new sample** to see x̄ wobble around μ']
      }
    },
    {
      cap: 'A hat marks an estimate: μ̂ = x̄ and σ̂ = s. Sample numbers approximate the true constants.',
      info: {
        see: ['Left: sampling distribution', 'Right: parameter vs estimate bars', 'Sample values hover near truth'],
        read: ['Putting a hat on a Greek letter turns truth into an estimate', 'More samples make the estimate sharper']
      }
    }
  ],
  info: {
    notation: {
      N: ['population size (all individuals)', 'unseeable total in nature'],
      n: ['sample size (number of dots)', '8 observations at the start'],
      '\\mu': ['population mean (unseen truth)', 'true center at 10.00'],
      '\\bar{x}': ['sample mean (sample center)', 'yellow line near 10.00'],
      '\\hat{\\mu}': ['estimator of population mean', 'μ̂ = x̄ = 9.47 here'],
      '\\sigma': ['population standard deviation', 'true spread at 2.00'],
      s: ['sample standard deviation', 'calculated spread of dots']
    },
    try: 'Raise **sample size (n)** to 28. Notice how μ̂ = x̄ moves closer to μ = 10.'
  },
  draw(g, k, t, p, s) {
    const mu = 10, sig = p.sigma, n = p.n;
    const r = Proff.rng(s.seed), zGen = Proff.stat.normal(r);
    const pool = [];
    for (let i = 0; i < 30; i++) pool.push(mu + zGen() * sig);
    const pts = pool.slice(0, n);
    const xbar = Proff.stat.mean(pts);
    const sVal = Proff.stat.sd(pts);

    g.panel('dist', D => {
      const A = g.axes({
        ...D,
        xd: [2, 18], yd: [0, 0.45],
        xt: [4, 7, 10, 13, 16], yt: [0, 0.1, 0.2, 0.3, 0.4],
        xl: 'measurement x', yl: 'density',
        grid: true
      });

      const pdf = x => Proff.stat.normPdf(x, mu, sig);

      g.area(pdf, A, mu - sig, mu + sig, { fill: 'f1', op: 0.6 });
      g.curve(pdf, A, 2, 18, { stroke: 'c1', sw: 3 });

      const topY = pdf(mu);
      g.line(A.sx(mu), A.sy(0), A.sx(mu), A.sy(topY), { stroke: 'c1', sw: 2.5, dash: true });
      g.text(A.sx(mu), A.y + 24, 'μ = 10', { size: 20, anchor: 'middle', weight: 800, fill: 'c1' });

      if (k >= 1) {
        const op1 = k === 1 ? t : 1;
        g.fade(op1, g => {
          const jit = Proff.rng(19);
          pts.forEach(v => {
            const clamped = Proff.clamp(v, 2.3, 17.7);
            const cy = A.sy(0.035) + (jit() - 0.5) * 20;
            g.circle(A.sx(clamped), cy, 6.5, { fill: 'c2', stroke: 'fig', sw: 1.5, op: 0.9, free: true });
          });
          g.text(A.x + 20, A.y + 24, `${n} sample dots`, { size: 18, anchor: 'start', weight: 700, fill: 'c2' });

          const yTopXbar = pdf(xbar);
          g.line(A.sx(xbar), A.sy(0), A.sx(xbar), A.sy(yTopXbar), { stroke: 'c2', sw: 3.5 });
          g.text(A.x + A.w - 20, A.y + 24, `x̄ = ${xbar.toFixed(2)}`, { size: 18, anchor: 'end', weight: 800, fill: 'c2' });
        });
      }
    });

    g.panel('compare', P => {
      const B = g.axes({
        ...P,
        xd: [0, 2.5], yd: [0, 4.2],
        xt: [], yt: [0, 1, 2, 3, 4],
        xl: '', yl: 'spread comparison',
        grid: true
      });

      const drawBar = (cx, val, colToken, labelText) => {
        const capped = Math.min(4.1, Math.max(0.05, val));
        const top = B.sy(capped);
        const wBar = B.sx(0.6) - B.sx(0);
        const xLeft = B.sx(cx) - wBar / 2;
        g.rect(xLeft, top, wBar, B.y + B.h - top, { fill: colToken.replace('c', 'f'), stroke: colToken, sw: 3, free: true });
        g.text(B.sx(cx), B.y + B.h + 26, labelText, { size: 20, anchor: 'middle', weight: 800, fill: colToken });
        g.text(B.sx(cx), Math.max(B.y + 16, top - 16), val.toFixed(2), { size: 18, anchor: 'middle', weight: 700, mono: true, fill: colToken });
      };

      drawBar(0.75, sig, 'c1', 'σ (truth)');
      drawBar(1.75, sVal, 'c3', 's (estimate)');
    });
  }
});

// ==========================================
// SCENE 3: SPREAD (s) VS STANDARD ERROR (SE)
// ==========================================
Proff.section('visual 3 · the classic trap: spread (s) vs wobble (SE)');
Proff.scene({
  title: 'Standard Deviation (s) vs Standard Error (SE)',
  acc: 3,
  w: 1200,
  h: 560,
  panels: [
    { id: 'dots', from: 0 },
    { id: 'bars', from: 1 }
  ],
  controls: [
    { name: 'n', label: 'sample size', min: 4, max: 36, step: 1, value: 9 },
    { name: 'sigma', label: 'true spread', min: 1.0, max: 3.0, step: 0.5, value: 2.0 },
    { type: 'button', name: 'reseed', label: 'new sample' }
  ],
  steps: [
    {
      cap: 'Standard deviation s measures biological variation among individuals. It does not shrink as n grows.',
      info: {
        see: ['Dots: individual measurements', 'Bracket: sample spread ±s around x̄'],
        read: ['s describes real diversity in your biological population', 'More samples give a more reliable s, not a smaller s']
      }
    },
    {
      cap: 'Standard error SE = s ÷ √n measures how much x̄ wobbles across repeat experiments.',
      info: {
        see: ['Middle bar: sample spread s', 'Right bar: standard error SE', 'SE is visibly shorter than s'],
        read: ['SE measures the precision of your mean estimate', 'SE shrinks by the square root of n']
      }
    },
    {
      cap: 'Quadrupling n from 9 to 36 cuts SE in half, but leaves biological spread s unchanged.',
      info: {
        see: ['At n = 9: √9 = 3, so SE is s ÷ 3', 'At n = 36: √36 = 6, so SE is s ÷ 6'],
        read: ['Never use SE to describe population spread', 'SE is only for hypothesis testing and mean precision']
      }
    }
  ],
  info: {
    notation: {
      s: ['sample standard deviation (spread of individuals)', 'middle bar, about 2.00'],
      SE: ['standard error: wobble of sample mean', 'right bar, s ÷ √n'],
      '\\sigma': ['true biological standard deviation', 'left bar, 2.00'],
      '\\sqrt{n}': ['square root of sample size', '√9 = 3 at start; divides s']
    },
    try: 'Drag **sample size** from 4 to 36. Watch SE plummet while s stays tall.'
  },
  draw(g, k, t, p, s) {
    const mu = 10, sig = p.sigma, n = p.n;
    const r = Proff.rng(s.seed), zGen = Proff.stat.normal(r);
    const pool = [];
    for (let i = 0; i < 40; i++) pool.push(mu + zGen() * sig);
    const pts = pool.slice(0, n);
    const xbar = Proff.stat.mean(pts);
    const sVal = Proff.stat.sd(pts);
    const seVal = sVal / Math.sqrt(n);

    // Panel: data points and spread bracket
    g.panel('dots', D => {
      const A = g.axes({
        ...D,
        xd: [2, 18], yd: [0, 4],
        xt: [4, 7, 10, 13, 16], yt: [],
        xl: 'measurement x', yl: 'sample points',
        grid: true
      });

      const jit = Proff.rng(23);
      pts.forEach(v => {
        const clamped = Proff.clamp(v, 2.4, 17.6);
        const cy = A.sy(1.2) + (jit() - 0.5) * 36;
        g.circle(A.sx(clamped), cy, 6.5, { fill: 'c2', stroke: 'fig', sw: 1.5, op: 0.9, free: true });
      });

      g.text(A.x + 20, A.y + 24, `${n} sample dots`, { size: 18, anchor: 'start', weight: 700, fill: 'c2' });

      // Bracket for s
      const yS = A.sy(2.6);
      const x0 = A.sx(Math.max(2.4, xbar - sVal)), x1 = A.sx(Math.min(17.6, xbar + sVal));
      g.line(x0, yS, x1, yS, { stroke: 'c3', sw: 3 });
      g.line(x0, yS - 8, x0, yS + 8, { stroke: 'c3', sw: 3 });
      g.line(x1, yS - 8, x1, yS + 8, { stroke: 'c3', sw: 3 });
      g.text(A.x + A.w - 20, A.y + 24, `s = ${sVal.toFixed(2)}`, { size: 18, anchor: 'end', weight: 800, fill: 'c3' });

      // Mean line (stops below the bracket)
      g.line(A.sx(xbar), A.sy(0.4), A.sx(xbar), A.sy(1.8), { stroke: 'c2', sw: 3.5 });
      g.text(A.sx(xbar), A.sy(0.2), `x̄ = ${xbar.toFixed(2)}`, { size: 18, anchor: 'middle', weight: 800, fill: 'c2' });
    });

    // Panel: 3 bars comparing sigma, s, and SE
    g.panel('bars', P => {
      const B = g.axes({
        ...P,
        xd: [0, 3], yd: [0, 4.2],
        xt: [], yt: [0, 1, 2, 3, 4],
        xl: '', yl: 'size / error',
        grid: true
      });

      const drawBar = (cx, val, colToken, labelText) => {
        const capped = Math.min(4.1, Math.max(0.05, val));
        const top = B.sy(capped);
        const wBar = B.sx(0.56) - B.sx(0);
        const xLeft = B.sx(cx) - wBar / 2;
        g.rect(xLeft, top, wBar, B.y + B.h - top, { fill: colToken.replace('c', 'f'), stroke: colToken, sw: 3, free: true });
        g.text(B.sx(cx), B.y + B.h + 26, labelText, { size: 20, anchor: 'middle', weight: 800, fill: colToken });
        g.text(B.sx(cx), Math.max(B.y + 16, top - 16), val.toFixed(2), { size: 18, anchor: 'middle', weight: 700, mono: true, fill: colToken });
      };

      drawBar(0.55, sig, 'c1', 'σ');
      drawBar(1.50, sVal, 'c3', 's');
      drawBar(2.45, seVal, 'c4', 'SE');
    });
  }
});

// ==========================================
// SCENE 4: TESTING, ALPHA, AND P-VALUE
// ==========================================
Proff.section('visual 4 · testing decisions: null, alpha, and p-value');
Proff.scene({
  title: 'Hypothesis Testing: H₀, α, and the p-value',
  acc: 4,
  w: 1200,
  h: 560,
  controls: [
    { name: 'diff', label: 'observed gap', min: 0, max: 3.5, step: 0.1, value: 1.4 },
    { name: 'n', label: 'sample size', min: 4, max: 30, step: 1, value: 10 }
  ],
  steps: [
    {
      cap: 'Under null hypothesis H₀, no true difference exists. The bell curve predicts where t lands by luck.',
      info: {
        see: ['Curve: distribution of t if H₀ is true', 'Center at t = 0: no difference'],
        read: ['H₀ is the default skepticism in science', 'Most experiments land near 0 under the null']
      }
    },
    {
      cap: 'Alpha α = 0.05 is your pre-set threshold. Dashed lines mark the 5% rarest false-alarm tails.',
      info: {
        see: ['Dashed vertical lines: critical t cutoffs', 'Shaded outer areas: the 5% rejection zone'],
        read: ['α is chosen BEFORE collecting data', '0.05 means you accept a 1 in 20 chance of false alarm']
      }
    },
    {
      cap: 'The t statistic is gap ÷ SE. The shaded tail area beyond your t is the p-value.',
      info: {
        see: ['Yellow line: your observed t', 'Tail beyond yellow line: p-value', 'p < 0.05: past the dashed threshold'],
        read: ['p is the probability of data this extreme under H₀', 'p is NOT the probability that H₀ is true']
      }
    }
  ],
  info: {
    notation: {
      H_0: ['null hypothesis: no true effect exists', 'center of curve at t = 0'],
      H_1: ['alternative hypothesis: real effect exists', 'claim that difference ≠ 0'],
      '\\alpha': ['significance threshold (false-positive rate)', '0.05 cutoff, dashed lines'],
      t: ['test statistic: signal ÷ standard error', 'vertical yellow line on curve'],
      p: ['p-value: chance of t this extreme under H₀', 'shaded tail area beyond t'],
      df: ['degrees of freedom: n − 1', 'shapes the t distribution tails']
    },
    try: 'Raise **observed gap** to watch t slide into the tail and p drop below 0.05.'
  },
  draw(g, k, t, p) {
    const df = p.n - 1;
    const se = 2.0 / Math.sqrt(p.n);
    const tVal = p.diff / se;
    const crit = 2.05;

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
    g.text(ax.sx(0), ax.y + 24, 'H₀: difference = 0', { size: 18, anchor: 'middle', weight: 700, fill: 'muted' });

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

      // Approximate two-tailed p-value
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
Proff.section('visual 5 · linear models: slope, fit, and residuals');
Proff.scene({
  title: 'Linear Regression: Intercept, Slope, and Residuals',
  acc: 5,
  w: 1200,
  h: 560,
  controls: [
    { name: 'slope', label: 'slope (β₁)', min: 0.2, max: 1.2, step: 0.1, value: 0.7 },
    { name: 'noise', label: 'residual spread', min: 0.3, max: 1.5, step: 0.2, value: 0.6 }
  ],
  steps: [
    {
      cap: 'Points (xᵢ, yᵢ) scatter across the grid. The intercept β₀ is where the trend hits x = 0.',
      info: {
        see: ['Dots: paired measurements (xᵢ, yᵢ)', 'Point at x = 0: intercept β₀'],
        read: ['x is the predictor, y is the outcome', 'β₀ gives the baseline outcome value']
      }
    },
    {
      cap: 'Slope β₁ is the effect size: the change in outcome y for each 1-unit increase in predictor x.',
      info: {
        see: ['Solid line: fitted trend ŷ', 'Slope triangle: 1 unit across, β₁ units up'],
        read: ['β₁ is the biological effect size', 'Positive β₁ means y grows as x increases']
      }
    },
    {
      cap: 'Hat ŷ marks the fitted prediction. Vertical gaps eᵢ = yᵢ − ŷᵢ are residual errors ε.',
      info: {
        see: ['Dashed vertical lines: residuals eᵢ', 'Gap represents noise not captured by the line'],
        read: ['y = β₀ + β₁x + ε: every point is line plus residual error', 'Regression minimizes sum of squared residuals']
      }
    }
  ],
  info: {
    notation: {
      '\\beta_0': ['intercept: expected y when x = 0', 'height where line hits x = 0'],
      '\\beta_1': ['slope: effect size per unit x', 'steepness of the fitted line'],
      '\\hat{y}': ['fitted prediction on the line', 'point directly on the line'],
      '\\epsilon': ['residual error: unexplained noise', 'vertical gap from dot to line'],
      e_i: ['observed residual: yᵢ − ŷᵢ', 'length of dashed vertical gap']
    },
    try: 'Drag **residual spread** to widen the vertical gaps eᵢ between points and the line.'
  },
  draw(g, k, t, p) {
    const b0 = 1.8;
    const b1 = p.slope;
    const xPts = [1.2, 2.8, 4.2, 5.8, 7.2, 8.8];
    const residuals = [-0.4, 0.7, -0.6, 0.8, -0.5, 0.4].map(v => v * p.noise);
    const pts = xPts.map((x, i) => ({ x, y: b0 + b1 * x + residuals[i], yhat: b0 + b1 * x }));

    const ax = g.axes({
      x: 100, y: 50, w: 1000, h: 420,
      xd: [0, 10], yd: [0, 14],
      xt: [0, 2, 4, 6, 8, 10], yt: [0, 3, 6, 9, 12],
      xl: 'predictor (x)', yl: 'outcome (y)',
      grid: true
    });

    // Step 0: Points and intercept
    pts.forEach(pt => {
      g.circle(ax.sx(pt.x), ax.sy(pt.y), 7, { fill: 'c2', stroke: 'fig', sw: 1.5, op: 0.9, free: true });
    });

    g.circle(ax.sx(0), ax.sy(b0), 8, { fill: 'c3', stroke: 'fig', sw: 2, free: true });
    g.text(ax.sx(0.5), ax.sy(b0 - 1.1), `β₀ (intercept) = ${b0.toFixed(1)}`, { size: 18, anchor: 'start', weight: 800, fill: 'c3' });

    // Step 1: Fitted line and slope
    if (k >= 1) {
      g.line(ax.sx(0), ax.sy(b0), ax.sx(10), ax.sy(b0 + b1 * 10), { stroke: 'c1', sw: 3.5 });

      // Slope triangle at x = 4 to 6
      const xA = 4.0, xB = 6.0;
      const yA = b0 + b1 * xA, yB = b0 + b1 * xB;
      g.line(ax.sx(xA), ax.sy(yA), ax.sx(xB), ax.sy(yA), { stroke: 'c1', sw: 2, dash: true, free: true });
      g.line(ax.sx(xB), ax.sy(yA), ax.sx(xB), ax.sy(yB), { stroke: 'c1', sw: 2, dash: true, free: true });
      g.text(ax.sx(xB) + 12, (ax.sy(yA) + ax.sy(yB)) / 2, `β₁ = ${b1.toFixed(1)}`, { size: 18, anchor: 'start', weight: 800, fill: 'c1' });
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
// SECTION 3: TESTING & DECISIONS TABLE
// ==========================================
Proff.section('testing, decisions and models');
Proff.compare(
  ['notation', 'spoken name', 'exact role in statistics', 'what to watch out for'],
  [
    ['H₀', 'null hypothesis', 'Baseline claim: no effect, no difference, or parameter = 0.', 'You never prove H₀ true; you only fail to reject it.'],
    ['H₁ or H_a', 'alternative hypothesis', 'Claim that a real biological effect or difference exists.', 'Specify direction (one- or two-sided) before tests.'],
    ['α', 'alpha (significance level)', 'Pre-set false-positive risk threshold (usually 0.05).', 'Chosen BEFORE looking at data; 0.05 means 1 in 20 false calls.'],
    ['p-value', 'probability value', 'Chance of data as extreme as observed if H₀ holds.', 'p is NOT the probability that H₀ is true or false.'],
    ['t', 't statistic', 'Signal divided by noise: (x̄ - μ₀) ÷ SE.', 'Counts how many standard errors the sample sits from null.'],
    ['CI', 'confidence interval', 'Range [x̄ ± t × SE] capturing μ in 95% of repeat runs.', 'The population mean μ is fixed; the interval wobbles.'],
    ['P(A | B)', 'conditional probability', 'Probability of event A occurring given B happened.', 'P(data | H₀) is p-value; P(H₀ | data) is Bayesian.'],
    ['X ~ N(μ, σ²)', 'distributed as', 'Random variable X follows a Normal distribution.', 'Second parameter in formulas is variance (σ²), not SD.']
  ]
);

// ==========================================
// SECTION 4: DO NOT CONFUSE
// ==========================================
Proff.section('do not confuse');
Proff.compare(
  ['notation A', 'notation B', 'crucial distinction', 'why it matters in the lab'],
  [
    ['SD (s)', 'SE (s ÷ √n)', 'SD is biological spread; SE is estimate uncertainty.', 'Reporting SE makes data look less variable than it is.'],
    ['p-value', 'α (alpha)', 'p is computed from data; α is pre-chosen threshold.', 'p tells you data extremity; α is your threshold rule.'],
    ['N', 'n', 'N is full population size; n is your sample size.', 'Degrees of freedom and formulas use n, never N.'],
    ['β', 'β̂ (beta-hat)', 'β is true unmeasured slope; β̂ is regression estimate.', 'In DESeq2, log2FoldChange is β̂; Wald tests if β = 0.'],
    ['μ', 'x̄', 'μ is fixed truth in nature; x̄ changes each experiment.', 'You never calculate μ; you only estimate it with x̄.']
  ]
);

// ==========================================
// SECTION 5: THREE ANGLES
// ==========================================
Proff.section('three angles');
Proff.tiles([
  {
    tag: 'as an alphabet',
    h: 'Greek = Truth, Latin = Lab',
    text: 'Think of Greek letters as true constants in nature, and Latin letters as muddy lab measurements.'
  },
  {
    tag: 'as a shrinking ruler',
    h: 'Divide by square root of n',
    text: 'Spread (s) stays constant as you add samples, but uncertainty (SE = s ÷ √n) shrinks. More samples sharpen x̄.'
  },
  {
    tag: 'as a hat',
    h: 'The hat marks an estimate',
    text: 'Putting a hat on any symbol (θ̂, μ̂, ŷ) means: this is our best mathematical guess at the true value.'
  }
]);

// ==========================================
// SECTION 6: TEST YOURSELF
// ==========================================
Proff.section('test yourself');
Proff.quiz([
  {
    q: 'A paper reports mouse weights as 24.2 ± 1.1 g. Is 1.1 biological variation or mean precision?',
    a: 'Check the label: if it says **± SD**, it is biological spread (s). If it says **± SE** (or SEM), it is the wobble of the mean (s ÷ √n), which is smaller by √n.'
  },
  {
    q: 'Why do we divide by n - 1 instead of n when calculating sample variance s²?',
    a: 'Because you already used the data once to calculate x̄. Dividing by n - 1 (Bessel correction) removes bias so s² accurately estimates σ².'
  },
  {
    q: 'If you quadruple sample size n from 9 to 36, what happens to s and SE?',
    a: 'Sample spread s stays about the same (it estimates σ). Standard error SE is cut in half because √36 = 6 is twice √9 = 3.'
  },
  {
    q: 'In regression y = β₀ + β₁ x + ε, why does ε (epsilon) appear?',
    a: 'ε is the random residual error: biological noise or measurement wobble that the linear formula cannot explain.'
  }
]);
