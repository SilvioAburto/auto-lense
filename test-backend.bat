@echo off
echo Testing AutoLense C# Backend...
echo.

REM Calculate dates (using PowerShell for date calculation)
for /f "tokens=*" %%i in ('powershell -command "Get-Date -Format 'MM/dd/yyyy'"') do set endDate=%%i
for /f "tokens=*" %%i in ('powershell -command "(Get-Date).AddMonths(-1).ToString('MM/dd/yyyy')"') do set startDate=%%i

echo Date Range:
echo   Start Date: %startDate%
echo   End Date: %endDate%
echo.

REM Check if executable exists
if not exist "backend\AutoLense\bin\Release\net8.0\AutoLense.exe" (
    echo Building C# backend first...
    cd backend\AutoLense
    dotnet build --configuration Release
    cd ..\..
    
    if not exist "backend\AutoLense\bin\Release\net8.0\AutoLense.exe" (
        echo Error: AutoLense.exe not found!
        pause
        exit /b 1
    )
)

REM Default log directory
set logDirectory=C:\VWorks Workspace\VWorks\Logs

echo Testing with parameters:
echo   Command: parse-logs
echo   Directory: %logDirectory%
echo   Start Date: %startDate%
echo   End Date: %endDate%
echo.

echo Running AutoLense...
backend\AutoLense\bin\Release\net8.0\AutoLense.exe parse-logs "%logDirectory%" "%startDate%" "%endDate%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Backend executed successfully.
    echo.
    echo Output files created:
    if exist "parsed_lab_logs.json" echo   - parsed_lab_logs.json
    if exist "lab_analysis_report.txt" echo   - lab_analysis_report.txt
) else (
    echo.
    echo Error: Backend execution failed with exit code %ERRORLEVEL%
)

echo.
echo Test completed.
pause 