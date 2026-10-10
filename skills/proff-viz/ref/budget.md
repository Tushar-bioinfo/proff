# Budget modes

## efficient (default)
- Kit drawing, `bio.js`, `plot.py`, `calctrace.py`. All free and local.
- One build–check–look loop per defect, at most 3 rounds.
- No generated images by default, no second-opinion reviewers. Make an image only when the user asks.
- Spend tokens on the story and the numbers, not on decoration.

## premium (user asks: "premium", "best", "go all out")
- Everything above, plus:
- At most one generated **context image** per page (no text in it; labels drawn by the kit on top). Images come from the user's own Gemini or Codex subscription: a Claude model asks one of them for the asset (`ref/image.md`) rather than calling a paid image API.
- More scenes (up to 12) and an extra explore scene for the key parameter.
- One independent review of the finished page by a different model if the user's setup allows it: it gets the contact sheets and the L3 write-up, and reports missing steps, wrong science, and unclear pictures.

Whatever the mode: a cheaper method that shows the idea correctly beats an expensive one that looks nicer.
