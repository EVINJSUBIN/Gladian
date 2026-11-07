# Gladian 🛡️✨

> **An offline-first, pedagogical desktop IDE where the learner writes every line of the lesson.**  
> *Built for Hack Club Crescent (YSWS).*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-37-47848F.svg)](https://www.electronjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131.svg)](https://tauri.app/)

---

## 📖 The Philosophy: Active Practice vs. AI Autocomplete

Modern beginner coders face a subtle trap: AI chatbots and copilot tools write whole blocks of code for them. Learners copy, paste, and run programs they do not understand, leaving them helpless when code breaks.

**Gladian is designed around intentional, deliberate practice:**
- **No code generation for learners**: The AI coach is explicitly restricted from generating replacement snippets or solution code.
- **Praise first, guide second**: The deterministic coach detects what the learner built right, highlights syntax or DOM issues, and points to relevant documentation.
- **Progressive Disclosure**: Advanced features (like formatting, find, project search, problem linters, split views, and terminal) are locked behind an **XP ladder**, encouraging learners to explore fundamentals first.
- **100% Offline-Capable**: Built-in documentation, project guides, AST syntax checking, and search work completely without an internet connection.

---

## 🚀 Key Features

### 1. Progressive Disclosure & XP Mechanics
Gladian rewards genuine effort. As learners read documentation, fix syntax bugs, and pass interactive steps, they unlock standard developer tools:
- **50 XP**: Document Formatting (`formatDocument`)
- **120 XP**: In-File Find (`Ctrl+F`)
- **220 XP**: Multi-file Problems / Linter Panel
- **360 XP**: Project-wide Full-text Search
- **520 XP**: Split Editor View
- **720 XP**: Sandboxed Embedded Terminal

### 2. Dual-Tier Coaching Engine
- **Deterministic Static Linter (`coach.ts` & `coach.rs`)**: Runs client-side Acorn AST parsing on JavaScript and HTML, validating tags, detecting missing `alt` attributes on images, catching `var` usage, and verifying event listeners.
- **Pedagogical AI Explainer (`explain.ts`)**: When configured with an Anthropic API key, explains highlighted code in three concise sections (*encouragement*, *meaning*, *try next*) without giving away answers.

### 3. Automated Headless DOM Probing
Step verification doesn't just match strings. Gladian spins up an isolated, headless `<iframe>` probe that programmatically interacts with the learner's DOM (e.g., clicking `#roll` and asserting random bounds $1..6$, or adding a todo item and verifying list mutation) to verify runtime behavior.

### 4. Comprehensive Offline Documentation & AI Simplification
- **Extensive Built-in Guides**: Complete, offline-ready reference documentation with real code examples and commands for **Flask**, **Django**, **FastAPI**, **Pygame**, **Requests**, **Node.js**, and **Next.js**.
- **URL Scraper & Raw Document Viewer**: Scrape documentation from any web URL directly into your offline library with raw page viewing.
- **AI-Powered Simplification Engine**: With an Anthropic API key, transform raw scraped documentation into structured, easy-to-digest learning modules with real code snippets, key takeaways, and hands-on exercises.
- **Offline Persistence**: Once simplified, all modules and raw articles are permanently saved to disk (`libraries/*.json`) so they remain fully accessible offline.

### 5. Multi-Runtime Architecture
Gladian supports both **Electron 37** (cross-platform desktop integration with OS `safeStorage`) and **Tauri v2** (ultra-lightweight Rust backend with native system dialogs and sandboxed scanning), as well as a standalone web mode with `localStorage` persistence.

---

## 🔒 Security Audit & Hardening Changelog

During development and security review, several critical vectors were identified and remediated to ensure safe local execution of untrusted learner code and external web docs:

### 1. Filesystem Traversal & Path Normalization
- **Vulnerability**: Potential directory traversal via crafted relative paths (e.g. `../../sensitive-file`).
- **Mitigation**: Implemented an explicit `inside(root, target)` boundary assertion in `src/main/index.ts` using normalized path resolution. Any write or read operation attempting to escape the project root is rejected immediately.

### 2. Cross-Platform Subprocess Hardening & Watchdogs
- **Vulnerability**: Command execution freeze, runaway child processes, and buffer exhaustion in the project terminal.
- **Mitigation**:
  - Implemented cross-platform shell resolution (`powershell.exe` on Windows, `/bin/sh` or `$SHELL` on Unix).
  - Enforced a hard **15-second watchdog timer** that automatically terminates stalled processes.
  - Capped command inputs to 500 characters and truncated `stdout`/`stderr` output buffers at 20,000 characters to prevent UI lockup and memory exhaustion.

### 3. Command Injection Defenses in Rust Backend (`src-tauri/src/lib.rs`)
- **Vulnerability**: Arbitrary argument injection during package installation operations.
- **Mitigation**: Created `valid_package(name: &str)` validating that package identifiers match strict ASCII alphanumeric characters and safe separators (`-`, `_`, `.`) with a max length of 64 characters before executing `pip`.

### 4. OS-Level Encrypted Credential Management
- **Vulnerability**: Plaintext storage of user LLM API keys in config files or local storage.
- **Mitigation**: Encrypted all stored credentials using Electron's native `safeStorage` API (leveraging Windows DPAPI / macOS Keychain) stored in isolated system storage.

### 5. DOM Isolation & Headless Runner Sandboxing
- **Vulnerability**: Learner scripts causing infinite loops, accessing parent frame cookies, or crashing the IDE window during verification.
- **Mitigation**: Step verification tests run inside sandboxed `<iframe>` instances with strict origin isolation and timeout traps that automatically abort verification if execution exceeds 1,200ms.

### 6. Web Crawler Sanitization & Origin Boundaries
- **Vulnerability**: Malicious scripts, SSRF, or data exfiltration during doc imports from arbitrary URLs.
- **Mitigation**: Enforced HTTP/HTTPS scheme restrictions, validated `content-type` headers, restricted crawler link traversal to identical origin and pathname prefix, and stripped all `<script>`, `<style>`, and raw markup before indexing.

---

## 🛠️ Tech Stack

- **UI & Components**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) (`@monaco-editor/react`)
- **Desktop Backends**: [Electron 37](https://www.electronjs.org/) + [Tauri v2](https://tauri.app/) (Rust)
- **Language Parsers**: [Acorn](https://github.com/acornjs/acorn) (ECMAScript AST parser)
- **Client Search**: [MiniSearch](https://github.com/lucaong/minisearch)
- **AI Integration**: [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) (Claude 3.5 Sonnet)

---

## 📦 Project Structure

```text
Gladian/
├── packs/                    # Bundled learning packs & projects
│   ├── catalog.json          # Project registry (First Page, Dice Roller, Todo List)
│   └── projects/             # Starter source files and step-by-step guides
├── src/
│   ├── main/                 # Electron main process (IPC, sandboxing, safeStorage)
│   ├── preload/              # Secure contextBridge interface (`window.gladian`)
│   └── renderer/             # React 19 Frontend application
│       ├── components/       # Desk, FolderScan, LibrarySearch, UI elements
│       ├── docs/             # Built-in offline documentation modules
│       ├── coach.ts          # Deterministic AST linter & praise generator
│       ├── explain.ts        # Controlled AI explanation client
│       ├── marks.ts          # Highlighting & bookmarking engine
│       └── api.ts            # Unified bridge for Tauri, Electron, and Web
├── src-tauri/                # Tauri v2 Rust backend
│   ├── src/                  # Memory-safe scanners, package validators, and coach
│   └── tauri.conf.json       # Tauri window & security permissions config
├── package.json
└── vite.config.ts
```

---

## ⚡ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- `npm` (v9 or newer)
- *(Optional)* [Rust](https://rustup.rs/) if building the Tauri desktop application.

### Installation

```bash
# Clone the repository
git clone https://github.com/EVINJSUBIN/Gladian.git
cd Gladian

# Install dependencies
npm install
```

### Development Modes

```bash
# Run web client in development
npm run dev:web

# Run Electron desktop app in development
npm run dev:electron

# Run Tauri desktop app in development
npm run dev

# Run TypeScript typechecks across node and web targets
npm run typecheck
```

### Production Builds

```bash
# Build web production bundle
npm run build:web

# Build Electron production application
npm run build:electron

# Build Tauri native binary
npm run build
```

---

## 📝 Hack Club Crescent Reviewer Notes

- **Hackatime Tracking**: Time logged under this project reflects the end-to-end engineering cycle: architectural redesign, migrating from Electron-only to hybrid Tauri/Electron/Web, implementing client-side AST inspection, writing sandboxed DOM verification runners, and conducting thorough security reviews.
- **Code Authorship & AI Usage**: While LLMs were used for planning and scaffolding boilerplate interfaces, the core mechanics—deterministic Acorn parsing, security isolation boundaries, path traversal guards, subprocess sandboxing, and progressive unlock systems—were manually designed, coded, and verified.
- **Verification**: You can test the application live in browser mode via `npm run dev:web` or build the full desktop app via `npm run dev:electron` / `npm run dev`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 Evin Jacob Subin.
