# Railway browserless login + link Q-Emplois project
# Run in PowerShell (interactive terminal): .\scripts\railway-login.ps1

$ErrorActionPreference = "Stop"

Write-Host "Railway browserless login..." -ForegroundColor Cyan
Write-Host "You will get a code and URL — open the URL in your browser and paste the code.`n"

npx @railway/cli@4.5.0 login --browserless
if ($LASTEXITCODE -ne 0) { throw "Login failed. Run this script in an interactive PowerShell window (not CI)." }

Write-Host "`nVerifying login..." -ForegroundColor Cyan
npx @railway/cli@4.5.0 whoami

Set-Location $PSScriptRoot\..

Write-Host "`nLinking project bce85347-5658-4038-987d-7a53d88c8c17 (q-emplois)..." -ForegroundColor Cyan
npx @railway/cli@4.5.0 link --project bce85347-5658-4038-987d-7a53d88c8c17

Write-Host "`nPublic domain (copy this URL):" -ForegroundColor Green
npx @railway/cli@4.5.0 domain

Write-Host "`nNext: wire Vercel with:" -ForegroundColor Yellow
Write-Host '  .\scripts\setup-production.ps1 -RailwayUrl "https://q-emplois-api-production.up.railway.app"'
