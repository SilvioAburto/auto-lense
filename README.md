# AutoLense - Laboratory Automation Log Analysis

AutoLense is a desktop application for monitoring and analyzing laboratory automation logs, with a focus on VWorks logs from Agilent's Lab Automation scheduler.

## Features

- **VWorks Log Analysis**: Parse and analyze VWorks log files with date range filtering
- **Real-time Dashboard**: View instrument activity, errors, and process status
- **Date Range Filtering**: Filter logs by specific date ranges (MM/DD/YYYY format)
- **Multi-file Processing**: Automatically processes all log files in a directory within the specified date range
- **Error Detection**: Identifies and categorizes errors in lab automation processes
- **Instrument Monitoring**: Track activity across multiple laboratory instruments

## Architecture

The application consists of:

- **Frontend**: React + TypeScript + Tauri for the desktop UI
- **Backend**: C# .NET 8 console application for log parsing
- **Integration**: Tauri commands bridge the frontend and backend

### Build Process

The application uses a multi-stage build process:

1. **C# Backend Build**: The C# backend is built in Release mode and copied to the project root
2. **Tauri Build Integration**: The `build.rs` script automatically builds the C# backend during Tauri builds
3. **Resource Bundling**: The C# executable is included as a resource in the final Tauri bundle
4. **Runtime Discovery**: The Rust code searches multiple locations to find the C# executable at runtime

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- .NET 8 SDK
- Rust (for Tauri)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd logs-lense
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Build the backend:
```bash
cd ../backend/AutoLense
dotnet build
```

4. Run the application:
```bash
cd ../../frontend
npm run tauri dev
```

### Building for Distribution

To build a complete bundled application that includes the C# backend:

**Windows (Command Prompt):**
```bash
build-full.bat
```

**Windows (PowerShell):**
```powershell
.\build-full.ps1
```

**Manual Build:**
```bash
# Build C# backend in Release mode
cd backend/AutoLense
dotnet build --configuration Release

# Copy executable to project root
cd ../..
copy "backend\AutoLense\bin\Release\net8.0\AutoLense.exe" "AutoLense.exe"

# Build Tauri application
cd frontend
npm run build
npm run tauri build
```

The bundled application will be available in `frontend/src-tauri/target/release/`.

## Usage

### VWorks Dashboard

1. Navigate to the VWorks dashboard from the home screen
2. Configure the log analysis:
   - **Log Directory**: Select the folder containing VWorks log files (default: `C:\VWorks Workspace\VWorks\Logs`)
   - **Start Date**: Enter the start date in MM/DD/YYYY format
   - **End Date**: Enter the end date in MM/DD/YYYY format
3. Click "Parse Logs" to analyze the files
4. View results in the dashboard tabs:
   - **Overview**: Summary statistics and recent activity
   - **Recent Events**: Detailed list of all parsed events
   - **Errors**: Error events and their details
   - **Instruments**: Activity status for each instrument

### Backend Commands

The C# backend can also be used directly from the command line:

```bash
# Parse logs from a folder with date range
AutoLense.exe parse-logs "C:\VWorks Workspace\VWorks\Logs" "03/01/2020" "03/31/2020"

# Parse a single log file
AutoLense.exe parse-single "C:\path\to\logfile.log"
```

## Log File Format

The parser expects VWorks log files in tab-delimited format with the following columns:
1. Timestamp
2. Event Type
3. Instrument
4. Location
5. Process
6. Step
7. Description
8. Protocol
9. File Path
10. Process ID

## Development

### Backend Development

The C# backend is located in `backend/AutoLense/` and includes:
- `Program.cs`: Main entry point with command-line interface
- `Services/VWorksLogParser.cs`: Core log parsing logic
- `Models/`: Data models for parsed log data

### Frontend Development

The React frontend is in `frontend/src/` with:
- `App.tsx`: Main application component
- `components/VWorksDashboard.tsx`: VWorks-specific dashboard
- Tauri integration in `src-tauri/src/lib.rs`

### Adding New Log Types

To support additional log formats:

1. Create a new parser class implementing `ILogParser`
2. Add corresponding Tauri commands in `lib.rs`
3. Create a new dashboard component
4. Update the main app to include the new instrument type

## License

[Add your license information here] 