#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo
  echo "Created .env from .env.example."
  echo "Edit backend/trading_agent/.env before using DP Alpha."
  echo
  exit 0
fi

echo "Starting DP Alpha on http://127.0.0.1:8000"
python run_server.py
