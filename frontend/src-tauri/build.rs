use std::env;
use std::path::Path;
use std::process::Command;

fn main() {
    // Build the C# backend first
    build_csharp_backend();
    // Then build Tauri
    tauri_build::build()
}

fn build_csharp_backend() {
    println!("cargo:rerun-if-changed=../../backend/AutoLense/Program.cs");
    println!("cargo:rerun-if-changed=../../backend/AutoLense/Services/");
    println!("cargo:rerun-if-changed=../../backend/AutoLense/Models/");
    
    // Get the project root directory
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let project_root = Path::new(&manifest_dir).join("../../");
    let backend_path = project_root.join("backend/AutoLense");
    
    if !backend_path.exists() {
        panic!("Backend directory not found at: {}", backend_path.display());
    }
    
    println!("Building C# backend...");
    let build_result = Command::new("dotnet")
        .args(&["build", "--configuration", "Release"])
        .current_dir(&backend_path)
        .output();
    
    match build_result {
        Ok(output) => {
            if output.status.success() {
                println!("C# backend built successfully");
                
                // Copy the executable to the Tauri app directory for bundling
                let source_exe = backend_path.join("bin/Release/net8.0/AutoLense.exe");
                let target_dir = Path::new(&manifest_dir).join("../../");
                let target_exe = target_dir.join("AutoLense.exe");
                
                if source_exe.exists() {
                    if let Err(e) = std::fs::copy(&source_exe, &target_exe) {
                        eprintln!("Warning: Failed to copy AutoLense.exe: {}", e);
                    } else {
                        println!("AutoLense.exe copied to: {}", target_exe.display());
                    }
                } else {
                    eprintln!("Warning: AutoLense.exe not found at: {}", source_exe.display());
                }
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                panic!("Failed to build C# backend: {}", error);
            }
        }
        Err(e) => {
            panic!("Failed to execute dotnet build: {}", e);
        }
    }
}