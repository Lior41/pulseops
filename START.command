#!/bin/zsh
set -e
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Installe Node.js 24 LTS, puis ouvre à nouveau ce fichier."
  read -r '?Appuie sur Entrée pour fermer.'
  exit 1
fi
if [ ! -d node_modules ]; then
  npm ci
fi
npm run demo
