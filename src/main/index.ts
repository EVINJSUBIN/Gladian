import { app, BrowserWindow, ipcMain, safeStorage } from 'electron'
import { spawn } from 'child_process'
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'fs/promises'
import { join, normalize, sep } from 'path'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-3-5-sonnet-20241022'
const MONACO_LANGS = new Set([
  'javascript',
  'typescript',
  'html',
  'css',
  'python',
  'json',
  'markdown',
  'go',
  'rust',
  'java',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'sql',
  'xml',
  'yaml',
  'shell',
  'plaintext'
])

type Article = { id: string; title: string; body: string; tryIt: string }
type Hint = { id: string; includes: string; suggestion: string; articleId: string }
type Step = { id: string; title: string; body: string; docId?: string; file: string; contains: string[]; probe?: string }
type DraftPack = {
  name: string
  monacoLanguage: string
  articles: Article[]
  hints: Hint[]
  files: { path: string; contents: string }[]
  steps: Step[]
}

function packsRoot() {
  return join(process.cwd(), 'packs')
}

function projectsRoot() {
  return join(app.getPath('documents'), 'Gladian')
}

function userRoot() {
  return app.getPath('userData')
}

function inside(root: string, target: string) {
  const base = normalize(root + sep)
  const resolved = normalize(target)
  return resolved === normalize(root) || resolved.startsWith(base)
}

async function ensureBundledProjects() {
  const catalog = JSON.parse(await readFile(join(packsRoot(), 'catalog.json'), 'utf8')) as { id: string; name: string }[]
  await mkdir(projectsRoot(), { recursive: true })
  for (const project of catalog) {
    const dest = join(projectsRoot(), project.id)
    let ready = false
    try {
      const entries = await readdir(dest)
      ready = entries.length > 0
    } catch {
      ready = false
    }
    if (!ready) {
      try {
        await cp(join(packsRoot(), 'projects', project.id), dest, { recursive: true })
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        const entries = await readdir(dest).catch(() => [])
        if (code !== 'EEXIST' || entries.length === 0) throw error
      }
    }
  }
  return catalog
}

async function readTree(root: string, dir = root): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (!inside(root, full)) continue
    if (entry.isDirectory()) {
      Object.assign(files, await readTree(root, full))
    } else if (entry.isFile()) {
      const info = await stat(full)
      if (info.size > 200_000) continue
      const rel = full.slice(root.length + 1).split(sep).join('/')
      files[rel] = await readFile(full, 'utf8')
    }
  }
  return files
}

async function readLibraries() {
  const dir = join(userRoot(), 'libraries')
  await mkdir(dir, { recursive: true })
  const names = await readdir(dir)
  const libraries = []
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    try {
      libraries.push(JSON.parse(await readFile(join(dir, name), 'utf8')))
    } catch {
      /* skip a broken pack */
    }
  }
  return libraries
}

async function readProgress() {
  try {
    return JSON.parse(await readFile(join(userRoot(), 'progress.json'), 'utf8'))
  } catch {
    return { xp: 0, articlesOpened: [], stepsDone: [], projectsDone: [], fixedIssues: [] }
  }
}

function keyPath() {
  return join(userRoot(), 'secret.bin')
}

async function readKey() {
  try {
    const encrypted = await readFile(keyPath())
    if (!safeStorage.isEncryptionAvailable()) return ''
    return safeStorage.decryptString(encrypted)
  } catch {
    return ''
  }
}

function htmlToArticle(url: string, html: string): Article {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || url
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)
  const id = url.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'page'
  return {
    id,
    title,
    body: body || 'This page had no readable text.',
    tryIt: 'Read one idea from this page and try a small version of it in your own file.'
  }
}

async function fetchPage(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: 'follow' })
  if (!response.ok) throw new Error(`Could not download ${url} (${response.status}).`)
  const type = response.headers.get('content-type') ?? ''
  if (type && !/html|text|json|xml/i.test(type)) throw new Error('That URL is not a text document.')
  return response.text()
}

async function importUrl(start: string, crawl: boolean) {
  const first = new URL(start)
  if (first.protocol !== 'http:' && first.protocol !== 'https:') throw new Error('Use an http or https URL.')
  const prefix = first.pathname.endsWith('/') ? first.pathname : first.pathname.replace(/[^/]*$/, '')
  const seen = new Set<string>()
  const queue = [first.toString()]
  const articles: Article[] = []
  while (queue.length && articles.length < (crawl ? 30 : 1)) {
    const current = queue.shift()!
    if (seen.has(current)) continue
    seen.add(current)
    let html = ''
    try {
      html = await fetchPage(current)
    } catch (error) {
      if (articles.length === 0) throw error
      continue
    }
    articles.push(htmlToArticle(current, html))
    if (!crawl) break
    for (const match of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
      try {
        const next = new URL(match[1], current)
        if (next.origin !== first.origin) continue
        if (!next.pathname.startsWith(prefix)) continue
        if (!seen.has(next.toString())) queue.push(next.toString())
      } catch {
        /* ignore bad links */
      }
    }
  }
  const id = first.hostname.replace(/[^a-z0-9]+/gi, '-')
  return { id, name: first.hostname, sourceUrl: first.toString(), articles, hints: [], monacoLanguage: 'plaintext' }
}

function stripFence(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return (fenced?.[1] ?? text).trim()
}

function asArticles(value: unknown): Article[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 40).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const id = String(row.id ?? '').replace(/[^a-z0-9-]+/gi, '-').slice(0, 60)
    const title = String(row.title ?? '').slice(0, 120)
    const body = String(row.body ?? '').slice(0, 4000)
    if (!id || !title || !body) return []
    return [{ id, title, body, tryIt: String(row.tryIt ?? 'Try a small version of this yourself.').slice(0, 400) }]
  })
}

function parseDraft(text: string): DraftPack {
  const data = JSON.parse(stripFence(text)) as Record<string, unknown>
  const name = String(data.name ?? '').trim().slice(0, 60)
  if (!name) throw new Error('The draft had no name.')
  const requested = String(data.monacoLanguage ?? 'plaintext')
  const files = Array.isArray(data.files)
    ? data.files.slice(0, 12).flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const row = item as Record<string, unknown>
        const path = String(row.path ?? '').replace(/\\/g, '/')
        if (!path || path.includes('..') || path.startsWith('/')) return []
        return [{ path, contents: String(row.contents ?? '').slice(0, 20_000) }]
      })
    : []
  const steps = Array.isArray(data.steps)
    ? data.steps.slice(0, 12).flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const row = item as Record<string, unknown>
        const file = String(row.file ?? '')
        if (!file || file.includes('..')) return []
        const contains = Array.isArray(row.contains) ? row.contains.map((part) => String(part).slice(0, 80)).slice(0, 6) : []
        return [
          {
            id: String(row.id ?? 'step').replace(/[^a-z0-9-]+/gi, '-').slice(0, 40),
            title: String(row.title ?? 'Next step').slice(0, 80),
            body: String(row.body ?? '').slice(0, 600),
            file,
            contains
          }
        ]
      })
    : []
  const hints = Array.isArray(data.hints)
    ? data.hints.slice(0, 20).flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const row = item as Record<string, unknown>
        const includes = String(row.includes ?? '').slice(0, 80)
        if (!includes) return []
        return [
          {
            id: String(row.id ?? includes).replace(/[^a-z0-9-]+/gi, '-').slice(0, 40),
            includes,
            suggestion: String(row.suggestion ?? '').slice(0, 300),
            articleId: String(row.articleId ?? '')
          }
        ]
      })
    : []
  return {
    name,
    monacoLanguage: MONACO_LANGS.has(requested) ? requested : 'plaintext',
    articles: asArticles(data.articles),
    hints,
    files,
    steps
  }
}

async function askModel(prompt: string) {
  const apiKey = await readKey()
  if (!apiKey) throw new Error('Add an API key first. The offline docs still work without one.')
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  })
  const text = message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim()
  if (!text) throw new Error('The model returned an empty reply.')
  return text
}

const PACK_PROMPT = `You draft offline learning packs for a coding coach. The learner writes every line of the lesson. Return only JSON with this shape:
{"name":"","monacoLanguage":"plaintext","articles":[{"id":"","title":"","body":"","tryIt":""}],"hints":[{"id":"","includes":"","suggestion":"","articleId":""}],"files":[{"path":"","contents":""}],"steps":[{"id":"","title":"","body":"","file":"","contains":[""]}]}
Rules: articles teach one idea each and include a tiny example that is not the finished project. Starter files contain TODOs where the learner must write the logic. Do not fill in the lesson solution. hints.includes is a short mistake pattern, max 80 characters. monacoLanguage must be a Monaco built-in id or plaintext. Keep the pack small.`

function createWindow() {
  const preload = join(__dirname, '../preload/index.js')
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#1a1814',
    title: 'Gladian',
    autoHideMenuBar: true,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  win.webContents.on('preload-error', (_event, path, error) => {
    console.error('preload-error', path, error)
  })
  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else win.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  let bootstrapTask: Promise<unknown> | null = null
  ipcMain.handle('bootstrap', () => {
    if (!bootstrapTask) {
      bootstrapTask = (async () => {
    const catalog = await ensureBundledProjects()
    const projects = []
    for (const item of catalog) {
      projects.push({ id: item.id, name: item.name, files: await readTree(join(projectsRoot(), item.id)) })
    }
    const extra = await readdir(projectsRoot())
    for (const id of extra) {
      if (catalog.some((item) => item.id === id)) continue
      const full = join(projectsRoot(), id)
      const info = await stat(full)
      if (!info.isDirectory()) continue
      projects.push({ id, name: id, files: await readTree(full) })
    }
    return {
      projects,
      libraries: await readLibraries(),
      progress: await readProgress(),
      hasKey: Boolean(await readKey()),
      online: true
    }
      })().finally(() => {
        bootstrapTask = null
      })
    }
    return bootstrapTask
  })

  ipcMain.handle('write-file', async (_event, projectId: string, filePath: string, content: string) => {
    if (typeof projectId !== 'string' || typeof filePath !== 'string' || typeof content !== 'string') throw new Error('Bad save.')
    if (filePath.includes('..') || content.length > 1_000_000) throw new Error('That file cannot be saved.')
    const root = join(projectsRoot(), projectId)
    const target = join(root, ...filePath.split('/'))
    if (!inside(root, target)) throw new Error('That path is outside the project.')
    await mkdir(join(target, '..'), { recursive: true })
    await writeFile(target, content, 'utf8')
  })

  ipcMain.handle('set-progress', async (_event, progress: unknown) => {
    await writeFile(join(userRoot(), 'progress.json'), JSON.stringify(progress), 'utf8')
  })

  ipcMain.handle('import-url', async (_event, url: string, crawl: boolean) => {
    const library = await importUrl(url, Boolean(crawl))
    const dir = join(userRoot(), 'libraries')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, `${library.id}.json`), JSON.stringify(library), 'utf8')
    return library
  })

  ipcMain.handle('save-pack', async (_event, pack: DraftPack & { id?: string; sourceUrl?: string }) => {
    const id = String(pack.id || pack.name || 'pack')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
    if (!id) throw new Error('The pack needs a name.')
    const library = {
      id,
      name: pack.name,
      sourceUrl: pack.sourceUrl ?? '',
      monacoLanguage: pack.monacoLanguage,
      articles: pack.articles ?? [],
      hints: pack.hints ?? []
    }
    const dir = join(userRoot(), 'libraries')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, `${id}.json`), JSON.stringify(library), 'utf8')
    let project: { id: string; name: string; files: Record<string, string> } | null = null
    if (pack.files?.length) {
      const root = join(projectsRoot(), id)
      await mkdir(root, { recursive: true })
      const files: Record<string, string> = {}
      for (const file of pack.files) {
        if (file.path.includes('..')) continue
        const target = join(root, ...file.path.split('/'))
        if (!inside(root, target)) continue
        await mkdir(join(target, '..'), { recursive: true })
        await writeFile(target, file.contents, 'utf8')
        files[file.path] = file.contents
      }
      if (pack.steps?.length) {
        const guide = JSON.stringify({ steps: pack.steps }, null, 2)
        const guidePath = join(root, '.gladian', 'guide.json')
        await mkdir(join(root, '.gladian'), { recursive: true })
        await writeFile(guidePath, guide, 'utf8')
        files['.gladian/guide.json'] = guide
      }
      project = { id, name: pack.name, files }
    }
    return { library, project }
  })

  ipcMain.handle('set-key', async (_event, key: string) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('This computer cannot store the key securely.')
    await writeFile(keyPath(), safeStorage.encryptString(key.trim()))
  })

  ipcMain.handle('clear-key', async () => {
    await rm(keyPath(), { force: true })
  })

  ipcMain.handle('draft-pack', async (_event, input: { kind: string; name?: string; url?: string; pageText?: string }) => {
    const prompt = `${PACK_PROMPT}\nJob: ${input.kind}\nName: ${input.name ?? ''}\nURL: ${input.url ?? ''}\nSource text:\n${(input.pageText ?? '').slice(0, 6000)}`
    return parseDraft(await askModel(prompt))
  })

  ipcMain.handle('explain', async (_event, input: { code: string; file: string }) => {
    const prompt = `Explain this learner's ${input.file} selection in JSON only: {"encouragement":"","meaning":"","tryNext":""}. Do not write a replacement snippet. Keep each field under 80 words. Code:\n${input.code.slice(0, 4000)}`
    const data = JSON.parse(stripFence(await askModel(prompt))) as Record<string, unknown>
    return {
      encouragement: String(data.encouragement ?? 'You are looking at the right place.'),
      meaning: String(data.meaning ?? ''),
      tryNext: String(data.tryNext ?? 'Change one small thing and run it again.')
    }
  })

  ipcMain.handle('run-command', async (_event, projectId: string, command: string) => {
    const cwd = join(projectsRoot(), projectId)
    if (!inside(projectsRoot(), cwd)) throw new Error('Bad project.')
    return await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const isWin = process.platform === 'win32'
      const shell = isWin ? 'powershell.exe' : (process.env.SHELL || '/bin/sh')
      const args = isWin ? ['-NoProfile', '-Command', String(command).slice(0, 500)] : ['-c', String(command).slice(0, 500)]
      const child = spawn(shell, args, {
        cwd,
        windowsHide: true
      })
      let stdout = ''
      let stderr = ''
      const timer = setTimeout(() => child.kill(), 15000)
      child.stdout.on('data', (chunk) => {
        stdout = (stdout + chunk.toString()).slice(0, 20_000)
      })
      child.stderr.on('data', (chunk) => {
        stderr = (stderr + chunk.toString()).slice(0, 20_000)
      })
      child.on('close', (code) => {
        clearTimeout(timer)
        resolve({ stdout, stderr, code: code ?? 1 })
      })
    })
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
