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
S=skills/proff
{
  awk 'n>=2; /^---$/{n++}' $S/SKILL.md | sed '/^## Where you are running/,$d'
  echo "## Where you are running"
  echo "- This is the text-only version. L3 = L2 plus a slide-by-slide outline. If you can generate images, make one with the template below."
  echo
  sed -n '/^# L2/,$p' $S/levels/L2.md | sed 's/^# /## /'
  echo
  sed -n '/^## Prompt template/,/^```$/p' $S/ref/image.md | sed '1s/.*/## Image prompt template (L3, if you can make images)/'
  sed -n '/^```$/,/^```$/p' $S/ref/image.md | sed -n '2,/^```$/p'
  echo
  sed '/^## Log/,$d' $S/modes/quiz.md | sed 's/^# /## /; s/^## Flow/### Flow/; s/^## Rules/### Rules/'
  sed 's/^# /## /; s/^## Flow/### Flow/; s/^## Thinker/### Thinker/; s/^## Rules/### Rules/' $S/modes/guide.md
} | sed 's#(open `[^`]*`)##; s#`levels/L2.md`#the L2 section#; s#`levels/L3.md`#the L3 note#; s#`modes/quiz.md`#the Quiz section#; s#`modes/guide.md`#the Guide section#; s#`ref/image.md`#the image template#' > dist/proff-instructions.md
ls -la dist
