#!/bin/sh
# Build upload files into dist/:
#   proff-claude.zip   claude.ai  (plugin layout, same as the v2 upload)
#   proff-chatgpt.zip  ChatGPT    (one skill folder with one SKILL.md)
#   proff-instructions.md  one-file text for a custom GPT / project instructions (no scripts)
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
X="-x *.DS_Store -x */__pycache__/* -x */snaps/* -x *.html"
zip -qr dist/proff-claude.zip .claude-plugin/plugin.json skills/proff $X
(cd skills && zip -qr ../dist/proff-chatgpt.zip proff $X)
# proff-v3-claude-separate.zip: renamed to proff-v3 so it installs next to an existing v2 "proff"
T=$(mktemp -d); mkdir -p "$T/.claude-plugin" "$T/skills"
sed 's/"name": "proff"/"name": "proff-v3"/' .claude-plugin/plugin.json > "$T/.claude-plugin/plugin.json"
cp -R skills/proff "$T/skills/proff-v3"
sed -i.bak '1,4s/^name: proff$/name: proff-v3/' "$T/skills/proff-v3/SKILL.md" && rm "$T/skills/proff-v3/SKILL.md.bak"
(cd "$T" && zip -qr "$OLDPWD/dist/proff-v3-claude-separate.zip" .claude-plugin skills $X)
rm -rf "$T"
S=skills/proff
{
  awk 'n>=2; /^---$/{n++}' $S/SKILL.md | sed '/^## Where you are running/,$d'
  echo "## Where you are running"
  echo "- Text-only version: L3 = the full write-up plus a slide outline (one line per diagram and its build steps). L3 deck / deck only = outline only. A rendered deck needs code execution."
  echo "- Images only when the user asks. If you can generate images, use the template below."
  echo
  sed -n '/^# L2/,$p' $S/levels/L2.md | sed 's/^# /## /'
  echo
  echo "## L3 — the detailed write-up"
  sed -n '/^L3 is the deep version/p' $S/levels/L3.md
  echo
  sed -n '/^## 1. Plan the visuals/,$p' $S/levels/L3.md | sed 's/^## 3. The deck/## 3. The slide outline/; s/^## /### /'
  echo
  sed -n '/^## Prompt template/,/^```$/p' $S/ref/image.md | sed '1s/.*/## Image prompt template (only when the user asks)/'
  sed -n '/^```$/,/^```$/p' $S/ref/image.md | sed -n '2,/^```$/p'
  echo
  sed '/^## Log/,$d' $S/modes/quiz.md | sed 's/^# /## /; s/^## Flow/### Flow/; s/^## Rules/### Rules/'
  sed 's/^# /## /; s/^## Flow/### Flow/; s/^## Thinker/### Thinker/; s/^## Rules/### Rules/' $S/modes/guide.md
} | sed '/ref\/team.md/d; /ref\/ideas\//d; s#Read `levels/deck.md` and build it. Then the deck path and the offer line.#Write the slide outline: one line per slide, saying what each diagram shows step by step. Then the offer line.#; s#full write-up + diagrams + deck#full write-up + diagrams + outline#; s#| L3 deck .*#| L3 deck | "L3 deck", "deck only" | outline only; one-line introduction | this text |#; /levels\/deck.md/d; s#(open `[^`]*`)##; s#`levels/L2.md`#the L2 section#; s#`levels/L3.md`#the L3 section#; s#Then the deck path and the offer line.#Then the slide outline and the offer line.#; s#(see `SKILL.md`)#(see Sources)#; s#`modes/quiz.md`#the Quiz section#; s#`modes/guide.md`#the Guide section#; s#`ref/image.md`#the image template#' > dist/proff-instructions.md
ls -la dist
