@echo off
echo Building Full Application...
echo.

echo Step 1: Building C# Backend...
cd backend\AutoLense
dotnet build --configuration Release
if %ERRORLEVEL% NEQ 0 (
    echo Failed to build C# backend!
    pause
    exit /b 1
)
echo Backend built successfully!
echo.

echo Step 2: Copying AutoLense.exe to project root...
cd ..\..
if exist "backend\AutoLense\bin\Release\net8.0\AutoLense.exe" (
    copy "backend\AutoLense\bin\Release\net8.0\AutoLense.exe" "AutoLense.exe" >nul
    echo AutoLense.exe copied to project root
) else (
    echo Warning: AutoLense.exe not found in expected location
)
echo.

echo Step 3: Building Tauri Frontend...
cd frontend
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Failed to build Tauri frontend!
    pause
    exit /b 1
)
echo Tauri Frontend built successfully!
echo.

echo Step 4: Building Tauri Application...
npm run tauri build
if %ERRORLEVEL% NEQ 0 (
    echo Failed to build Tauri application!
    pause
    exit /b 1
)
echo.

echo Build completed successfully!
echo The bundled application should be in: frontend\src-tauri\target\release\
pause 