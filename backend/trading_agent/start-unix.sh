#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -x ".venv/bin/python" ]; then
  echo "DP Alpha is not installed on this computer yet."
  echo "Run ./setup-unix.sh first."
  exit 1
fi

source .venv/bin/activate
python doctor.py

echo
echo "Starting DP Alpha on http://127.0.0.1:8000"
echo "Press Ctrl+C to stop the server."
echo
python run_server.py
