@echo off
rem Double-click to run the portfolio: installs once, then opens it in your browser.
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies, first run only...
  call npm install
)
call npm start
pause
