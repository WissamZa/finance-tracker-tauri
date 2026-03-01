// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// Save backup to file
#[tauri::command]
fn save_backup(_content: String, filename: String) -> Result<String, String> {
    // This will be handled by the frontend with Tauri's fs plugin
    Ok(format!("Backup saved to: {}", filename))
}

/// Restore backup from file
#[tauri::command]
fn restore_backup(filepath: String) -> Result<String, String> {
    // This will be handled by the frontend with Tauri's fs plugin
    Ok(format!("Backup restored from: {}", filepath))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_backup, restore_backup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
