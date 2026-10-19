# PowerShell script to generate secrets for .env files
# Run this script: .\generate-secrets.ps1

Write-Host "=== Generating Secrets for E-Commerce Platform ===" -ForegroundColor Green
Write-Host ""

# Generate JWT Secret
$jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
Write-Host ""

# Generate NextAuth Secret
$nextAuthSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "NEXTAUTH_SECRET=$nextAuthSecret" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== Instructions ===" -ForegroundColor Green
Write-Host "1. Copy JWT_SECRET to server/.env" -ForegroundColor Cyan
Write-Host "2. Copy NEXTAUTH_SECRET to:" -ForegroundColor Cyan
Write-Host "   - app/.env.local" -ForegroundColor Cyan
Write-Host "   - server/.env (optional)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to copy JWT_SECRET to clipboard..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Copy to clipboard
$jwtSecret | Set-Clipboard
Write-Host "JWT_SECRET copied to clipboard!" -ForegroundColor Green

