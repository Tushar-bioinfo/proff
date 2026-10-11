Examples, not limits. For "show me the notation in deep-learning papers" requests (L4 study page + calc traces). Worked example: `examples/study-dl-notation/`.

## Page order (simple → common → nested)
1. Indices and shapes: x_ij, x⁽ⁱ⁾, x_{:,j}, X ∈ ℝ^{N×d}. Matrix with the picked row/column lit; sliders for i and j; readout drawn with `g.tex`.
2. Σ, Π, 1/N, loss: per-sample bars → sum tower → mean line → product vs sum of logs. Slider on one sample's probability.
3. softmax, argmax, 1[·]: logits → e^(z/τ) → p, temperature slider; panels, one figure per step.
4. p, q_θ, ∼, 𝔼, H(p,q), KL: paired bars, then per-class terms, then sampled draws against the exact value (button re-draws).
5. ∇, η, θ ← θ − η∇L, θ̂, θ*: loss curve with tangent, one update, repeated updates, star for θ*. Slider on η (show overshoot near 2).
6. Chain rule: forward chain of boxes with values, backward arrows each carrying one local slope, product line built step by step. Slider on w.
7. Nested forms as `calctrace` traces: layer stack `W⁽²⁾σ(W⁽¹⁾x+b⁽¹⁾)+b⁽²⁾` and attention `softmax(QKᵀ/√d_k)V`. One step per piece of the formula, cell-by-cell.
8. Symbol atlas (`Proff.compare`): objects and sizes · operators · probability and sets · hats/stars/bars · common nested forms read inside-out · "do not confuse" · quiz.

## i-card rule
Every figure's `info.notation` row is `[meaning, example with the number on screen]`. Compute the example from the same variables that draw the figure, at the slider's starting value. Use plain Unicode in the example (x₂₃, x⁽²⁾), never raw TeX: the audit flags `_{}` and `^{}` there. The TeX key (left) is rendered by KaTeX.

## Symbols worth a row (key → one-line meaning)
- Index: i sample, j feature, k class, t step, l layer, N samples, d width, B batch, T length.
- Object: x, X, y, ŷ, W, b, θ, z (logit), a (pre-activation), h (activation), p, q.
- Operator: Σ, Π, ∇, ∂, argmax, ‖·‖, ᵀ, ⊙, ∘, 1[·], [a; b], ← / :=.
- Probability: p(y|x), p_θ, x∼p, 𝔼, 𝒩(μ,σ²), H, KL(p‖q), ℝ^d, [N], |S|.
- Marks: hat = estimated, star = optimal, bar = averaged, tilde/prime = modified copy, (t) = step.

## Gotchas found while building it
- calctrace: pass `symbols` or `tex` so the card is auto-written; user `info` keys override auto keys. Keep distinct logits (no ties) so argmax is unambiguous.
- Kit: a reduce/broadcast result drawn to the right of its input needs room for its row labels (fixed in `kit/calc.js`: operator now sits in the gap).
- Audit limits that bite: ≤24 labels per figure (drop operator signs and per-box index tags before splitting), a dashed line must not cross value labels (hide value labels once a line is shown), labels ≤7 words (put long arithmetic in `g.tex`).
- Show every nested formula inside-out first as a table, then as the animated trace; both say the same steps in the same order.
