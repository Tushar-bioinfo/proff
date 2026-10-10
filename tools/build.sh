#!/bin/sh
# Build upload files into dist/:
#   proff-viz-claude.zip       claude.ai / Claude Code plugin layout
#   proff-viz-chatgpt.zip      ChatGPT (one skill folder)
#   proff-viz-instructions.md  text-only instructions (no scripts: L4 becomes a scene outline)
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
X="-x *.DS_Store -x */__pycache__/* -x */snaps/* -x */page.html"
zip -qr dist/proff-viz-claude.zip .claude-plugin/plugin.json skills/proff $X
(cd skills && zip -qr ../dist/proff-viz-chatgpt.zip proff $X)
S=skills/proff
{
  awk 'n>=2; /^---$/{n++}' $S/SKILL.md | sed '/^## Where you are running/,$d'
  echo "## Where you are running"
  echo "- Text-only version: pages need code execution. Instead, for L4 write a scene outline: one line per scene, its steps, and what each step shows."
  echo
  sed -n '/^# L2/,$p' $S/levels/L2.md | sed 's/^# /## /'
  echo
  sed 's/^# /## /; s/^## /### /' $S/levels/L3.md | sed '/^### 3. Offer L4/,$d'
  echo "### 3. L4 without code: scene outline"
  echo "List 3-8 scenes. For each: the claim in its title, the steps, and the numbers it shows."
  echo
  sed '/^## Log/,$d' $S/modes/quiz.md | sed 's/^# /## /; s/^## Flow/### Flow/; s/^## Rules/### Rules/'
  sed 's/^# /## /; s/^## Flow/### Flow/; s/^## Thinker/### Thinker/; s/^## Rules/### Rules/' $S/modes/guide.md
} | sed 's#(open `[^`]*`)##; s#`levels/L2.md`#the L2 section#; s#`levels/L3.md`#the L3 section#; s#`viz.md`#the scene outline#; s#`levels/L4.md`#the scene outline#; s#`ref/image.md`#your image tool#; s#(see `SKILL.md`)#(see Sources)#; s#L4 visual · ##g; s#`modes/quiz.md`#the Quiz section#; s#`modes/guide.md`#the Guide section#' > dist/proff-viz-instructions.md
ls -la dist
