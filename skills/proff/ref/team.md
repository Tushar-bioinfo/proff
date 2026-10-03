# Team mode — only on request

1. You orchestrate. If `AGENT_DELEGATE_DEPTH` is set, or you are already a subagent, do not delegate. Use the single-agent path; say so.
2. Plan visuals from `levels/L3.md` §1. Full L3: write the chat lesson yourself. Deck-only: no write-up.
   Write `proff/<topic>-team/storyboard.md` with the scene details below.
3. Dispatch once. Pass the user's model slug or alias unchanged. No named implementer model → ask once; never guess.
   Prefer the installed agent-delegate dispatcher at `~/.claude`, `~/.codex`, `~/.cursor`, `~/.gemini/config`, or `~/.config/muse` under `skills/agent-delegate/scripts/delegate.py`.
   Load its skill. Prompt on stdin; `--to <cli> --model <named> --role worker --workspace <abs folder>`.
   It can take 20+ minutes. Do not end your turn until it returns: wait in the foreground, or keep polling within your shell's time limit. A headless session ends when you stop, and the implementer dies with it.
   `.model` comes back resolved (alias `sol-6.1` → `gpt-6.1-sol`); that counts as a match. Stop only if status is not success or `.model` is neither the name you passed nor its resolved slug: report `error_message` and `.model` verbatim.
   Otherwise use the harness's subagent tool. Neither available → say so and build yourself. Never nest delegation.
4. Review `snaps/sheet.png` and `snaps/svg.png` once. Check scene questions, layout ranges, build order, exact labels, and two key numbers.
   Send one numbered fix list, concrete per scene, ≤10 items. Reuse the session (`--session` for dispatcher).
   If a scene still fails after that round, draw that scene yourself. Do not restart the deck.

## Storyboard
State slide order and type. Per scene: one question; elements and position ranges on the 1200×640 grid;
what each build adds; exact captions, labels and numbers; emphasis. Implementer picks coordinates inside those ranges.
Text slides: 1–3 content points; implementer writes prose. Calc: exact given, lines, results, symbols with meanings/units.
Sim: controls (name, range, default), drawing, formula/rule, live number shown.
Mermaid: nodes, edges with verbs, and which ≤2 nodes use `:::hi`.
Name two key numbers for review. Invent the best visuals; cover every important part.

## Implementer prompt
```
You are the Proff deck implementer. Do not delegate.
Skill folder: <abs>. Work folder: <abs>.
Read levels/deck.md, ref/svg.md, then storyboard.md. Do not read whole examples.
Write spec.json following slide order, layout ranges, exact labels, numbers, and builds. Choose coordinates inside the ranges.
Run render.py and snap.py. Fix WARNs (max 3 runs). Look once at sheet.png and svg.png.
Reply in ≤120 words: deck path, WARNs left, two key numbers as shown, and any storyboard change with its reason.
```
