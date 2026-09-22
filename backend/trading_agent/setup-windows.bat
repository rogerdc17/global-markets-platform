@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo        DP Alpha - First Time Setup
echo ==========================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo Python was not found.
    echo Install Python 3.11 or newer and make sure it is added to PATH.
    echo https://www.python.org/downloads/
    pause
    exit /b 1
  )
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  python -m venv .venv >nul 2>nul
  if errorlevel 1 py -m venv .venv
  if errorlevel 1 (
    echo Failed to create the Python virtual environment.
    pause
    exit /b 1
  )
)

call .venv\Scripts\activate.bat

echo Installing backend dependencies...
python -m pip install --upgrade pip
if errorlevel 1 exit /b 1
python -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

echo.
python setup_server.py
if errorlevel 1 (
  echo.
  echo Setup failed. Review the error above.
  pause
  exit /b 1
)

echo.
echo ==========================================
echo Installation complete.
echo ==========================================
echo.
echo Next:
echo 1. Edit .env if credentials are still blank.
echo 2. Run start-windows.bat
echo 3. Open http://127.0.0.1:8000/health
echo.
pause
