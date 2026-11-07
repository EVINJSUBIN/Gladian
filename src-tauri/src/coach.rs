use crate::scan::ScannedFile;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tauri::{AppHandle, Manager};

const MODEL: &str = "claude-3-5-sonnet-20241022";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanStep {
    pub title: String,
    pub detail: String,
    pub library_id: String,
    pub doc_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadingNote {
    pub matches: String,
    pub weak_pattern: String,
    pub practice: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudyProject {
    pub id: String,
    pub name: String,
    pub summary: String,
    pub library_ids: Vec<String>,
    #[serde(default)]
    pub steps: Vec<PlanStep>,
    #[serde(default)]
    pub note: Option<ReadingNote>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DraftInput {
    pub name: String,
    pub summary: String,
    pub library_ids: Vec<String>,
    pub notes: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewInput {
    pub docs: String,
    pub files: Vec<ScannedFile>,
}

fn key_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|error| error.to_string())?.join("claude-key"))
}

fn projects_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join("study-projects.json"))
}

pub fn set_api_key(app: &AppHandle, key: &str) -> Result<(), String> {
    let trimmed = key.trim();
    if trimmed.len() < 20 || trimmed.len() > 300 || trimmed.chars().any(|char| char.is_whitespace()) {
        return Err("That key does not look usable.".to_string());
    }
    let path = key_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(path, trimmed).map_err(|error| error.to_string())
}

pub fn clear_api_key(app: &AppHandle) -> Result<(), String> {
    let path = key_path(app)?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub fn has_api_key(app: &AppHandle) -> Result<bool, String> {
    let path = key_path(app)?;
    Ok(path.exists() && fs::read_to_string(path).map(|text| text.trim().len() > 20).unwrap_or(false))
}

fn read_key(app: &AppHandle) -> Result<String, String> {
    let path = key_path(app)?;
    let key = fs::read_to_string(path).map_err(|_| "Add an API key first. Saved documents still open without one.".to_string())?;
    let key = key.trim().to_string();
    if key.is_empty() {
        return Err("Add an API key first. Saved documents still open without one.".to_string());
    }
    Ok(key)
}

pub fn list_projects(app: &AppHandle) -> Result<Vec<StudyProject>, String> {
    let path = projects_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let text = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&text).map_err(|error| error.to_string())
}

pub fn save_projects(app: &AppHandle, projects: &[StudyProject]) -> Result<(), String> {
    if projects.len() > 40 {
        return Err("That is more projects than this desk keeps.".to_string());
    }
    let path = projects_path(app)?;
    fs::write(path, serde_json::to_string_pretty(projects).map_err(|error| error.to_string())?).map_err(|error| error.to_string())
}

fn ask_model(app: &AppHandle, prompt: &str) -> Result<String, String> {
    let key = read_key(app)?;
    let body = serde_json::json!({
        "model": MODEL,
        "max_tokens": 4096,
        "messages": [{ "role": "user", "content": prompt }]
    });
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|error| error.to_string())?;
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .body(body.to_string())
        .send()
        .map_err(|_| "The model could not be reached. Saved documents still open.".to_string())?;
    let status = response.status();
    let text = response.text().map_err(|error| error.to_string())?;
    if !status.is_success() {
        return Err(format!("The model did not answer ({status}). Saved documents still open."));
    }
    let value: serde_json::Value = serde_json::from_str(&text).map_err(|error| error.to_string())?;
    let mut out = String::new();
    if let Some(blocks) = value.get("content").and_then(|item| item.as_array()) {
        for block in blocks {
            if block.get("type").and_then(|item| item.as_str()) == Some("text") {
                out.push_str(block.get("text").and_then(|item| item.as_str()).unwrap_or(""));
            }
        }
    }
    let out = out.trim().to_string();
    if out.is_empty() {
        return Err("The model returned an empty reply.".to_string());
    }
    Ok(out)
}

fn parse_json(text: &str) -> Result<serde_json::Value, String> {
    let trimmed = text.trim();
    let body = trimmed
        .strip_prefix("```json")
        .or_else(|| trimmed.strip_prefix("```"))
        .map(|value| value.trim_start())
        .unwrap_or(trimmed);
    let body = body.strip_suffix("```").unwrap_or(body).trim();
    serde_json::from_str(body).map_err(|_| "The reply was not usable JSON.".to_string())
}

fn clip(value: &str, max: usize) -> String {
    value.chars().take(max).collect()
}

pub fn draft_plan(app: &AppHandle, input: &DraftInput) -> Result<Vec<PlanStep>, String> {
    let prompt = format!(
        "You write an offline study plan for a person who will type every line themselves. Return only JSON: {{\"steps\":[{{\"title\":\"\",\"detail\":\"\",\"libraryId\":\"\",\"docId\":\"\"}}]}}. Use 4 to 7 steps. Each step points at one document id from the notes. detail explains what to read and what to try, in under 70 words, and does not include a finished program. Project: {}\nGoal: {}\nLibraries: {}\nDocuments:\n{}",
        clip(&input.name, 80),
        clip(&input.summary, 600),
        input.library_ids.join(", "),
        clip(&input.notes, 8000)
    );
    let value = parse_json(&ask_model(app, &prompt)?)?;
    let steps = value
        .get("steps")
        .and_then(|item| item.as_array())
        .ok_or_else(|| "The plan had no steps.".to_string())?;
    let mut parsed = Vec::new();
    for step in steps.iter().take(8) {
        let title = clip(step.get("title").and_then(|item| item.as_str()).unwrap_or("").trim(), 80);
        let detail = clip(step.get("detail").and_then(|item| item.as_str()).unwrap_or("").trim(), 500);
        let library_id = clip(step.get("libraryId").and_then(|item| item.as_str()).unwrap_or("").trim(), 40);
        let doc_id = clip(step.get("docId").and_then(|item| item.as_str()).unwrap_or("").trim(), 80);
        if title.is_empty() || detail.is_empty() {
            continue;
        }
        parsed.push(PlanStep { title, detail, library_id, doc_id });
    }
    if parsed.is_empty() {
        return Err("The plan had no usable steps.".to_string());
    }
    Ok(parsed)
}

pub fn review_reading(app: &AppHandle, input: &ReviewInput) -> Result<ReadingNote, String> {
    let mut files = String::new();
    for file in input.files.iter().take(8) {
        files.push_str(&format!("\n## {}\n{}\n", file.path, clip(&file.text, 1500)));
        if files.len() > 8000 {
            break;
        }
    }
    let prompt = format!(
        "Compare these files with the documentation excerpts. Return only JSON: {{\"matches\":\"\",\"weakPattern\":\"\",\"practice\":\"\"}}. matches says what already agrees with the docs. weakPattern names one weak pattern in words, not a rewritten file. practice is one exercise the person should type themselves. Each field under 80 words. Do not write replacement code. Do not say to apply a patch.\nDocumentation:\n{}\nFiles:\n{}",
        clip(&input.docs, 8000),
        files
    );
    let value = parse_json(&ask_model(app, &prompt)?)?;
    let note = ReadingNote {
        matches: clip(value.get("matches").and_then(|item| item.as_str()).unwrap_or("").trim(), 500),
        weak_pattern: clip(value.get("weakPattern").and_then(|item| item.as_str()).unwrap_or("").trim(), 500),
        practice: clip(value.get("practice").and_then(|item| item.as_str()).unwrap_or("").trim(), 500),
    };
    if note.matches.is_empty() && note.weak_pattern.is_empty() && note.practice.is_empty() {
        return Err("The reading note was empty.".to_string());
    }
    Ok(note)
}
