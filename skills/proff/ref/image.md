# Image: only when the user asks, or in premium mode for one context picture

Diagrams are kit scenes. An image is for a realistic context picture only (a tissue, a cell culture flask, a sequencer). It must contain **no text, numbers, or labels**: the kit draws those on top with `g.img` + `g.label`.

## Prompt template
```
[subject, e.g. "a cross-section of a T75 cell culture flask with adherent cells"], clean scientific illustration,
flat shading, near-black background (#121214), accents in pastel blue (#8feaf7), yellow (#f5c030) and pink (#fe90e8),
generous empty space around the subject, centred. STRICT: no text, no letters, no numbers, no labels, no watermark, no faces, no emojis.
```

## How
Images are made by Gemini or Codex on the user's subscription. Claude models do not draw them; they ask one of those agents.
- **Codex**: `scripts/image.py --out <topic>/img/<name>.png --subject "..."` runs the Codex CLI's image tool (exit 2 = Codex not installed).
- **Gemini, or a Claude model with a delegation tool**: send Gemini the filled prompt (`scripts/image.py ... --print` prints it) and the output path `<topic>/img/<name>.png`.
- **Gemini or Codex running this skill itself**: use your own image tool with the filled prompt.
- Then place it: `g.img('<name>.png', x, y, w, h)` and label parts with `g.label`.
