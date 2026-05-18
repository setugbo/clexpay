#!/usr/bin/env pwsh
# =============================================
#  Clexpay - Quick Setup & Git Push Script
# =============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Clexpay Deployment Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Initializing Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host ""
}

# Add all files
Write-Host "[2/5] Adding files to Git..." -ForegroundColor Yellow
git add .
Write-Host ""

# Check if there are changes to commit
$changes = git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[3/5] Committing changes..." -ForegroundColor Yellow
    git commit -m "Initial commit - Clexpay fintech platform"
    Write-Host ""
} else {
    Write-Host "[3/5] No changes to commit" -ForegroundColor Gray
    Write-Host ""
}

# Set remote origin
Write-Host "[4/5] Setting GitHub remote..." -ForegroundColor Yellow
git remote set-url origin https://github.com/setugbo/clexpay.git 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin https://github.com/setugbo/clexpay.git
}
Write-Host ""

# Push to GitHub
Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: You will need your GitHub Personal Access Token" -ForegroundColor Red
Write-Host "Generate one at: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""
git push -u origin main

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Go to https://neon.tech and create a database" -ForegroundColor Gray
Write-Host "2. Copy the connection string" -ForegroundColor Gray
Write-Host "3. Go to https://vercel.com and create a new project" -ForegroundColor Gray
Write-Host "4. Import from GitHub: setugbo/clexpay" -ForegroundColor Gray
Write-Host "5. Add environment variables and deploy!" -ForegroundColor Gray
Write-Host ""
