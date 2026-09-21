@echo off
title Push MedWaste to GitHub
echo ============================================================
echo  Push MedWaste to GitHub
echo ============================================================
echo.

set "GIT_EXE=C:\Users\OM\AppData\Local\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe"

if not exist "%GIT_EXE%" (
  set "GIT_EXE=git"
)

echo [1/3] Checking Git status...
"%GIT_EXE%" status

echo.
echo [2/3] Adding changes and committing...
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "Deploy MedWaste Guard to Cloud"

echo.
echo ============================================================
echo  Please create a new repository on GitHub:
echo  1. Go to: https://github.com/new
echo  2. Repository name: medwaste
echo  3. Choose Public or Private
echo  4. Do NOT initialize with README (leave it empty)
echo  5. Click "Create repository"
echo ============================================================
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/Ommohe007/medwaste.git): "

if "%REPO_URL%"=="" (
  echo Error: No URL provided.
  pause
  exit /b
)

"%GIT_EXE%" remote remove origin 2>nul
"%GIT_EXE%" remote add origin %REPO_URL%
"%GIT_EXE%" branch -M main

echo.
echo [3/3] Pushing code to GitHub...
"%GIT_EXE%" push -u origin main

echo.
echo ============================================================
echo  DONE! Your code is on GitHub!
echo  Next step: Go to https://render.com and deploy your repo!
echo ============================================================
pause
