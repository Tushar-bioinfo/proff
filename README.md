# Proff v3

A first-principles tutor for Claude, Codex, Cursor, Gemini, Muse, claude.ai and ChatGPT.

- **L1** (default): ~150 words — the answer, one example, the caveat that matters.
- **L2**: a predict-first question, 1–3 diagrams, the key concepts, one exam angle.
- **L3**: a detailed write-up (prerequisites, mechanism, worked example, where it breaks, exam angles, what to read next) plus an interactive 16:9 HTML deck (dark Block Frame theme, aurora palette): step-by-step SVG diagrams, step-by-step calculations, a live simulation, exam-angle and quiz flip cards.
- **Images**: a generated "mental model" image, only when you ask.
- **Modes**: `quiz me` (3–5 graded questions, one at a time) and `guide me` / `socratic` / `thinker` (one question at a time, hint ladder).
- **Writing**: STE-80 (short active sentences; terms, numbers and hedges kept). Say `plain` for normal prose.

The model writes only a small JSON spec; `scripts/render.py` turns it into the deck, so the model never reads CSS or JS.

## Install

Claude Code
```
claude plugin marketplace add Tushar-bioinfo/proff
claude plugin install proff@proff
```

Codex / Cursor / Gemini / other agents: link or copy `skills/proff` into the tool's skills folder.

claude.ai: upload `dist/proff-claude.zip`. ChatGPT: upload `dist/proff-chatgpt.zip` as a skill, or paste `dist/proff-instructions.md` into a custom GPT / project. Build them with `tools/build.sh`.

## Try the example
```
python3 skills/proff/scripts/render.py skills/proff/examples/bootstrap.json -o deck.html --embed
python3 skills/proff/scripts/snap.py deck.html   # screenshots, layout check, sheet.png + svg.png (needs playwright)
```

## Layout
```
skills/proff/SKILL.md      router: writing rules, sources, level + mode table
skills/proff/levels/       L2.md, L3.md (spec schema)
skills/proff/modes/        quiz.md, guide.md
skills/proff/ref/svg.md    SVG diagram kit (classes, step builds, patterns)
skills/proff/ref/image.md  image prompt template, per-environment calls (on request only)
skills/proff/scripts/      render.py, snap.py, image.py, log.py
skills/proff/assets/       blockframe-dark.css, deck.js
```

Theme adapted from the Block Frame template in [frontend-slides](https://github.com/zarazhangrui/frontend-slides) (MIT, © 2025 Zara Zhang); see `skills/proff/assets/NOTICE`.
