@echo off
setlocal
title FactoryMind AI Launcher
cd /d "%~dp0"

echo ==========================================
echo        FACTORYMIND AI - STARTUP
echo ==========================================
echo.

where py >nul 2>nul
if errorlevel 1 goto no_python
where node >nul 2>nul
if errorlevel 1 goto no_node

if not exist "backend\.venv\Scripts\python.exe" (
  echo Creating Python 3.15 environment...
  py -3.15 -m venv "backend\.venv"
  if errorlevel 1 goto failed
)

echo Checking backend packages...
"backend\.venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
if errorlevel 1 goto failed

if not exist "frontend\node_modules" (
  echo Installing frontend packages. This may take a few minutes...
  pushd "frontend"
  call npm install
  if errorlevel 1 (popd & goto failed)
  popd
)

echo Starting backend...
start "FactoryMind AI Backend" cmd /k ""%~dp0RUN_BACKEND.bat""
timeout /t 3 /nobreak >nul

echo Starting frontend...
start "FactoryMind AI Frontend" cmd /k ""%~dp0RUN_FRONTEND.bat""
timeout /t 7 /nobreak >nul
start "" "http://127.0.0.1:5173/"

echo.
echo FactoryMind AI startup commands completed.
echo Keep both server windows open while using the application.
echo Close both server windows to stop it.
exit /b 0

:no_python
echo Python Launcher (py) was not found. Install Python 3.15 and enable the launcher.
pause
exit /b 1

:no_node
echo Node.js was not found. Install Node.js LTS and restart this launcher.
pause
exit /b 1

:failed
echo Startup failed. Read the error above.
pause
exit /b 1
