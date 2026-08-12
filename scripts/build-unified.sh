#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_OUT="${ROOT_DIR}/out"

echo "[1/1] Building site..."
cd "${ROOT_DIR}"
rm -rf .next out
next build
cp public/_headers out/_headers
if [[ -f public/CNAME ]]; then
  cp public/CNAME out/CNAME
fi

echo "Build complete: ${ROOT_OUT}"
