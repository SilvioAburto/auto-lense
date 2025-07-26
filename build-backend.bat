@echo off
echo Building AutoLense C# Backend...
cd backend\AutoLense
dotnet build
if %ERRORLEVEL% EQU 0 (
    echo Backend built successfully!
    echo Executable should be at: backend\AutoLense\bin\Debug\net8.0\AutoLense.exe
) else (
    echo Failed to build backend!
)
pause 