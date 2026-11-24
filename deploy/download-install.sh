#!/usr/bin/env bash
# Runs on the web host. Called by deploy/setup-download.ps1 after it uploads download.conf to $STAGE.
# Installs the download.garwoo.com site, removes the reserved 404 block for the same host from
# garwoo-cloud.conf (it would shadow this site), and reloads nginx only after `nginx -t` passes.
# Any failure restores both files.
set -euo pipefail

STAGE="${1:?stage dir}"
ROOT="${2:-/var/www/garwoo-download}"
CONF_DEST="/etc/nginx/sites-available/download.garwoo.conf"
CONF_LINK="/etc/nginx/sites-enabled/download.garwoo.conf"
CLOUD="/etc/nginx/sites-available/garwoo-cloud.conf"
STAMP="$(date +%Y%m%d-%H%M%S)"
MARK="# Downloads: reserved."

sudo install -d -m 0755 "$ROOT" "$ROOT/releases"

had_conf=0
if sudo test -f "$CONF_DEST"; then had_conf=1; sudo cp "$CONF_DEST" "$CONF_DEST.bak-$STAMP"; fi
cloud_changed=0
if sudo grep -qF "$MARK" "$CLOUD"; then
  sudo cp "$CLOUD" "$CLOUD.bak-$STAMP"
  # Drop the comment line and the server block that follows it, nothing else.
  sudo awk -v mark="$MARK" '
    skip == 0 && index($0, mark) == 1 { skip = 1; next }
    skip == 1 { if ($0 ~ /\{/) depth += gsub(/\{/, "{"); if ($0 ~ /\}/) { depth -= gsub(/\}/, "}"); if (depth == 0) { skip = 2 } } next }
    { print }
  ' "$CLOUD.bak-$STAMP" | sudo tee "$CLOUD.new-$STAMP" >/dev/null
  if sudo grep -q "server_name download.garwoo.com;" "$CLOUD.new-$STAMP"; then
    echo "reserved download block still present after edit; aborting" >&2
    sudo rm -f "$CLOUD.new-$STAMP"; exit 1
  fi
  sudo mv "$CLOUD.new-$STAMP" "$CLOUD"
  cloud_changed=1
fi

sudo install -m 0644 "$STAGE/download.conf" "$CONF_DEST"
[ -L "$CONF_LINK" ] || sudo ln -s "$CONF_DEST" "$CONF_LINK"

restore() {
  if [ "$cloud_changed" = 1 ]; then sudo cp "$CLOUD.bak-$STAMP" "$CLOUD"; fi
  if [ "$had_conf" = 1 ]; then sudo cp "$CONF_DEST.bak-$STAMP" "$CONF_DEST"; else sudo rm -f "$CONF_LINK" "$CONF_DEST"; fi
}

if ! sudo nginx -t; then
  echo "nginx -t failed; restoring" >&2
  restore; exit 1
fi
if ! sudo systemctl reload nginx; then
  echo "nginx reload failed; restoring" >&2
  restore; sudo systemctl reload nginx || true; exit 1
fi
rm -rf "$STAGE"
echo "download.garwoo.com now serves $ROOT (backups: *.bak-$STAMP)"
