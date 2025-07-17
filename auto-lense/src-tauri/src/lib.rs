// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod vworks;
mod watcher;
mod storage;

use tauri::State;
use crate::vworks::{VWorksParser, VWorksLogFile};
use crate::storage::VWorksDatabase;
use std::time::Instant;

// Global database instance
// Use Arc for thread safety
// Use a fixed path for the SQLite database
const DB_PATH: &str = "vworks_events.sqlite";
type DatabaseState = VWorksDatabase;

#[tauri::command]
async fn parse_vworks_file(
    file_path: String,
    db: State<'_, DatabaseState>,
) -> Result<VWorksLogFile, String> {
    let start = Instant::now();
    println!("[DEBUG] parse_vworks_file called with file_path: {}", file_path);
    let parser = VWorksParser::new();
    let content = match std::fs::read_to_string(&file_path) {
        Ok(c) => {
            println!("[DEBUG] Successfully read file: {} ({} bytes)", file_path, c.len());
            c
        },
        Err(e) => {
            println!("[ERROR] Failed to read file: {}: {}", file_path, e);
            return Err(format!("Failed to read file: {}", e));
        }
    };
    let log_file = match parser.parse_log_file(&content, &file_path) {
        Ok(lf) => {
            println!("[DEBUG] Parsed log file: {} events found", lf.events.len());
            lf
        },
        Err(e) => {
            println!("[ERROR] Failed to parse file: {}: {}", file_path, e);
            return Err(format!("Failed to parse file: {}", e));
        }
    };
    match db.insert_events(&log_file.events) {
        Ok(_) => println!("[DEBUG] Successfully inserted {} events into DB", log_file.events.len()),
        Err(e) => println!("[ERROR] Failed to insert events into DB: {}", e),
    }
    let duration = start.elapsed();
    println!("Rust: parse_vworks_file took {:?}", duration);
    Ok(log_file)
}

#[tauri::command]
async fn get_vworks_events_page(
    db: State<'_, DatabaseState>,
    offset: usize,
    limit: usize
) -> Result<Vec<vworks::VWorksEvent>, String> {
    let start = Instant::now();
    let result = db.get_events_page(offset, limit)
        .map_err(|e| format!("Failed to fetch events: {}", e));
    let duration = start.elapsed();
    println!("Rust: get_vworks_events_page (offset {}, limit {}) took {:?}", offset, limit, duration);
    result
}

#[tauri::command]
async fn get_vworks_statistics(db: State<'_, DatabaseState>) -> Result<storage::VWorksStatistics, String> {
    db.get_statistics().map_err(|e| format!("Failed to get statistics: {}", e))
}

#[tauri::command]
async fn scan_vworks_directory(directory_path: String) -> Result<Vec<String>, String> {
    use walkdir::WalkDir;
    let mut log_files = Vec::new();
    for entry in WalkDir::new(&directory_path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            if let Some(file_name) = entry.file_name().to_str() {
                if file_name.starts_with("vworks_log") && file_name.ends_with(".log") {
                    log_files.push(entry.path().to_string_lossy().to_string());
                }
            }
        }
    }
    Ok(log_files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = VWorksDatabase::new(DB_PATH).expect("Failed to open SQLite DB");
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            parse_vworks_file,
            get_vworks_events_page,
            get_vworks_statistics,
            scan_vworks_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
