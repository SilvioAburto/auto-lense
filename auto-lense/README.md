# Lab Automation Lens

A modern desktop application for visualizing lab automation events from log files. Built with Tauri, React, and TypeScript.

## Features

- **Log File Parsing**: Automatically parse and extract lab automation events from text log files
- **Event Visualization**: View events in a chronological timeline with detailed cards
- **Statistics Dashboard**: Get insights into event types, instruments, and performance metrics
- **Advanced Filtering**: Filter events by type, instrument, status, and search terms
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

## Supported Event Types

The application can parse and visualize the following lab automation events:

- **Liquid Transfers**: Volume transfers between wells, reservoirs, and containers
- **Plate Readings**: Absorbance, fluorescence, and luminescence measurements
- **Incubation**: Temperature-controlled incubation events
- **Centrifugation**: Centrifugation operations with speed and duration
- **Temperature Changes**: System temperature adjustments
- **Pump Operations**: Flow rate and direction control
- **Valve Operations**: Valve position changes
- **Sensor Readings**: Temperature, pressure, and other sensor data
- **Error Events**: System errors and warnings
- **System Status**: Online/offline status and maintenance events

## Installation

### Prerequisites

- Node.js (v16 or higher)
- Rust (latest stable)
- Tauri CLI

### Setup

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd auto-lense
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Install Tauri CLI (if not already installed):
   ```bash
   npm install -g @tauri-apps/cli
   ```

## Development

### Running in Development Mode

```bash
npm run tauri dev
```

This will start the development server and open the application window.

### Building for Production

```bash
npm run tauri build
```

This creates platform-specific installers in the `src-tauri/target/release/bundle/` directory.

## Usage

### Loading Log Files

1. Click the "Load Log Files" button in the application
2. Select one or more log files (`.log`, `.txt`, or `.csv` format)
3. The application will automatically parse the files and extract events

### Viewing Events

- **Timeline View**: See events chronologically organized by date
- **Statistics View**: View summary statistics and event breakdowns

### Filtering Events

Use the sidebar filters to:
- Search for specific terms in event details
- Filter by event type (liquid transfer, plate reading, etc.)
- Filter by instrument name
- Filter by event status (completed, failed, running, etc.)

### Sample Log Files

The application includes sample log files in the `sample_logs/` directory:
- `liquid_handler.log`: Contains liquid handler transfer events
- `plate_reader.log`: Contains plate reader and incubation events

## Log File Format

The application can parse various log file formats. Here are some examples:

### Liquid Handler Events
```
2024-01-15 09:30:15 [LH200] Transfer 50 μL from Well A1 to Well B1 completed successfully
```

### Plate Reader Events
```
2024-01-15 10:00:00 [PR100] Plate reading started at 450 nm wavelength
```

### Incubation Events
```
2024-01-15 10:05:00 [PR100] Incubate plate at 37°C for 30 minutes
```

### Error Events
```
2024-01-15 09:33:12 [LH200] Error: Tip collision detected at position X:150 Y:200
```

## Customization

### Adding New Event Types

1. Update the `LabEventType` union type in `src/types/labEvents.ts`
2. Add parsing patterns in `src/utils/logParser.ts`
3. Create corresponding event creation methods
4. Update the `EventCard` component to handle the new event type

### Styling

The application uses Tailwind CSS for styling. Custom styles can be added in:
- `src/index.css` for global styles
- `tailwind.config.js` for theme customization

## Architecture

### Frontend (React + TypeScript)
- **Components**: Modular React components for UI elements
- **Types**: TypeScript interfaces for type safety
- **Utils**: Utility functions for log parsing and data processing

### Backend (Tauri + Rust)
- **File System**: Secure file access through Tauri plugins
- **Dialog**: Native file picker dialogs
- **Security**: Sandboxed file access with configurable permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
