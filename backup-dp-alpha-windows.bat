@echo off
setlocal
cd /d "%~dp0\backend\trading_agent"

if not exist ".venv\Scripts\python.exe" (
  echo DP Alpha is not installed yet. Run setup-dp-alpha-windows.bat first.
  pause
  exit /b 1
)

call .venv\Scripts\activate.bat
python backup.py
pause
