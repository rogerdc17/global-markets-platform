@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  py -m venv .venv
  if errorlevel 1 python -m venv .venv
)

call .venv\Scripts\activate.bat

echo Installing/updating backend dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo.
  echo Created .env from .env.example.
  echo Edit backend\trading_agent\.env before using DP Alpha.
  echo.
  pause
)

echo Starting DP Alpha on http://127.0.0.1:8000
python run_server.py
