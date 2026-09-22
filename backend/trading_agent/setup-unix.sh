#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "=========================================="
echo "       DP Alpha - First Time Setup"
echo "=========================================="
echo

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 was not found. Install Python 3.11 or newer."
  exit 1
fi

if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "Installing backend dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo
python setup_server.py

echo
echo "Installation complete."
echo "Next:"
echo "1. Edit .env if credentials are still blank."
echo "2. Run ./start-unix.sh"
echo "3. Open http://127.0.0.1:8000/health"
