# Image — only when the user asks

**Do not make an image unless the user asks for one** ("image", "illustrate", "draw it as a picture"). By default, diagrams are `svg` slides (`ref/svg.md`). Never offer an image as part of the answer itself; the offer line may mention it.

When asked, make one "mental model" image. Keep image text short: a title, a subtitle, two callouts, one inner-monologue line. Numbers and formulas go on slides.

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
  It asks Codex to make the image (about 1–2 minutes). Exit code 2 = no image tool; say so.
- **ChatGPT web:** make the image with the built-in image generator and show it in chat.
- **claude.ai, or no image tool:** say there is no image tool here. Offer an `svg` slide instead.

To put it in a deck: `{"type": "image", "src": "img/<topic>.png", "caption": "...", "notes": [...]}` and render with `--embed` so the file carries the image.

**Never say an image was made unless the file exists or the image is visible in chat.** Check the text in the image; if a word is wrong, say so or regenerate once.
