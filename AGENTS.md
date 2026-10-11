# Proff-viz plugin workshop

This folder is for **building and improving the proff-viz plugin**. It is not a place to make teaching pages or decks for a topic.
- Allowed: building the examples and test pages to check a change, compare options, or tune performance. Put every test output in `out/` (ignored by git).
- Not allowed: making a page or deck because someone wants to learn a topic. Do that in another folder with the installed plugin.

## Where things are
| Path | What it is |
|---|---|
| `skills/proff-viz/` | **The plugin itself.** Everything here ships to users. |
| `skills/proff-viz/SKILL.md` | entry point: writing style, sources, levels L1–L4, modes |
| `skills/proff-viz/examples/` | exemplar pages and the example deck; they double as the regression tests |
| `.claude-plugin/` | plugin and marketplace manifests (version lives in `plugin.json`) |
| `tools/` | `check-all.sh` (rebuild and audit every example), `build.sh` (upload zips into `dist/`) |
| `docs/` | notes for agents working on the plugin; **not shipped** |
| `out/`, `dist/` | build outputs; ignored by git |

## Read before you work
| Doc | Read it when |
|---|---|
| `docs/architecture.md` | you need to know which file controls what, or where a new rule belongs |
| `docs/testing.md` | before you say a change works |
| `docs/design-system.md` | you touch colours, text sizes, the kit theme, plots, or decks |
| `docs/decisions.md` | before you reverse or redo something; it says why things are the way they are |
| `docs/backlog.md` | you look for open problems, or you leave one behind |
| `docs/release.md` | you bump the version, build the zips, or commit |

## Rules
- **Keep the build green.** Run `tools/check-all.sh` after any change to `kit/`, `scripts/`, the theme, or an example. Report the warning counts it prints. Only `examples/study-notation` may carry its known warnings (see `docs/backlog.md`).
- **Look at the contact sheets** (`out/check/<example>/sheet-*.png`) after a visual change. A clean audit does not prove the page teaches.
- **Skill files ship; docs do not.** Never point a skill file at `docs/`. Put a rule an agent using the plugin needs inside `skills/proff-viz/`. Put notes for plugin builders in `docs/`.
- **Put each rule in one place, at the right level.** Example: the "build it from the ground" rule is for L4 visuals only, so it lives in `levels/L4.md`, not in `SKILL.md`.
- Write skill files in the plugin's own style: STE-80 (short sentences, active voice, define each term once). Keep numbers and units exact.
- Never edit a built `page.html` or anything in `dist/`. Change the source and rebuild.
- Update `docs/decisions.md` when you make a choice someone could later undo by mistake. Update `docs/backlog.md` when you find or fix a known problem.
- Do not commit, push, or bump the version unless the user asks. Do not trigger GitHub reviews or other external automation.

## Setup
Python 3 with `matplotlib`, `numpy`, and `playwright` (run `playwright install chromium` once). Pages load KaTeX, d3, and p5 from public CDNs when used.
