@echo off
setlocal
cd /d "%~dp0"
call backend\trading_agent\start-windows.bat
