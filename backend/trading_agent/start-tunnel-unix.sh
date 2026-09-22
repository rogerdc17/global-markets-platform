#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is not installed or not on PATH."
  echo "Install Cloudflare Tunnel first, then run this file again."
  exit 1
fi

TUNNEL_NAME="${DP_TUNNEL_NAME:-dp-alpha}"
echo "Starting Cloudflare Tunnel: $TUNNEL_NAME"
cloudflared tunnel run "$TUNNEL_NAME"
