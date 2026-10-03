# Proff v3.2

A first-principles tutor for Claude, Codex, Cursor, Gemini, Muse, claude.ai and ChatGPT.

- **L1**: short answer, example, caveat.
- **L2**: predict first, diagrams, concepts, exam angle.
- **L3**: full write-up plus an interactive HTML deck: stepped SVG scenes, calculations, simulations, and recall cards.
- **L3 deck** or **deck only**: build and check the deck; reply with one line, its path.
- **Team**, on request: orchestrator storyboards; the named implementer writes the spec; one fix round. No nested delegation.
- Math uses LaTeX: KaTeX online, readable raw source offline. Each math slide defines symbols in a notation card. Diagram cards open with a click or `n`.
- Mermaid flows are a trial: overview then zoom-ins. Linear `flow` and pictorial SVG remain available.
- Images only on request. Modes: `quiz me`, `guide me`, `socratic`, `thinker`. STE-80 writing; say `plain` for normal prose.

The model writes JSON; the renderer supplies the theme. Optional math/flow libraries load from cdnjs.

## Install
```
claude plugin marketplace add Tushar-bioinfo/proff
claude plugin install proff@proff
```
Other agents: link or copy `skills/proff` into their skills folder.
claude.ai: upload `dist/proff-claude.zip`. ChatGPT: upload `dist/proff-chatgpt.zip`, or use `dist/proff-instructions.md` for text-only lessons/outlines.
Build packages with `tools/build.sh`.

## Example
```
python3 skills/proff/scripts/render.py skills/proff/examples/bootstrap.json -o /tmp/bootstrap.html --embed
python3 skills/proff/scripts/snap.py /tmp/bootstrap.html
python3 skills/proff/scripts/snap.py /tmp/bootstrap.html --offline --out /tmp/bootstrap-offline
```
Snap needs Playwright and Chromium/Chrome. It flags overflow, clipping, notation overlap, invalid math, and small flow text.
Arrow keys/space walk builds; Down/Up jump slides. Render with `--layout page` for scrolling.

## Skill files
- `SKILL.md`: routing, writing, sources.
- `levels/`: L2.md, L3.md, deck.md (spec and checks).
- `ref/`: svg.md mechanics, ideas/{stats,bio,ml}.md menus, team.md workflow, image.md.
- `modes/`: quiz.md, guide.md.
- `scripts/`: render.py, snap.py, image.py, log.py.
- `assets/`: theme CSS and deck JS.

<!-- Drop Mermaid trial: remove render.py mermaid() and data-need entry; deck.js mermaid block;
CSS .mmd rules; snap.py mermaid check; deck.md type/rules; L3.md mention; bootstrap Mermaid slide. -->

Theme adapted from [frontend-slides](https://github.com/zarazhangrui/frontend-slides) (MIT, © 2025 Zara Zhang); see `skills/proff/assets/NOTICE`.
