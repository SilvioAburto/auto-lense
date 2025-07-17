use crate::vworks::VWorksEvent;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VWorksStatistics {
    pub total_events: usize,
}

pub struct VWorksDatabase {
    pub db_path: String,
}

unsafe impl Send for VWorksDatabase {}
unsafe impl Sync for VWorksDatabase {}

impl VWorksDatabase {
    pub fn new(db_path: &str) -> SqlResult<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                level TEXT,
                message TEXT,
                source TEXT,
                details TEXT
            )",
            [],
        )?;
        Ok(VWorksDatabase { db_path: db_path.to_string() })
    }

    pub fn insert_events(&self, events: &[VWorksEvent]) -> SqlResult<()> {
        let mut conn = Connection::open(&self.db_path)?;
        let tx = conn.transaction()?;
        for event in events {
            tx.execute(
                "INSERT INTO events (timestamp, level, message, source, details) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    event.timestamp,
                    event.level,
                    event.message,
                    event.source,
                    event.details.as_ref().map(|d| serde_json::to_string(d).unwrap_or_default())
                ],
            )?;
        }
        tx.commit()
    }

    pub fn get_events_page(&self, offset: usize, limit: usize) -> SqlResult<Vec<VWorksEvent>> {
        let conn = Connection::open(&self.db_path)?;
        let mut stmt = conn.prepare(
            "SELECT timestamp, level, message, source, details FROM events ORDER BY id LIMIT ?1 OFFSET ?2"
        )?;
        let rows = stmt.query_map(params![limit as i64, offset as i64], |row| {
            let details_str: Option<String> = row.get(4)?;
            let details = details_str
                .as_ref()
                .and_then(|s| serde_json::from_str(s).ok());
            Ok(VWorksEvent {
                timestamp: row.get(0)?,
                level: row.get(1)?,
                message: row.get(2)?,
                source: row.get(3)?,
                details,
                ..Default::default()
            })
        })?;
        let mut events = Vec::new();
        for event in rows {
            events.push(event?);
        }
        Ok(events)
    }

    pub fn get_statistics(&self) -> SqlResult<VWorksStatistics> {
        let conn = Connection::open(&self.db_path)?;
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM events")?;
        let total_events: usize = stmt.query_row([], |row| row.get(0))?;
        Ok(VWorksStatistics { total_events })
    }

    pub fn clear(&self) -> SqlResult<()> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute("DELETE FROM events", [])?;
        Ok(())
    }
} 