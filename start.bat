@echo off
setlocal

cd /d "%~dp0"

:: If called with a specific target, jump to that target
if "%~1"=="backend" goto :start_backend
if "%~1"=="frontend" goto :start_frontend

:: ==========================================
:: Main Launcher
:: ==========================================
title Playnex Launcher

echo ===================================================
echo           Starting Playnex Application
echo ===================================================
echo.

echo [1/2] Starting Backend Server (FastAPI)...
start "Playnex - Backend" cmd /k ""%~f0" backend"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Client (React + Vite)...
start "Playnex - Frontend" cmd /k ""%~f0" frontend"

echo.
echo ===================================================
echo   Playnex services have been launched!
echo.
echo   * Frontend Web App:  http://localhost:5173
echo   * Backend API:       http://localhost:8000
echo   * API Documentation: http://localhost:8000/api/docs
echo.
echo   (Keep the launched console windows open while running)
echo ===================================================
echo.
pause
exit /b 0


:: ==========================================
:: Backend Target
:: ==========================================
:start_backend
title Playnex - Backend (FastAPI)
cd /d "%~dp0backend"

echo ===================================================
echo   Playnex Backend Server (FastAPI)
echo   - API URL:  http://localhost:8000
echo   - Swagger:  http://localhost:8000/api/docs
echo ===================================================
echo.

if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example...
        copy ".env.example" ".env" >nul
    )
)

if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call "venv\Scripts\activate.bat"
    set "PYTHON_CMD=python"
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON_CMD=venv\Scripts\python.exe"
) else (
    echo [WARNING] venv not found in backend\venv. Using global Python.
    set "PYTHON_CMD=python"
)

echo [INFO] Starting FastAPI backend on port 8000...
echo.
%PYTHON_CMD% -m uvicorn app.main:app --reload --port 8000
if errorlevel 1 (
    echo.
    echo [ERROR] Backend server encountered an error.
)
exit /b 0


:: ==========================================
:: Frontend Target
:: ==========================================
:start_frontend
title Playnex - Frontend (React + Vite)
cd /d "%~dp0frontend"

echo ===================================================
echo   Playnex Frontend Client (React + Vite)
echo   - Web App: http://localhost:5173
echo ===================================================
echo.

if not exist "node_modules" (
    echo [INFO] Node modules not found. Installing dependencies...
    call npm install
)

echo [INFO] Starting Vite development server...
echo.
call npm run dev
if errorlevel 1 (
    echo.
    echo [ERROR] Frontend server encountered an error.
)
exit /b 0
