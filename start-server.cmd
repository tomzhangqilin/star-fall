@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on this computer.
  echo Use start-game.cmd instead, or double-click index.html.
  pause
  exit /b 1
)

node server.js
pause
