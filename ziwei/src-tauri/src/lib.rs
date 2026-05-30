use std::fs;
use serde::{Serialize, Deserialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager, Emitter};
use rusqlite::Connection;
use futures_util::StreamExt;

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Profile {
    id: String,
    name: String,
    gender: String,
    birth_type: String, // "solar" or "lunar"
    is_leap_month: bool,
    birth_date: String, // "YYYY-MM-DD HH"
    created_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct ChatMessage {
    role: String, // "system", "user", "assistant"
    content: String,
}

// Initialize SQLite database and tables
fn init_db(app_handle: &AppHandle) -> Result<Connection, String> {
    let local_data_dir = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app local data dir: {}", e))?;
    fs::create_dir_all(&local_data_dir).map_err(|e| format!("Failed to create local data dir: {}", e))?;
    let db_path = local_data_dir.join("ziwei.db");
    
    let conn = Connection::open(db_path).map_err(|e| format!("Failed to open DB: {}", e))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            gender TEXT NOT NULL,
            birth_type TEXT NOT NULL,
            is_leap_month INTEGER NOT NULL,
            birth_date TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| format!("Failed to initialize profiles table: {}", e))?;

    Ok(conn)
}

// Settings storage commands
#[tauri::command]
fn save_settings(settings: Value, app_handle: AppHandle) -> Result<(), String> {
    let config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;
    fs::create_dir_all(&config_dir).map_err(|e| format!("Failed to create config dir: {}", e))?;
    let file_path = config_dir.join("settings.json");
    
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(file_path, content).map_err(|e| format!("Failed to write settings: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn load_settings(app_handle: AppHandle) -> Result<Value, String> {
    let config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;
    let file_path = config_dir.join("settings.json");
    
    if !file_path.exists() {
        return Ok(json!({
            "apiKey": "",
            "model": "google/gemini-2.5-flash"
        }));
    }
    
    let content = fs::read_to_string(file_path).map_err(|e| format!("Failed to read settings: {}", e))?;
    let settings: Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;
    
    Ok(settings)
}

// Profile CRUD commands
#[tauri::command]
fn get_profiles(app_handle: AppHandle) -> Result<Vec<Profile>, String> {
    let conn = init_db(&app_handle)?;
    let mut stmt = conn
        .prepare("SELECT id, name, gender, birth_type, is_leap_month, birth_date, created_at FROM profiles ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare select statement: {}", e))?;
        
    let profile_iter = stmt
        .query_map([], |row| {
            Ok(Profile {
                id: row.get(0)?,
                name: row.get(1)?,
                gender: row.get(2)?,
                birth_type: row.get(3)?,
                is_leap_month: row.get::<_, i32>(4)? != 0,
                birth_date: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("Failed to map profiles query: {}", e))?;

    let mut profiles = Vec::new();
    for profile in profile_iter {
        profiles.push(profile.map_err(|e| format!("Failed to fetch profile row: {}", e))?);
    }
    
    Ok(profiles)
}

#[tauri::command]
fn save_profile(profile: Profile, app_handle: AppHandle) -> Result<(), String> {
    let conn = init_db(&app_handle)?;
    conn.execute(
        "INSERT OR REPLACE INTO profiles (id, name, gender, birth_type, is_leap_month, birth_date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (
            &profile.id,
            &profile.name,
            &profile.gender,
            &profile.birth_type,
            if profile.is_leap_month { 1 } else { 0 },
            &profile.birth_date,
            &profile.created_at,
        ),
    )
    .map_err(|e| format!("Failed to save profile: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn delete_profile(id: String, app_handle: AppHandle) -> Result<(), String> {
    let conn = init_db(&app_handle)?;
    conn.execute("DELETE FROM profiles WHERE id = ?1", [&id])
        .map_err(|e| format!("Failed to delete profile: {}", e))?;
    
    Ok(())
}

// OpenRouter Proxy with SSE Streaming
#[tauri::command]
async fn ask_ai(messages: Vec<ChatMessage>, app_handle: AppHandle) -> Result<(), String> {
    let settings = load_settings(app_handle.clone())?;
    let api_key = settings.get("apiKey")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "API key not set. Please set it in Settings.".to_string())?;
        
    if api_key.trim().is_empty() {
        return Err("API key not set. Please set it in Settings.".to_string());
    }

    let model = settings.get("model")
        .and_then(|v| v.as_str())
        .unwrap_or("google/gemini-2.5-flash");

    let client = reqwest::Client::new();
    let response = client
        .post("https://openrouter.ai/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("HTTP-Referer", "https://github.com/ai-generated-001/ziwei")
        .header("X-Title", "ZiWei Analyzer")
        .json(&json!({
            "model": model,
            "messages": messages,
            "stream": true
        }))
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("OpenRouter error (status {}): {}", status, error_text));
    }

    let mut buffer = String::new();
    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Stream error: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(newline_idx) = buffer.find('\n') {
            let line = buffer[..newline_idx].trim().to_string();
            buffer = buffer[newline_idx + 1..].to_string();

            if line.starts_with("data: ") {
                let data_content = &line[6..];
                if data_content == "[DONE]" {
                    break;
                }
                
                if let Ok(json) = serde_json::from_str::<Value>(data_content) {
                    if let Some(choices) = json.get("choices") {
                        if let Some(choice) = choices.get(0) {
                            if let Some(delta) = choice.get("delta") {
                                if let Some(content) = delta.get("content").and_then(|c| c.as_str()) {
                                    app_handle
                                        .emit("ai-response-chunk", content)
                                        .map_err(|e| format!("Tauri emit error: {}", e))?;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Process remainder of the buffer
    let line = buffer.trim();
    if line.starts_with("data: ") {
        let data_content = &line[6..];
        if data_content != "[DONE]" {
            if let Ok(json) = serde_json::from_str::<Value>(data_content) {
                if let Some(choices) = json.get("choices") {
                    if let Some(choice) = choices.get(0) {
                        if let Some(delta) = choice.get("delta") {
                            if let Some(content) = delta.get("content").and_then(|c| c.as_str()) {
                                app_handle
                                    .emit("ai-response-chunk", content)
                                    .map_err(|e| format!("Tauri emit error: {}", e))?;
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_settings,
            load_settings,
            get_profiles,
            save_profile,
            delete_profile,
            ask_ai
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

