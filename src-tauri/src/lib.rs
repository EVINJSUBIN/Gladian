mod coach;
mod scan;

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Article {
    id: String,
    title: String,
    body: String,
    try_it: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DocSection {
    id: String,
    title: String,
    body: String,
    try_it: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DocModule {
    id: String,
    title: String,
    sections: Vec<DocSection>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SavedLibrary {
    id: String,
    name: String,
    source_url: String,
    articles: Vec<Article>,
    #[serde(default)]
    hints: Vec<String>,
    #[serde(default)]
    modules: Vec<DocModule>,
    #[serde(default)]
    simplified_at: Option<String>,
}

fn libraries_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("libraries");
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn valid_package(name: &str) -> bool {
    let mut chars = name.chars();
    match chars.next() {
        Some(first) if first.is_ascii_alphanumeric() => {}
        _ => return false,
    }
    name.len() <= 64
        && name
            .chars()
            .all(|char| char.is_ascii_alphanumeric() || matches!(char, '-' | '_' | '.'))
}

fn run_pip(packages: &[String]) -> Result<String, String> {
    let attempts: [(&str, &[&str]); 2] = [
        ("py", &["-3", "-m", "pip", "install", "--disable-pip-version-check"]),
        ("python", &["-m", "pip", "install", "--disable-pip-version-check"]),
    ];
    let mut last = "Python was not found. Install Python, then try the guide's install again.".to_string();
    for (program, prefix) in attempts {
        let mut command = Command::new(program);
        command.args(prefix).args(packages);
        match command.output() {
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => return Err(error.to_string()),
            Ok(output) => {
                let mut text = format!(
                    "{}{}",
                    String::from_utf8_lossy(&output.stdout),
                    String::from_utf8_lossy(&output.stderr)
                );
                if text.len() > 20_000 {
                    text.truncate(20_000);
                }
                if output.status.success() {
                    return Ok(if text.trim().is_empty() {
                        format!("Installed {}.", packages.join(", "))
                    } else {
                        text
                    });
                }
                last = if text.trim().is_empty() {
                    format!("pip exited with {}", output.status)
                } else {
                    text
                };
                return Err(last);
            }
        }
    }
    Err(last)
}

fn html_to_article(page_url: &str, html: &str) -> Article {
    let title = Regex::new(r"(?is)<title[^>]*>(.*?)</title>")
        .ok()
        .and_then(|pattern| pattern.captures(html).map(|caps| caps[1].trim().to_string()))
        .filter(|title| !title.is_empty())
        .unwrap_or_else(|| page_url.to_string());
    let without_script = Regex::new(r"(?is)<script[^>]*>.*?</script>")
        .map(|pattern| pattern.replace_all(html, " ").to_string())
        .unwrap_or_else(|_| html.to_string());
    let without_style = Regex::new(r"(?is)<style[^>]*>.*?</style>")
        .map(|pattern| pattern.replace_all(&without_script, " ").to_string())
        .unwrap_or(without_script);
    let text = Regex::new(r"(?is)<[^>]+>")
        .map(|pattern| pattern.replace_all(&without_style, " ").to_string())
        .unwrap_or(without_style);
    let body = text.split_whitespace().collect::<Vec<_>>().join(" ");
    let body = body.chars().take(8000).collect::<String>();
    let id = Regex::new(r"[^a-z0-9]+")
        .map(|pattern| {
            pattern
                .replace_all(&page_url.to_lowercase(), "-")
                .trim_matches('-')
                .chars()
                .take(80)
                .collect::<String>()
        })
        .unwrap_or_else(|_| "page".to_string());
    Article {
        id: if id.is_empty() { "page".to_string() } else { id },
        title,
        body: if body.is_empty() {
            "This page had no readable text.".to_string()
        } else {
            body
        },
        try_it: "Read one idea from this page and try a small version of it yourself.".to_string(),
    }
}

fn fetch_text(client: &reqwest::blocking::Client, url: &str) -> Result<String, String> {
    let response = client.get(url).send().map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Could not download {url} ({}).", response.status()));
    }
    let kind = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("")
        .to_string();
    if !kind.is_empty() && !kind.to_ascii_lowercase().contains("html") && !kind.to_ascii_lowercase().contains("text") {
        return Err("That URL is not a text document.".to_string());
    }
    response.text().map_err(|error| error.to_string())
}

fn import_pages(app: &AppHandle, start: &str, crawl: bool) -> Result<SavedLibrary, String> {
    let first = Url::parse(start).map_err(|_| "That is not a valid URL.".to_string())?;
    if first.scheme() != "http" && first.scheme() != "https" {
        return Err("Use an http or https URL.".to_string());
    }
    let prefix = first.path().rsplit_once('/').map(|(dir, _)| format!("{dir}/")).unwrap_or_else(|| "/".to_string());
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(12))
        .build()
        .map_err(|error| error.to_string())?;
    let mut seen = Vec::new();
    let mut queue = vec![first.to_string()];
    let mut articles = Vec::new();
    let limit = if crawl { 30 } else { 1 };
    let _ = app.emit(
        "doc-progress",
        serde_json::json!({ "title": "Starting", "done": 0, "total": 1 }),
    );
    let hrefs = Regex::new(r#"(?i)href=["']([^"'#]+)["']"#).map_err(|error| error.to_string())?;
    while let Some(current) = queue.pop() {
        if articles.len() >= limit || seen.iter().any(|item| item == &current) {
            continue;
        }
        seen.push(current.clone());
        let html = match fetch_text(&client, &current) {
            Ok(html) => html,
            Err(error) if articles.is_empty() => return Err(error),
            Err(_) => continue,
        };
        if crawl {
            for caps in hrefs.captures_iter(&html) {
                if let Ok(next) = Url::parse(&caps[1]).or_else(|_| first.join(&caps[1])) {
                    if next.origin() == first.origin() && next.path().starts_with(prefix.trim_end_matches('/')) {
                        let text = next.to_string();
                        if !seen.iter().any(|item| item == &text) {
                            queue.push(text);
                        }
                    }
                }
            }
        }
        articles.push(html_to_article(&current, &html));
        let total = if crawl {
            (articles.len() + queue.len()).clamp(1, limit)
        } else {
            1
        };
        let _ = app.emit(
            "doc-progress",
            serde_json::json!({
                "title": articles.last().map(|article| article.title.clone()).unwrap_or_default(),
                "done": articles.len(),
                "total": total
            }),
        );
    }
    if articles.is_empty() {
        return Err("No readable pages were saved.".to_string());
    }
    let id = first.host_str().unwrap_or("library").to_lowercase().replace('.', "-");
    Ok(SavedLibrary {
        id,
        name: first.host_str().unwrap_or("Library").to_string(),
        source_url: first.to_string(),
        articles,
        hints: Vec::new(),
        modules: Vec::new(),
        simplified_at: None,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PracticeRun {
    language: String,
    source: String,
}

#[tauri::command]
fn run_practice(input: PracticeRun) -> Result<String, String> {
    if input.language != "python" {
        return Err("This example is read in the editor. Python examples can run.".to_string());
    }
    if input.source.len() > 20_000 {
        return Err("The example is too long to run from here.".to_string());
    }
    let path = std::env::temp_dir().join(format!(
        "gladian-practice-{}.py",
        std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|value| value.as_millis()).unwrap_or(0)
    ));
    fs::write(&path, &input.source).map_err(|error| error.to_string())?;
    let result = run_python_file(&path);
    let _ = fs::remove_file(&path);
    result
}

fn run_python_file(path: &std::path::Path) -> Result<String, String> {
    let attempts: [(&str, &[&str]); 2] = [("py", &["-3"]), ("python", &[])];
    for (program, prefix) in attempts {
        let mut command = Command::new(program);
        command.args(prefix).arg(path);
        let mut child = match command.stdout(std::process::Stdio::piped()).stderr(std::process::Stdio::piped()).spawn() {
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => return Err(error.to_string()),
            Ok(child) => child,
        };
        let started = std::time::Instant::now();
        loop {
            if started.elapsed() > Duration::from_secs(8) {
                let _ = child.kill();
                return Err("The example ran longer than 8 seconds, so it was stopped.".to_string());
            }
            match child.try_wait() {
                Ok(Some(status)) => {
                    let mut output = String::new();
                    if let Some(mut stdout) = child.stdout.take() {
                        let _ = std::io::Read::read_to_string(&mut stdout, &mut output);
                    }
                    if let Some(mut stderr) = child.stderr.take() {
                        let _ = std::io::Read::read_to_string(&mut stderr, &mut output);
                    }
                    if output.len() > 8_000 {
                        output.truncate(8_000);
                    }
                    if status.success() {
                        return Ok(if output.trim().is_empty() { "The example finished.".to_string() } else { output });
                    }
                    return Err(if output.trim().is_empty() { format!("Python exited with {status}") } else { output });
                }
                Ok(None) => std::thread::sleep(Duration::from_millis(40)),
                Err(error) => return Err(error.to_string()),
            }
        }
    }
    Err("Python was not found. You can still read and edit the example.".to_string())
}

#[tauri::command]
fn set_api_key(app: AppHandle, key: String) -> Result<(), String> {
    coach::set_api_key(&app, &key)
}

#[tauri::command]
fn clear_api_key(app: AppHandle) -> Result<(), String> {
    coach::clear_api_key(&app)
}

#[tauri::command]
fn has_api_key(app: AppHandle) -> Result<bool, String> {
    coach::has_api_key(&app)
}

#[tauri::command]
fn list_projects(app: AppHandle) -> Result<Vec<coach::StudyProject>, String> {
    coach::list_projects(&app)
}

#[tauri::command]
fn save_projects(app: AppHandle, projects: Vec<coach::StudyProject>) -> Result<(), String> {
    coach::save_projects(&app, &projects)
}

#[tauri::command]
fn draft_plan(app: AppHandle, input: coach::DraftInput) -> Result<Vec<coach::PlanStep>, String> {
    coach::draft_plan(&app, &input)
}

#[tauri::command]
fn review_reading(app: AppHandle, input: coach::ReviewInput) -> Result<coach::ReadingNote, String> {
    coach::review_reading(&app, &input)
}

#[tauri::command]
fn scan_project() -> Result<scan::ScanReport, String> {
    scan::pick_and_scan()
}

#[tauri::command]
fn install_packages(packages: Vec<String>) -> Result<String, String> {
    if packages.is_empty() || packages.len() > 4 {
        return Err("Choose one library from the guide.".to_string());
    }
    if packages.iter().any(|package| !valid_package(package)) {
        return Err("That package name cannot be installed from Gladian.".to_string());
    }
    run_pip(&packages)
}

#[tauri::command]
fn list_imports(app: AppHandle) -> Result<Vec<SavedLibrary>, String> {
    let dir = libraries_dir(&app)?;
    let mut libraries = Vec::new();
    for entry in fs::read_dir(&dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("json") {
            continue;
        }
        let text = fs::read_to_string(&path).map_err(|error| error.to_string())?;
        if let Ok(library) = serde_json::from_str::<SavedLibrary>(&text) {
            libraries.push(library);
        }
    }
    libraries.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(libraries)
}

#[tauri::command]
fn import_url(app: AppHandle, url: String, crawl: bool) -> Result<SavedLibrary, String> {
    let library = import_pages(&app, url.trim(), crawl)?;
    let path = libraries_dir(&app)?.join(format!("{}.json", library.id));
    fs::write(&path, serde_json::to_string_pretty(&library).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())?;
    Ok(library)
}

#[tauri::command]
fn simplify_library(app: AppHandle, library_id: String) -> Result<SavedLibrary, String> {
    let dir = libraries_dir(&app)?;
    let path = dir.join(format!("{library_id}.json"));
    if !path.exists() {
        return Err(format!("Library '{library_id}' was not found on this computer."));
    }
    let text = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let mut library: SavedLibrary = serde_json::from_str(&text).map_err(|error| error.to_string())?;
    if library.articles.is_empty() {
        return Err("This library has no pages to simplify.".to_string());
    }
    // Build the raw text for Claude - cap at 14000 chars to stay under token limits
    let mut raw = String::new();
    for article in library.articles.iter().take(20) {
        raw.push_str(&format!("## {}\n{}\n\n", article.title, article.body));
        if raw.len() > 14_000 {
            break;
        }
    }
    let raw = raw.chars().take(14_000).collect::<String>();
    let prompt = format!(
        "You convert raw documentation text into structured learning modules.\nReturn ONLY valid JSON - no markdown fences, no commentary, just the JSON array.\nShape: [{{\"id\":\"module-id\",\"title\":\"Module Title\",\"sections\":[{{\"id\":\"section-id\",\"title\":\"Section Title\",\"body\":\"Explanation with real code examples. Use \\\\n for newlines inside strings.\",\"tryIt\":\"One concrete hands-on exercise.\"}}]}}]\n\nRules:\n- Extract REAL code examples from the source text and embed them in body\n- Use \\\\n (not actual newlines) inside JSON string values\n- Each section teaches ONE concept with a real code snippet if present\n- tryIt must be a concrete hands-on task\n- Maximum 6 modules, maximum 4 sections each\n- Code examples must be actual runnable code, not pseudocode\n- Keep body under 400 words per section\n- Do not invent APIs that do not appear in the source\n- Library name: {}\n- Source URL: {}\n\nRaw documentation text:\n{}",
        library.name,
        library.source_url,
        raw
    );
    let reply = coach::ask_model(&app, &prompt)?;
    let value = coach::parse_json(&reply)?;
    let arr = value
        .as_array()
        .ok_or_else(|| "The reply was not a JSON array.".to_string())?;
    let mut modules: Vec<DocModule> = Vec::new();
    for item in arr.iter().take(6) {
        let id = item.get("id").and_then(|v| v.as_str()).unwrap_or("module").to_string();
        let title = item.get("title").and_then(|v| v.as_str()).unwrap_or("Module").to_string();
        let sections_raw = item.get("sections").and_then(|v| v.as_array());
        let mut sections: Vec<DocSection> = Vec::new();
        if let Some(sects) = sections_raw {
            for sect in sects.iter().take(4) {
                let sid = sect.get("id").and_then(|v| v.as_str()).unwrap_or("section").to_string();
                let stitle = sect.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let body = sect.get("body").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let try_it = sect.get("tryIt").and_then(|v| v.as_str()).unwrap_or("").to_string();
                if !stitle.is_empty() {
                    sections.push(DocSection { id: sid, title: stitle, body, try_it });
                }
            }
        }
        if !title.is_empty() && !sections.is_empty() {
            modules.push(DocModule { id, title, sections });
        }
    }
    if modules.is_empty() {
        return Err("The simplification produced no modules. Try again or check the API key.".to_string());
    }
    library.modules = modules;
    library.simplified_at = Some(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs().to_string())
            .unwrap_or_else(|_| "0".to_string()),
    );
    fs::write(&path, serde_json::to_string_pretty(&library).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    Ok(library)
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            install_packages,
            list_imports,
            import_url,
            scan_project,
            run_practice,
            set_api_key,
            clear_api_key,
            has_api_key,
            list_projects,
            save_projects,
            draft_plan,
            review_reading,
            simplify_library
        ])
        .run(tauri::generate_context!())
        .expect("error while running Gladian");
}
