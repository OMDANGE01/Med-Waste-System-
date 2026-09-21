@echo off
title MedWaste Guard - Biomedical Waste System
echo ============================================================
echo  Starting MedWaste Guard Full-Stack Platform...
echo  Domain:   http://medwaste:5173 (or http://localhost:5173)
echo  Backend:  http://medwaste:5000
echo ============================================================
echo.
cd /d "%~dp0"
node run-all.js
pause
