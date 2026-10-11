#!/bin/sh
# Rebuild every example page and the example deck into out/check/, then audit them.
# Prints one line per example: name and warning count. Exit 1 if any example has warnings.
# Usage: tools/check-all.sh [example ...]   (default: all)
cd "$(dirname "$0")/.."
S=skills/proff-viz
O=out/check
mkdir -p "$O"
export PROFF_SCRIPTS="$PWD/$S/scripts"
names="$*"
[ -z "$names" ] && names=$(cd $S/examples && ls -d */ | tr -d /)
bad=0
for n in $names; do
  mkdir -p "$O/$n"
  if ! python3 $S/scripts/build.py $S/examples/$n -o "$O/$n/page.html" > "$O/$n/build.log" 2>&1; then
    echo "$n: BUILD FAILED (see $O/$n/build.log)"; bad=1; continue
  fi
  python3 $S/scripts/check.py "$O/$n/page.html" --out "$O/$n" > "$O/$n/check.log" 2>&1
  rc=$?
  w=$(grep -c 'WARN' "$O/$n/check.log")
  [ $rc -eq 2 ] && { echo "$n: CHECK COULD NOT RUN (see $O/$n/check.log)"; bad=1; continue; }
  echo "$n: $w warnings"
  [ "$w" -gt 0 ] && bad=1
done
if [ -z "$*" ]; then
  mkdir -p "$O/deck" && python3 $S/scripts/render.py $S/examples/deck-bootstrap.json -o "$O/deck/deck.html" > /dev/null 2>&1 &&
  python3 $S/scripts/snap.py "$O/deck/deck.html" --out "$O/deck" > "$O/deck/snap.log" 2>&1
  echo "deck-bootstrap: $(grep -c 'WARN' "$O/deck/snap.log") warnings"
fi
echo "contact sheets: $O/<example>/sheet-*.png"
exit $bad
