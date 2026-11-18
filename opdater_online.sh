#!/bin/zsh
# Lægger Pro Dart Manager op på GitHub Pages: https://andersluther.github.io/prodartmanager/
set -e
export PATH="$HOME/.local/bin:$PATH"
cd "${0:A:h}"
git add -A
if git diff --cached --quiet; then
  echo "Ingen ændringer at lægge op."
  exit 0
fi
git commit -q -m "Opdater Pro Dart Manager $(date '+%Y-%m-%d %H:%M')

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q
echo "Lagt op. Online om ca. 1 minut: https://andersluther.github.io/prodartmanager/"
