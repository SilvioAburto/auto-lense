use std::path::Path;
use std::sync::mpsc;
use notify::{Watcher, RecursiveMode, Event};

pub struct FileWatcher {
    watcher: Box<dyn Watcher>,
    rx: mpsc::Receiver<Result<Event, notify::Error>>,
}

impl FileWatcher {
    pub fn new() -> Result<Self, notify::Error> {
        let (tx, rx) = mpsc::channel();
        let watcher = notify::recommended_watcher(move |res| {
            let _ = tx.send(res);
        })?;
        
        Ok(FileWatcher {
            watcher: Box::new(watcher),
            rx,
        })
    }

    pub fn watch_directory<P: AsRef<Path>>(&mut self, path: P) -> Result<(), notify::Error> {
        self.watcher.watch(path.as_ref(), RecursiveMode::Recursive)
    }

    pub fn try_receive_event(&self) -> Option<Event> {
        self.rx.try_recv().ok().and_then(|res| res.ok())
    }

    pub fn receive_event(&self) -> Result<Event, Box<dyn std::error::Error>> {
        match self.rx.recv() {
            Ok(Ok(event)) => Ok(event),
            Ok(Err(e)) => Err(Box::new(e)),
            Err(e) => Err(Box::new(e)),
        }
    }
}

// Simple file watcher for VWorks log files
pub struct VWorksFileWatcher {
    watcher: FileWatcher,
}

impl VWorksFileWatcher {
    pub fn new() -> Result<Self, notify::Error> {
        Ok(VWorksFileWatcher {
            watcher: FileWatcher::new()?,
        })
    }

    pub fn watch_vworks_directory<P: AsRef<Path>>(&mut self, path: P) -> Result<(), notify::Error> {
        self.watcher.watch_directory(path)
    }

    pub fn check_for_new_files(&self) -> Vec<String> {
        let mut new_files = Vec::new();
        
        while let Some(event) = self.watcher.try_receive_event() {
            if event.kind.is_create() {
                for path in &event.paths {
                    if let Some(file_name) = path.file_name() {
                        if let Some(name) = file_name.to_str() {
                            if name.starts_with("vworks_log") && name.ends_with(".log") {
                                new_files.push(path.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
        
        new_files
    }
} 