@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo DP Alpha is not installed on this computer yet.
  echo Run setup-windows.bat first.
  pause
  exit /b 1
)

call .venv\Scripts\activate.bat

python doctor.py
if errorlevel 1 (
  echo.
  echo Fix the configuration errors above, then run this file again.
  pause
  exit /b 1
)

echo.
echo Starting DP Alpha on http://127.0.0.1:8000
echo Press Ctrl+C to stop the server.
echo.
python run_server.py
