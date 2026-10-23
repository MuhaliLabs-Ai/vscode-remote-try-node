#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/expo"

if [ ! -d node_modules ]; then
  echo "Installing Expo dependencies..."
  npm install
fi

exec npm start -- "$@"
