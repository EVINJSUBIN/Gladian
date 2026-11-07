import type { Article } from './content'
import type { Hint } from './coach'
import firstHtml from '../../../packs/projects/first-page/index.html?raw'
import firstGuide from '../../../packs/projects/first-page/.gladian/guide.json?raw'
import diceHtml from '../../../packs/projects/dice-roller/index.html?raw'
import diceGuide from '../../../packs/projects/dice-roller/.gladian/guide.json?raw'
import todoHtml from '../../../packs/projects/todo-list/index.html?raw'
import todoGuide from '../../../packs/projects/todo-list/.gladian/guide.json?raw'

export type Project = { id: string; name: string; files: Record<string, string> }
export type Library = {
  id: string
  name: string
  sourceUrl?: string
  monacoLanguage?: string
  articles: Article[]
  hints: Hint[]
}
export type Progress = {
  xp: number
  articlesOpened: string[]
  stepsDone: string[]
  projectsDone: string[]
  fixedIssues: string[]
}
export type Workspace = { projects: Project[]; libraries: Library[]; progress: Progress; hasKey: boolean }
export type DraftPack = {
  name: string
  monacoLanguage: string
  articles: Article[]
  hints: Hint[]
  files: { path: string; contents: string }[]
  steps: { id: string; title: string; body: string; file: string; contains: string[]; probe?: string }[]
}

const emptyProgress = (): Progress => ({
  xp: 0,
  articlesOpened: [],
  stepsDone: [],
  projectsDone: [],
  fixedIssues: []
})

const bundled: Project[] = [
  { id: 'first-page', name: 'First Page', files: { 'index.html': firstHtml, '.gladian/guide.json': firstGuide } },
  { id: 'dice-roller', name: 'Dice Roller', files: { 'index.html': diceHtml, '.gladian/guide.json': diceGuide } },
  { id: 'todo-list', name: 'Todo List', files: { 'index.html': todoHtml, '.gladian/guide.json': todoGuide } }
]

function memory() {
  const raw = localStorage.getItem('gladian-browser')
  if (!raw) return { projects: bundled, libraries: [] as Library[], progress: emptyProgress(), hasKey: false }
  const saved = JSON.parse(raw) as Workspace
  return {
    projects: saved.projects?.length ? saved.projects : bundled,
    libraries: saved.libraries ?? [],
    progress: saved.progress ?? emptyProgress(),
    hasKey: false
  }
}

function remember(workspace: Workspace) {
  localStorage.setItem('gladian-browser', JSON.stringify(workspace))
}

export async function loadWorkspace(): Promise<Workspace> {
  if (window.gladian) return window.gladian.bootstrap()
  return memory()
}

export async function saveFile(projectId: string, filePath: string, content: string) {
  if (window.gladian) return window.gladian.writeFile(projectId, filePath, content)
  const workspace = memory()
  const project = workspace.projects.find((item) => item.id === projectId)
  if (!project) return
  project.files[filePath] = content
  remember(workspace)
}

export async function saveProgress(progress: Progress) {
  if (window.gladian) return window.gladian.setProgress(progress)
  const workspace = memory()
  workspace.progress = progress
  remember(workspace)
}

function inTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function tauri<T>(command: string, args?: Record<string, unknown>) {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, args)
}

export async function importLibrary(url: string, crawl: boolean) {
  if (inTauri()) return tauri<Library>('import_url', { url, crawl })
  if (!window.gladian) throw new Error('Adding a URL needs the Gladian window, because a browser tab blocks most docs sites.')
  return window.gladian.importUrl(url, crawl)
}

export async function listImportedLibraries() {
  if (!inTauri()) return [] as Library[]
  return tauri<Library[]>('list_imports')
}

export async function installPackages(packages: string[]) {
  if (!inTauri()) throw new Error('Install runs in the Gladian window. Open it with npm run dev.')
  return tauri<string>('install_packages', { packages })
}

export type ScanFile = { path: string; text: string }
export type ScanFinding = { path: string; line: number; message: string }
export type ScanReport = {
  folder: string
  checked: number
  skipped: number
  files: ScanFile[]
  findings: ScanFinding[]
  note: string
}

export async function scanProject(): Promise<ScanReport> {
  if (inTauri()) {
    try {
      return await tauri<ScanReport>('scan_project')
    } catch (reason) {
      const message = typeof reason === 'string' ? reason : reason instanceof Error ? reason.message : 'The folder was not scanned.'
      throw new Error(message)
    }
  }
  return scanFromPicker()
}

function scanFromPicker(): Promise<ScanReport> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    ;(input as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = true
    input.addEventListener('change', () => {
      void readPickedFiles(input.files)
        .then(resolve)
        .catch((reason: unknown) => reject(reason instanceof Error ? reason : new Error('The folder was not scanned.')))
    })
    input.click()
  })
}

async function readPickedFiles(list: FileList | null): Promise<ScanReport> {
  const picked = [...(list ?? [])].filter((file) => /\.(py|js|mjs|cjs|html|htm)$/i.test(file.name))
  const usable = picked.filter((file) => !file.webkitRelativePath.split('/').includes('node_modules')).slice(0, 80)
  const files: ScanFile[] = []
  for (const file of usable) {
    if (file.size > 100_000 || file.name.toLowerCase().endsWith('.py')) continue
    files.push({ path: file.webkitRelativePath || file.name, text: await file.text() })
  }
  const folder = usable[0]?.webkitRelativePath.split('/')[0] || 'Selected folder'
  return {
    folder,
    checked: usable.length,
    skipped: Math.max(0, picked.length - usable.length),
    files,
    findings: [],
    note: usable.some((file) => file.name.toLowerCase().endsWith('.py'))
      ? 'Python syntax check runs in the Gladian window. This view checked the JavaScript and HTML it could read.'
      : ''
  }
}

export async function savePack(pack: DraftPack & { id?: string; sourceUrl?: string }) {
  if (!window.gladian) throw new Error('Saving a drafted pack needs the desktop window.')
  return window.gladian.savePack(pack)
}

export async function setKey(key: string) {
  if (!window.gladian) throw new Error('The API key is stored by the desktop app.')
  await window.gladian.setKey(key)
}

export async function clearKey() {
  if (!window.gladian) return
  await window.gladian.clearKey()
}

export async function draftPack(input: { kind: string; name?: string; url?: string; pageText?: string }) {
  if (!window.gladian) throw new Error('Drafting a pack needs the desktop window and an API key.')
  return window.gladian.draftPack(input)
}

export async function explainSelection(code: string, file: string) {
  if (!window.gladian) throw new Error('Explain needs the desktop window and an API key.')
  return window.gladian.explain({ code, file })
}

export async function runCommand(projectId: string, command: string) {
  if (!window.gladian) throw new Error('The terminal runs in the desktop app.')
  return window.gladian.runCommand(projectId, command)
}

export function desktop() {
  return Boolean(window.gladian) || inTauri()
}

export type DocProgress = { title: string; done: number; total: number }
export type PlanStep = { title: string; detail: string; libraryId: string; docId: string }
export type ReadingNote = { matches: string; weakPattern: string; practice: string }
export type StudyProject = {
  id: string
  name: string
  summary: string
  libraryIds: string[]
  steps: PlanStep[]
  note: ReadingNote | null
}

function lift(reason: unknown, fallback: string) {
  if (typeof reason === 'string') return new Error(reason)
  if (reason instanceof Error) return reason
  return new Error(fallback)
}

export async function watchDocProgress(onProgress: (progress: DocProgress) => void) {
  if (!inTauri()) return () => undefined
  const { listen } = await import('@tauri-apps/api/event')
  const unlisten = await listen<DocProgress>('doc-progress', (event) => onProgress(event.payload))
  return unlisten
}

export async function runPractice(language: string, source: string) {
  if (!inTauri()) throw new Error('Running an example needs the Gladian window.')
  try {
    return await tauri<string>('run_practice', { input: { language, source } })
  } catch (reason) {
    throw lift(reason, 'The example did not run.')
  }
}

export async function hasApiKey() {
  if (!inTauri()) return false
  return tauri<boolean>('has_api_key')
}

export async function saveApiKey(key: string) {
  if (!inTauri()) throw new Error('The key is stored by the Gladian window.')
  try {
    await tauri<void>('set_api_key', { key })
  } catch (reason) {
    throw lift(reason, 'The key was not saved.')
  }
}

export async function forgetApiKey() {
  if (!inTauri()) return
  await tauri<void>('clear_api_key')
}

export async function loadProjects() {
  if (!inTauri()) return [] as StudyProject[]
  return tauri<StudyProject[]>('list_projects')
}

export async function storeProjects(projects: StudyProject[]) {
  if (!inTauri()) throw new Error('Projects are saved by the Gladian window.')
  try {
    await tauri<void>('save_projects', { projects })
  } catch (reason) {
    throw lift(reason, 'The project was not saved.')
  }
}

export async function draftPlan(input: { name: string; summary: string; libraryIds: string[]; notes: string }) {
  if (!inTauri()) throw new Error('A plan drafted online needs the Gladian window.')
  try {
    return await tauri<PlanStep[]>('draft_plan', { input })
  } catch (reason) {
    throw lift(reason, 'The plan was not written.')
  }
}

export async function reviewReading(input: { docs: string; files: ScanFile[] }) {
  if (!inTauri()) throw new Error('A reading note needs the Gladian window and a connection.')
  try {
    return await tauri<ReadingNote>('review_reading', { input })
  } catch (reason) {
    throw lift(reason, 'The folder was not read.')
  }
}
