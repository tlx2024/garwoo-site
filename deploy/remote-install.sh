#!/usr/bin/env bash
# Runs on the web host. Called by deploy/deploy.ps1 after it uploads the files to $STAGE.
# Swaps the web root and reloads nginx only after `nginx -t` passes.
# Any failure restores the previous root. NOT VERIFIED on a real host yet.
set -euo pipefail

STAGE="${1:?stage dir}"
WEB_ROOT="${2:-/var/www/garwoo-www}"
STAMP="$(date +%Y%m%d-%H%M%S)"
NEW="${WEB_ROOT}.new-${STAMP}"
OLD="${WEB_ROOT}.bak"

sudo mkdir -p "$NEW"
sudo tar -xzf "$STAGE/www.tgz" -C "$NEW"
test -f "$NEW/index.html" || { echo "index.html missing in archive" >&2; sudo rm -rf "$NEW"; exit 1; }

if ! sudo nginx -t; then
  echo "nginx -t failed; web root untouched" >&2
  sudo rm -rf "$NEW"
  exit 1
fi

# Keep exactly one previous copy for rollback.
sudo rm -rf "$OLD"
if [ -d "$WEB_ROOT" ]; then sudo mv "$WEB_ROOT" "$OLD"; fi
sudo mv "$NEW" "$WEB_ROOT"
sudo chmod -R a+rX "$WEB_ROOT"

if ! sudo systemctl reload nginx; then
  echo "nginx reload failed; rolling back" >&2
  sudo rm -rf "$WEB_ROOT"
  if [ -d "$OLD" ]; then sudo mv "$OLD" "$WEB_ROOT"; fi
  exit 1
fi
rm -rf "$STAGE"
echo "deployed to $WEB_ROOT (previous copy at $OLD)"
