import os, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, os.environ.get("PROFF_SCRIPTS", str(HERE.parents[1] / "scripts")))
(HERE / "data").mkdir(exist_ok=True)
from calctrace import Trace

# A tiny two-layer network: 3 inputs -> 4 hidden units (ReLU) -> 3 class scores.  z2 = W2 relu(W1 x + b1) + b2
t = Trace("One forward pass", i="unit", j="input")
x = t.matrix("x", [[2], [-1], [1]], rows=["x1", "x2", "x3"], label="input", show=False)
W1 = t.matrix("W1", [[1, 0, 1], [0.5, -1, 0], [-1, 1, 1], [0, 1, -1]], rows=["u1", "u2", "u3", "u4"], cols=["x1", "x2", "x3"],
              label="layer-1 weights", show=False)
b1 = t.matrix("b1", [[0.5], [-1], [0.5], [1]], rows=["u1", "u2", "u3", "u4"], label="layer-1 bias", show=False)
t.show(x, W1, b1, title="Inputs and layer-1 parameters",
       cap="Three input numbers, four hidden units. Each unit has one weight per input and one bias.",
       info={"text": "Superscript in brackets names the **layer**: W⁽¹⁾ belongs to layer 1. It is not a power.",
             "notation": {"x_{i}": ["input number i", "x₁ = 2"], "W^{(1)}_{ij}": ["layer-1 weight from input j to unit i", "unit u1, input x1 = 1"],
                          "b^{(1)}_{i}": ["layer-1 bias of unit i", "unit u1 = 0.5"]}})
a1 = t.matmul(W1, x, name="a1", label="weighted sums", tex=r"a^{(1)}=W^{(1)}x", expand=2,
              cap="Each hidden unit multiplies its weights by the inputs and adds them up.",
              info={"text": "Matrix times vector: row i of W is dotted with x. Shapes: (4×3)(3×1) → 4×1. The inner 3s must match and vanish.",
                    "notation": {"a^{(1)}_{i}": ["weighted sum for unit i", "u1: 1×2 + 0×(−1) + 1×1 = 3"]}})
z1 = t.ewise(a1, "+", b1, name="z1", label="pre-activation", tex=r"z^{(1)}=a^{(1)}+b^{(1)}", expand=2,
             cap="Add each unit's bias. Same shape, so cell i meets cell i.",
             info={"notation": {"z^{(1)}_{i}": ["pre-activation: the sum before the nonlinearity", "u1: 3 + 0.5 = 3.5"]}})
h1 = t.map(z1, "relu", name="h1", label="hidden activation", f=lambda v: max(0.0, v), cell="max(0, {x})", symbol="ReLU",
           tex=r"h^{(1)}=\sigma\!\left(z^{(1)}\right),\ \sigma(u)=\max(0,u)", expand=4,
           cap="ReLU keeps positive numbers and sets negative ones to 0. Units u3 and u4 go silent.",
           info={"text": "σ here is **a nonlinearity**, applied to each cell alone. It is not the sigmoid unless the paper says so.",
                 "notation": {"\\sigma(\\cdot)": ["activation function, applied cell by cell", "σ(−1.5) = max(0, −1.5) = 0"],
                              "\\max(0,u)": ["the larger of 0 and u", "max(0, 3.5) = 3.5"],
                              "h^{(1)}_{i}": ["output of hidden unit i", "u1 = 3.5"]}})
W2 = t.matrix("W2", [[0.5, 0.5, -1, 0], [-0.5, 1, 0.5, 1], [0, -0.5, 1, 0.5]], rows=["tumour", "stroma", "immune"],
              cols=["u1", "u2", "u3", "u4"], label="layer-2 weights", show=False)
b2 = t.matrix("b2", [[0], [0.5], [-0.25]], rows=["tumour", "stroma", "immune"], label="layer-2 bias", show=False)
t.show(h1, W2, b2, title="Layer 2 takes h as its input",
       cap="The output of layer 1 becomes the input of layer 2. Same pattern, new weights.",
       info={"text": "Layer l reads the output of layer l−1: h⁽¹⁾ plays the role x played before.",
             "notation": {"W^{(2)}_{kj}": ["layer-2 weight from hidden unit j to class k", "tumour, u1 = 0.5"],
                          "b^{(2)}_{k}": ["layer-2 bias of class k", "stroma = 0.5"]}})
a2 = t.matmul(W2, h1, name="a2", label="weighted sums", tex=r"a^{(2)}=W^{(2)}h^{(1)}", expand=1,
              cap="Shapes (3×4)(4×1) → 3×1. Silent units add nothing.",
              info={"notation": {"a^{(2)}_{k}": ["weighted sum for class k", "tumour: 0.5×3.5 + 0.5×1 − 1×0 + 0×0 = 2.25"]}})
z2 = t.ewise(a2, "+", b2, name="z2", label="logits", expand=3,
             tex=r"z^{(2)}=W^{(2)}\,\sigma\!\left(W^{(1)}x+b^{(1)}\right)+b^{(2)}",
             cap="Add the bias. Read the whole formula from the inside out: it is the four steps you just watched.",
             info={"text": "**Inside-out:** W⁽¹⁾x + b⁽¹⁾ → σ(·) → W⁽²⁾· → + b⁽²⁾. The scores z⁽²⁾ are called logits; softmax turns them into probabilities.",
                   "notation": {"z^{(2)}_{k}": ["logit: raw score of class k", "tumour = 2.25"],
                                "\\sigma\\!\\left(\\cdots\\right)": ["the nonlinearity wraps the whole bracket", "σ(W⁽¹⁾x + b⁽¹⁾) = h⁽¹⁾ = [3.5, 1, 0, 0]"]}})
t.symbols(x="x", W1="W^{(1)}", b1="b^{(1)}", a1="a^{(1)}", z1="z^{(1)}", h1="h^{(1)}", W2="W^{(2)}", b2="b^{(2)}", a2="a^{(2)}", z2="z^{(2)}")
t.save(HERE / "data/forward.json")
