# Release

Only when the user asks.

1. `tools/check-all.sh` is at the baseline in `docs/testing.md`.
2. Bump `version` in `.claude-plugin/plugin.json`. Rough rule: new rule or feature → minor (4.0.2 → 4.1.0); fix → patch.
3. Update `README.md` if users see the change (palette, levels, page types).
4. Move the release's entries in `docs/decisions.md` under the version heading.
5. `tools/build.sh` rebuilds `dist/` (claude.ai plugin zip, ChatGPT single-skill zip, text-only instructions). `dist/` is ignored by git; it is for uploading by hand.
6. Commit on branch `viz`. Message style from history: `Proff-viz v4.1.0: <what changed, in a few plain words>`.

Remotes: `origin` = github.com/Tushar-bioinfo/proff (the public marketplace), `proff-local` = `../proff` (the older v3 repo). Pushing to `origin` updates what users install: push only when the user says so.
