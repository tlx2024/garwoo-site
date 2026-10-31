@echo off
rem Garwoo site - local launcher. Keep this file ASCII-only; cmd.exe parses batch files using the system codepage.
rem   [1] Dev (Pages base, http://localhost:4321/garwoo-site/)
rem   [2] Build Pages  -> site\dist\pages
rem   [3] Build WWW review (placeholder origin) -> site\dist\www
rem   [4] Test and astro check
rem   [5] Reinstall deps (npm ci)
rem   [Q] Quit
setlocal EnableDelayedExpansion
cd /d "%~dp0site"

where node >nul 2>nul || (echo [ERROR] node not found. Install Node.js 22+ first. & pause & exit /b 1)
where npm >nul 2>nul || (echo [ERROR] npm not found. Install Node.js 22+ first. & pause & exit /b 1)
if not exist node_modules (
  echo [SETUP] installing dependencies...
  call npm ci || (pause & exit /b 1)
)

echo.
echo ============================================
echo   Garwoo site - choose launch mode
echo ============================================
echo   [1] Dev     (http://localhost:4321/garwoo-site/)
echo   [2] Build Pages
echo   [3] Build WWW review
echo   [4] Test and check
echo   [5] Reinstall deps
echo   [Q] Quit
set /p MODE="Enter 1/2/3/4/5/Q, Enter=1: "
if "!MODE!"=="" set MODE=1

if /i "!MODE!"=="Q" exit /b 0
if "!MODE!"=="1" call npm run dev -- --port 4321 & goto done
if "!MODE!"=="2" call npm run build:pages & goto done
if "!MODE!"=="3" (
  set SITE_MODE=www
  set SITE_PREVIEW=true
  set WWW_ORIGIN=https://www.garwoo.example
  call npm run build:www
  goto done
)
if "!MODE!"=="4" call npm test & call npm run check & goto done
if "!MODE!"=="5" call npm ci & goto done
echo [ERROR] invalid choice: !MODE!

:done
pause
endlocal
