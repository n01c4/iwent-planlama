@echo off
echo Starting all iWent frontend dev servers...
echo.

REM Start admin panel
echo [1/3] Starting Admin Panel (http://localhost:5173)
start "iWent Admin Panel" cmd /k "cd iwent-admin-panel && npm run dev"
timeout /t 3 /nobreak >nul

REM Start organizer panel
echo [2/3] Starting Organizer Panel (http://localhost:5174)
start "iWent Organizer Panel" cmd /k "cd iwent-organizatör-paneli && npm run dev -- --port 5174"
timeout /t 3 /nobreak >nul

REM Start welcome screen
echo [3/3] Starting Welcome Screen (http://localhost:5175)
start "iWent Welcome Screen" cmd /k "cd iwent-welcome-screen && npm run dev -- --port 5175"

echo.
echo ✓ All frontend servers starting...
echo.
echo Admin Panel:      http://localhost:5173
echo Organizer Panel:  http://localhost:5174
echo Welcome Screen:   http://localhost:5175
echo.
echo Press any key to exit this window (servers will keep running)
pause >nul
