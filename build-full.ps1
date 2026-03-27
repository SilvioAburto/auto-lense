Write-Host "Building AutoLense Full Application..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Building C# Backend..." -ForegroundColor Yellow
Set-Location "backend\AutoLense"
$backendResult = dotnet build --configuration Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build C# backend!" -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}
Write-Host "C# Backend built successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Copying AutoLense.exe to project root..." -ForegroundColor Yellow
Set-Location "..\.."
$sourceExe = "backend\AutoLense\bin\Release\net8.0\AutoLense.exe"
if (Test-Path $sourceExe) {
    Copy-Item $sourceExe "AutoLense.exe" -Force
    Write-Host "AutoLense.exe copied to project root" -ForegroundColor Green
} else {
    Write-Host "Warning: AutoLense.exe not found in expected location" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 3: Building Tauri Frontend..." -ForegroundColor Yellow
Set-Location "frontend"
$frontendResult = npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Tauri frontend!" -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}
Write-Host "Tauri Frontend built successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Building Tauri Application..." -ForegroundColor Yellow
$tauriResult = npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Tauri application!" -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}
Write-Host ""

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "The bundled application should be in: frontend\src-tauri\target\release\" -ForegroundColor Cyan
Read-Host "Press Enter to continue" 