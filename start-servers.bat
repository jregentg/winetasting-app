@echo off
echo ========================================
echo   WINE TASTING APP - DEMARRAGE
echo ========================================
echo.
echo Configuration reseau:
echo - Backend API : http://192.168.1.16:3000
echo - Frontend Web: http://192.168.1.16:8080
echo - Base locale : http://localhost:8080
echo.
echo ========================================

cd /d "%~dp0"

echo [1/2] Demarrage du backend (port 3000)...
start "Wine Tasting Backend" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Demarrage du frontend (port 8080)...
start "Wine Tasting Frontend" cmd /k "cd web-version && python -m http.server 8080 --bind 0.0.0.0"

echo.
echo ========================================
echo   SERVEURS DEMARRE !
echo ========================================
echo.
echo ACCES PC (local):
echo   http://localhost:8080
echo.
echo ACCES SMARTPHONE (reseau):
echo   http://192.168.1.16:8080
echo.
echo API Backend:
echo   http://192.168.1.16:3000/api/health
echo.
echo Appuyez sur une touche pour continuer...
pause >nul