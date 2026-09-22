@echo off
setlocal
cd /d "%~dp0"

where cloudflared >nul 2>nul
if errorlevel 1 (
  echo cloudflared is not installed or not on PATH.
  echo Install Cloudflare Tunnel first, then run this file again.
  pause
  exit /b 1
)

if "%DP_TUNNEL_NAME%"=="" set DP_TUNNEL_NAME=dp-alpha
echo Starting Cloudflare Tunnel: %DP_TUNNEL_NAME%
cloudflared tunnel run %DP_TUNNEL_NAME%
