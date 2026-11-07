use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

const SKIP_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "target",
    "venv",
    ".venv",
    "__pycache__",
    "out",
    ".next",
    ".agents",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannedFile {
    pub path: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanFinding {
    pub path: String,
    pub line: u32,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanReport {
    pub folder: String,
    pub checked: u32,
    pub skipped: u32,
    pub files: Vec<ScannedFile>,
    pub findings: Vec<ScanFinding>,
    pub note: String,
}

pub fn pick_and_scan() -> Result<ScanReport, String> {
    let Some(folder) = rfd::FileDialog::new()
        .set_title("Open a project folder")
        .pick_folder()
    else {
        return Err("cancelled".to_string());
    };
    scan_folder(&folder)
}

pub fn scan_folder(folder: &Path) -> Result<ScanReport, String> {
    if !folder.is_dir() {
        return Err("That path is not a folder.".to_string());
    }
    let mut paths = Vec::new();
    let mut skipped = 0;
    walk(folder, &mut paths, &mut skipped, 0);
    let mut files = Vec::new();
    let mut findings = Vec::new();
    let mut note = String::new();
    let mut python_missing = false;
    for path in &paths {
        let relative = path
            .strip_prefix(folder)
            .unwrap_or(path)
            .to_string_lossy()
            .replace('\\', "/");
        let ext = path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        if ext == "py" {
            if python_missing {
                continue;
            }
            match compile_python(path) {
                Err(_) => {
                    python_missing = true;
                    note = "Python was not found, so .py files were listed and not syntax-checked.".to_string();
                }
                Ok(None) => {}
                Ok(Some((line, message))) => findings.push(ScanFinding {
                    path: relative.clone(),
                    line,
                    message,
                }),
            }
            if let Ok(text) = fs::read_to_string(path) {
                if text.len() <= 100_000 {
                    files.push(ScannedFile { path: relative, text });
                }
            }
            continue;
        }
        let text = match fs::read(path) {
            Ok(bytes) if bytes.len() <= 100_000 => String::from_utf8(bytes).unwrap_or_default(),
            _ => {
                skipped += 1;
                continue;
            }
        };
        if text.is_empty() {
            continue;
        }
        files.push(ScannedFile { path: relative, text });
    }
    Ok(ScanReport {
        folder: folder.display().to_string(),
        checked: paths.len() as u32,
        skipped,
        files,
        findings,
        note,
    })
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>, skipped: &mut u32, depth: u32) {
    if depth > 8 || out.len() >= 80 {
        return;
    }
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        if out.len() >= 80 {
            *skipped += 1;
            return;
        }
        let path = entry.path();
        if path
            .symlink_metadata()
            .map(|meta| meta.file_type().is_symlink())
            .unwrap_or(true)
        {
            continue;
        }
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if path.is_dir() {
            if SKIP_DIRS.contains(&name.as_ref()) {
                *skipped += 1;
                continue;
            }
            walk(&path, out, skipped, depth + 1);
            continue;
        }
        if is_source(&path) {
            out.push(path);
        }
    }
}

fn is_source(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|value| value.to_str()).unwrap_or("").to_ascii_lowercase().as_str(),
        "py" | "js" | "mjs" | "cjs" | "html" | "htm"
    )
}

fn compile_python(path: &Path) -> Result<Option<(u32, String)>, String> {
    let attempts: [(&str, &[&str]); 2] = [("py", &["-3", "-m", "py_compile"]), ("python", &["-m", "py_compile"])];
    for (program, prefix) in attempts {
        match Command::new(program).args(prefix).arg(path).output() {
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => return Err(error.to_string()),
            Ok(output) => {
                if output.status.success() {
                    return Ok(None);
                }
                let text = format!(
                    "{}{}",
                    String::from_utf8_lossy(&output.stdout),
                    String::from_utf8_lossy(&output.stderr)
                );
                let line = Regex::new(r"line (\d+)")
                    .ok()
                    .and_then(|pattern| pattern.captures(&text))
                    .and_then(|caps| caps[1].parse().ok())
                    .unwrap_or(1);
                let message = text
                    .lines()
                    .rev()
                    .find(|line| !line.trim().is_empty() && !line.trim().starts_with('^'))
                    .unwrap_or("This Python file does not parse.")
                    .trim()
                    .chars()
                    .take(240)
                    .collect::<String>();
                return Ok(Some((line, message)));
            }
        }
    }
    Err("Python was not found.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn scan_reads_script_and_skips_dependencies() {
        let stamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        let root = std::env::temp_dir().join(format!("gladian-scan-{stamp}"));
        fs::create_dir_all(root.join("node_modules")).unwrap();
        fs::write(root.join("app.js"), "function hi() { return 1 }\n").unwrap();
        fs::write(root.join("node_modules").join("skip.js"), "nope(").unwrap();
        fs::write(root.join("broken.py"), "def\n").unwrap();
        let report = scan_folder(&root).unwrap();
        assert!(report.files.iter().any(|file| file.path == "app.js"));
        assert!(report.files.iter().all(|file| !file.path.contains("node_modules")));
        if report.note.is_empty() {
            assert!(report.findings.iter().any(|finding| finding.path == "broken.py" && finding.line >= 1));
        }
        let _ = fs::remove_dir_all(root);
    }
}
