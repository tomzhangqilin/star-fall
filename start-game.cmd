@echo off
setlocal
cd /d "%~dp0"

set "GAME_FILE=%~dp0PLAY-DOUBLE-CLICK.html"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "EDGE_X86=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME%" (
  start "" "%CHROME%" "%GAME_FILE%"
  goto opened
)

if exist "%EDGE%" (
  start "" "%EDGE%" "%GAME_FILE%"
  goto opened
)

if exist "%EDGE_X86%" (
  start "" "%EDGE_X86%" "%GAME_FILE%"
  goto opened
)

start "" "%GAME_FILE%"

:opened

echo Starfall Land is opening in your browser.
echo File:
echo %GAME_FILE%
echo.
echo If it still does not open, drag PLAY-DOUBLE-CLICK.html onto Chrome.
pause
