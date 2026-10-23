#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

export PORT="${PORT:-3000}"
export HOST="${HOST:-0.0.0.0}"

echo "Starting Applebee app on http://${HOST}:${PORT}"
npm run dev
