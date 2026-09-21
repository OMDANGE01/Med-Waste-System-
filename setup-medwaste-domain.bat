@echo off
title Setup medwaste Domain Name
echo ============================================================
echo  Setting up http://medwaste domain on this computer...
echo ============================================================
echo.

:: Check for administrative rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Requesting Administrator privileges to update hosts file...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

set HOSTS_FILE=%WINDIR%\System32\drivers\etc\hosts

findstr /I /C:"medwaste" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Domain 'medwaste' is already configured in your hosts file!
) else (
    echo. >> "%HOSTS_FILE%"
    echo 127.0.0.1 medwaste >> "%HOSTS_FILE%"
    echo [SUCCESS] Successfully added '127.0.0.1 medwaste' to %HOSTS_FILE%
)

echo.
echo ============================================================
echo  Setup Complete!
echo  You can now type: http://medwaste:5000 or http://medwaste:5173
echo  directly into any browser on your computer!
echo ============================================================
pause
