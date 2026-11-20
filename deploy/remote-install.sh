#!/usr/bin/env bash
# Runs on the web host. Called by deploy/deploy.ps1 after it uploads the files to $STAGE.
# Swaps the web root and reloads nginx only after `nginx -t` passes.
# Any failure restores the previous root.
set -euo pipefail

STAGE="${1:?stage dir}"
WEB_ROOT="${2:-/var/www/garwoo-www}"
CONF_SRC="$STAGE/garwoo.conf"
CONF_DEST="/etc/nginx/sites-available/garwoo.conf"
CONF_LINK="/etc/nginx/sites-enabled/garwoo.conf"
STAMP="$(date +%Y%m%d-%H%M%S)"
NEW="${WEB_ROOT}.new-${STAMP}"
OLD="${WEB_ROOT}.bak"

sudo mkdir -p "$NEW"
sudo tar --no-same-owner -xzf "$STAGE/www.tgz" -C "$NEW"
test -f "$NEW/index.html" || { echo "index.html missing in archive" >&2; sudo rm -rf "$NEW"; exit 1; }
sudo chmod -R u=rwX,go=rX "$NEW"

had_conf=0
if sudo test -f "$CONF_DEST"; then
  had_conf=1
  sudo cp "$CONF_DEST" "$CONF_DEST.bak"
fi

if [ -f "$CONF_SRC" ]; then
  sudo install -m 0644 "$CONF_SRC" "$CONF_DEST"
  if [ ! -L "$CONF_LINK" ] && [ ! -f "$CONF_LINK" ]; then
    sudo ln -s "$CONF_DEST" "$CONF_LINK"
  fi
fi

restore_conf() {
  if [ "$had_conf" = 1 ]; then
    sudo mv "$CONF_DEST.bak" "$CONF_DEST"
  else
    sudo rm -f "$CONF_LINK" "$CONF_DEST"
  fi
}

if ! sudo nginx -t; then
  echo "nginx -t failed; web root untouched" >&2
  restore_conf
  sudo rm -rf "$NEW"
  exit 1
fi

# Keep exactly one previous copy for rollback.
sudo rm -rf "$OLD"
if [ -d "$WEB_ROOT" ]; then sudo mv "$WEB_ROOT" "$OLD"; fi
sudo mv "$NEW" "$WEB_ROOT"

if ! sudo systemctl reload nginx; then
  echo "nginx reload failed; rolling back" >&2
  sudo rm -rf "$WEB_ROOT"
  if [ -d "$OLD" ]; then sudo mv "$OLD" "$WEB_ROOT"; fi
  restore_conf
  exit 1
fi

sudo rm -f "$CONF_DEST.bak"
rm -rf "$STAGE"
echo "deployed to $WEB_ROOT (previous copy at $OLD)"
