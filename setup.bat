@echo off
REM =============================================
REM  Clexpay - Quick Setup & Git Push Script
REM =============================================

echo.
echo ============================================
echo    Clexpay Deployment Setup
echo ============================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo [1/5] Initializing Git repository...
    git init
    git branch -M main
    echo.
)

REM Add all files
echo [2/5] Adding files to Git...
git add .
echo.

REM Check if there are changes to commit
git diff --cached --quiet
if errorlevel 1 (
    echo [3/5] Committing changes...
    git commit -m "Initial commit - Clexpay fintech platform"
    echo.
) else (
    echo [3/5] No changes to commit
    echo.
)

REM Set remote origin
echo [4/5] Setting GitHub remote...
git remote set-url origin https://github.com/setugbo/clexpay.git 2>nul
if errorlevel 1 (
    git remote add origin https://github.com/setugbo/clexpay.git
)
echo.

REM Push to GitHub
echo [5/5] Pushing to GitHub...
echo.
echo IMPORTANT: You will need your GitHub Personal Access Token
echo Generate one at: https://github.com/settings/tokens
echo.
git push -u origin main

echo.
echo ============================================
echo    Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Go to https://neon.tech and create a database
echo 2. Copy the connection string
echo 3. Go to https://vercel.com and create a new project
echo 4. Import from GitHub: setugbo/clexpay
echo 5. Add environment variables and deploy!
echo.
pause
