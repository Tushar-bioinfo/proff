# One image per L3 lesson

Make one "mental model" image. Keep image text short: a title, a subtitle, two callouts, one inner-monologue line. Numbers and formulas go on slides.

## Prompt template
Fill the brackets. Keep the rest exactly.

```
Visual Scene: Dark teal, indigo, and slate background; [tissue slice / network / scene] featuring [cyan DAPI nuclei, mint membranes, pink/gold markers].
Header: Compact white handwritten title '[TOPIC TITLE]' with subtitle '[Method or Question]'.
Callout Notes: '[Primary mechanism / baseline]', '[Proposed method / outcome]'.
Inner Monologue: '[intuitive scientific takeaway in lowercase]'.
Rules: Thin single-stroke white pen lines, polygon boundaries, white arrows, ample negative space. STRICT: NO emojis, faces, hearts, or sparkles.
```

## By environment
- **Codex (agent):** use your own image generation tool with the filled prompt. Save it as `img/<topic>.png` next to `spec.json`.
- **Claude Code, Cursor, Gemini, Muse (shell + Codex CLI installed):**
  ```
  python3 scripts/image.py --out img/<topic>.png --title "..." --subtitle "..." \
    --scene "..." --features "..." --callout1 "..." --callout2 "..." --monologue "..."
  ```
  It asks Codex to make the image (about 1–2 minutes). Exit code 2 = no image tool; skip the image.
- **ChatGPT web:** make the image with the built-in image generator and show it in chat. If the file is not reachable from the code sandbox, leave the `image` slide out and use a `flow` or `svg` slide.
- **claude.ai, or no image tool:** skip the image. Use an `svg` or `flow` slide for the mental model.

Then add to the spec: `{"type": "image", "src": "img/<topic>.png", "caption": "...", "notes": [...]}`.

**Never say an image was made unless the file exists or the image is visible in chat.** Check the text in the image; if a word is wrong, say so or regenerate once.
