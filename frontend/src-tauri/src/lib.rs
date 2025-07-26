use std::process::Command;
use std::path::Path;
use std::env;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ParseLogsRequest {
    folder_path: String,
    start_date: String,
    end_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParseSingleFileRequest {
    file_path: String,
}

fn find_autolense_executable() -> Result<std::path::PathBuf, String> {
    // Try multiple possible paths for the C# executable
    let possible_paths = vec![
        // In the same directory as the Tauri app (for bundled releases)
        Path::new("AutoLense.exe"),
        // In the resources directory (bundled app)
        Path::new("resources/AutoLense.exe"),
        // Relative to current working directory (debug mode)
        Path::new("../../backend/AutoLense/bin/Debug/net8.0/AutoLense.exe"),
        // Relative to current working directory (release mode)
        Path::new("../../backend/AutoLense/bin/Release/net8.0/AutoLense.exe"),
        // Absolute path from current directory
        Path::new("backend/AutoLense/bin/Debug/net8.0/AutoLense.exe"),
        Path::new("backend/AutoLense/bin/Release/net8.0/AutoLense.exe"),
    ];

    for path in possible_paths {
        if path.exists() {
            return Ok(path.to_path_buf());
        }
    }

    // If none of the relative paths work, try to get the current directory and build absolute paths
    if let Ok(current_dir) = env::current_dir() {
        let absolute_paths = vec![
            current_dir.join("AutoLense.exe"),
            current_dir.join("resources/AutoLense.exe"),
            current_dir.join("../../backend/AutoLense/bin/Debug/net8.0/AutoLense.exe"),
            current_dir.join("../../backend/AutoLense/bin/Release/net8.0/AutoLense.exe"),
            current_dir.join("backend/AutoLense/bin/Debug/net8.0/AutoLense.exe"),
            current_dir.join("backend/AutoLense/bin/Release/net8.0/AutoLense.exe"),
        ];

        for path in absolute_paths {
            if path.exists() {
                return Ok(path);
            }
        }
    }

    Err("AutoLense executable not found. Please ensure the C# backend has been built.".to_string())
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn test_backend_connection() -> Result<String, String> {
    match find_autolense_executable() {
        Ok(path) => Ok(format!("AutoLense executable found at: {}", path.display())),
        Err(e) => Err(e)
    }
}

#[tauri::command]
fn parse_vworks_logs(request: ParseLogsRequest) -> Result<String, String> {
    // Find the C# executable
    let exe_path = find_autolense_executable()?;

    // Run the C# command
    let output = Command::new(&exe_path)
        .arg("parse-logs")
        .arg(&request.folder_path)
        .arg(&request.start_date)
        .arg(&request.end_date)
        .current_dir(exe_path.parent().unwrap_or(Path::new(".")))
        .output()
        .map_err(|e| format!("Failed to execute AutoLense at {}: {}", exe_path.display(), e))?;

    if output.status.success() {
        // Get the JSON output from stdout
        let json_result = String::from_utf8(output.stdout)
            .map_err(|e| format!("Failed to parse output as UTF-8: {}", e))?;
        
        // Trim whitespace and check if it's valid JSON
        let trimmed = json_result.trim();
        if trimmed.is_empty() {
            return Err("AutoLense returned empty output".to_string());
        }
        
        Ok(trimmed.to_string())
    } else {
        // Get error message from stderr
        let error_msg = String::from_utf8(output.stderr)
            .unwrap_or_else(|_| "Unknown error occurred".to_string());
        
        Err(format!("AutoLense failed: {}", error_msg))
    }
}

#[tauri::command]
fn parse_single_vworks_file(request: ParseSingleFileRequest) -> Result<String, String> {
    // Find the C# executable
    let exe_path = find_autolense_executable()?;

    // Run the C# command
    let output = Command::new(&exe_path)
        .arg("parse-single")
        .arg(&request.file_path)
        .current_dir(exe_path.parent().unwrap_or(Path::new(".")))
        .output()
        .map_err(|e| format!("Failed to execute AutoLense at {}: {}", exe_path.display(), e))?;

    if output.status.success() {
        // Get the JSON output from stdout
        let json_result = String::from_utf8(output.stdout)
            .map_err(|e| format!("Failed to parse output as UTF-8: {}", e))?;
        
        // Trim whitespace and check if it's valid JSON
        let trimmed = json_result.trim();
        if trimmed.is_empty() {
            return Err("AutoLense returned empty output".to_string());
        }
        
        Ok(trimmed.to_string())
    } else {
        // Get error message from stderr
        let error_msg = String::from_utf8(output.stderr)
            .unwrap_or_else(|_| "Unknown error occurred".to_string());
        
        Err(format!("AutoLense failed: {}", error_msg))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            test_backend_connection,
            parse_vworks_logs,
            parse_single_vworks_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
