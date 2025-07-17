use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VWorksEvent {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub source: String,
    pub details: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VWorksLogFile {
    pub file_path: String,
    pub events: Vec<VWorksEvent>,
    pub total_events: usize,
}

pub struct VWorksParser;

impl VWorksParser {
    pub fn new() -> Self {
        VWorksParser
    }

    pub fn parse_log_file(&self, content: &str, file_path: &str) -> Result<VWorksLogFile, String> {
        let mut events = Vec::new();
        let lines: Vec<&str> = content.lines().collect();

        for (line_num, line) in lines.iter().enumerate() {
            if let Some(event) = self.parse_line(line, line_num + 1) {
                // Only keep events where the second column is 'Event'
                if event.level == "Event" {
                    events.push(event);
                }
            }
        }

        let total_events = events.len();
        Ok(VWorksLogFile {
            file_path: file_path.to_string(),
            events,
            total_events,
        })
    }

    fn parse_line(&self, line: &str, line_num: usize) -> Option<VWorksEvent> {
        if line.trim().is_empty() {
            return None;
        }
        // Split by tab, expect at least 2 columns
        let columns: Vec<&str> = line.split('\t').collect();
        if columns.len() < 2 {
            return None;
        }
        let timestamp = columns.get(0).map(|s| s.to_string()).unwrap_or_else(|| format!("Line {}", line_num));
        let level = columns.get(1).unwrap_or(&"INFO").to_string();
        let message = columns.get(4).unwrap_or(&"").to_string();
        Some(VWorksEvent {
            timestamp,
            level,
            message,
            source: "vworks".to_string(),
            details: None,
        })
    }
} 