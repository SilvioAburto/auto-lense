# Test script for AutoLense C# Backend
Write-Host "Testing AutoLense C# Backend..." -ForegroundColor Green
Write-Host ""

# Calculate dates
$today = Get-Date
$oneMonthAgo = $today.AddMonths(-1)

# Format dates for C# backend (MM/DD/YYYY format)
$startDate = $oneMonthAgo.ToString("MM/dd/yyyy")
$endDate = $today.ToString("MM/dd/yyyy")

Write-Host "Date Range:" -ForegroundColor Yellow
Write-Host "  Start Date: $startDate" -ForegroundColor Cyan
Write-Host "  End Date: $endDate" -ForegroundColor Cyan
Write-Host ""

# Check if the executable exists
$exePath = "backend\AutoLense\bin\Release\net8.0\AutoLense.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "Building C# backend first..." -ForegroundColor Yellow
    Set-Location "backend\AutoLense"
    dotnet build --configuration Release
    Set-Location "..\.."
    
    if (-not (Test-Path $exePath)) {
        Write-Host "Error: AutoLense.exe not found at $exePath" -ForegroundColor Red
        exit 1
    }
}

# Default log directory
$logDirectory = "C:\VWorks Workspace\VWorks\Logs"

Write-Host "Testing with parameters:" -ForegroundColor Yellow
Write-Host "  Command: parse-logs" -ForegroundColor Cyan
Write-Host "  Directory: $logDirectory" -ForegroundColor Cyan
Write-Host "  Start Date: $startDate" -ForegroundColor Cyan
Write-Host "  End Date: $endDate" -ForegroundColor Cyan
Write-Host ""

# Test the backend
Write-Host "Running AutoLense..." -ForegroundColor Green
try {
    $result = & $exePath "parse-logs" $logDirectory $startDate $endDate 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success! Backend executed successfully." -ForegroundColor Green
        Write-Host ""
        Write-Host "Output files created:" -ForegroundColor Yellow
        if (Test-Path "parsed_lab_logs.json") {
            Write-Host "  - parsed_lab_logs.json" -ForegroundColor Cyan
        }
        if (Test-Path "lab_analysis_report.txt") {
            Write-Host "  - lab_analysis_report.txt" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Error: Backend execution failed with exit code $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Error output:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "Exception occurred: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Green 