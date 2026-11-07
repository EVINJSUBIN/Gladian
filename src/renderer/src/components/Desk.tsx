import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  BookOpen,
  Bookmark as BookmarkIcon,
  Check,
  Copy,
  ExternalLink,
  FileCode2,
  FolderCode,
  Key,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react'
import { CATALOG, modulesOf, type CatalogLibrary, type DocModule, type StudyPage } from '../catalog'
import { explainError, type ErrorNote } from '../explain'
import { addHighlight, loadMarks, toggleBookmark, type Bookmark, type Highlight } from '../marks'
import {
  draftPlan,
  forgetApiKey,
  hasApiKey,
  importLibrary,
  listImportedLibraries,
  loadProjects,
  reviewReading,
  runPractice,
  saveApiKey,
  scanProject,
  simplifyLibrary,
  storeProjects,
  watchDocProgress,
  type DocProgress,
  type Library,
  type StudyProject
} from '../api'

type Selection =
  | { kind: 'library'; id: string }
  | { kind: 'project'; id: string }

function notesFor(ids: string[]) {
  return CATALOG.filter((library) => ids.includes(library.id))
    .flatMap((library) => library.pages.map((page) => `${library.id} ${page.id} ${page.title}: ${page.body.slice(0, 280)}`))
    .join('\n')
}

function paint(text: string, marks: string[]) {
  let parts: Array<string | { mark: string }> = [text]
  for (const mark of marks) {
    const next: Array<string | { mark: string }> = []
    for (const part of parts) {
      if (typeof part !== 'string' || !part.includes(mark)) {
        next.push(part)
        continue
      }
      const bits = part.split(mark)
      bits.forEach((bit, index) => {
        if (bit) next.push(bit)
        if (index < bits.length - 1) next.push({ mark })
      })
    }
    parts = next
  }
  return parts
}

function docsFor(ids: string[]) {
  return CATALOG.filter((library) => ids.includes(library.id))
    .flatMap((library) => library.pages.map((page) => `# ${library.name} / ${page.title}\n${page.body}`))
    .join('\n\n')
    .slice(0, 8000)
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="doc-code-copy"
      type="button"
      title="Copy code"
      aria-label="Copy code to clipboard"
      onClick={() => {
        void navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function renderFormattedParagraph(text: string, marked: string[]) {
  if (text.includes('`')) {
    const segments = text.split(/(`[^`]+`)/g)
    return segments.map((seg, i) => {
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
        return (
          <code key={i} className="inline-code">
            {seg.slice(1, -1)}
          </code>
        )
      }
      return paint(seg, marked).map((part, index) =>
        typeof part === 'string' ? <span key={index}>{part}</span> : <mark key={index}>{part.mark}</mark>
      )
    })
  }
  return paint(text, marked).map((part, index) =>
    typeof part === 'string' ? <span key={index}>{part}</span> : <mark key={index}>{part.mark}</mark>
  )
}

function DocContent({ body, marked }: { body: string; marked: string[] }) {
  const rendered = useMemo(() => {
    // 1. If body contains triple backtick code blocks
    if (body.includes('```')) {
      const segments = body.split(/(```[\s\S]*?```)/g)
      return segments.filter((seg) => seg.trim()).map((seg, idx) => {
        const trimmed = seg.trim()
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.slice(3, -3).trim().split('\n')
          let lang = 'python'
          let codeLines = lines
          if (lines[0] && /^[a-zA-Z0-9_-]+$/.test(lines[0].trim())) {
            lang = lines[0].trim()
            codeLines = lines.slice(1)
          }
          const code = codeLines.join('\n')
          return (
            <div className="doc-code-block" key={idx}>
              <div className="doc-code-header">
                <span className="doc-code-lang">{lang}</span>
                <CopyButton text={code} />
              </div>
              <pre className="doc-code-pre">
                <code>{code}</code>
              </pre>
            </div>
          )
        }
        return seg.split(/\n\n+/).filter((p) => p.trim()).map((paragraph, pIdx) => (
          <p key={`${idx}-${pIdx}`} className="doc-paragraph">
            {renderFormattedParagraph(paragraph.trim(), marked)}
          </p>
        ))
      })
    }

    // 2. Fallback: split by double newlines & detect unfenced code
    return body.split(/\n\n+/).filter((p) => p.trim()).map((paragraph, pIdx) => {
      const trimmed = paragraph.trim()
      const lines = trimmed.split('\n')
      const isUnfencedCode =
        lines.some((l) =>
          /^(from |import |def |class |@app\.|return |urlpatterns =|pip |python |django-admin |flask |npx |npm |const |let |var |<[a-z]+>)/i.test(l.trim())
        ) && lines.length > 1

      if (isUnfencedCode) {
        const isBash = /^(pip |python |django-admin |flask |npx |npm |cd |source |venv)/i.test(lines[0].trim())
        const lang = isBash ? 'bash' : 'python'
        return (
          <div className="doc-code-block" key={pIdx}>
            <div className="doc-code-header">
              <span className="doc-code-lang">{lang}</span>
              <CopyButton text={trimmed} />
            </div>
            <pre className="doc-code-pre">
              <code>{trimmed}</code>
            </pre>
          </div>
        )
      }

      return (
        <p key={pIdx} className="doc-paragraph">
          {renderFormattedParagraph(trimmed, marked)}
        </p>
      )
    })
  }, [body, marked])

  return <>{rendered}</>
}

export function Desk() {
  const [imported, setImported] = useState<Library[]>([])
  const [projects, setProjects] = useState<StudyProject[]>([])
  const [selection, setSelection] = useState<Selection>({ kind: 'library', id: CATALOG[0].id })
  const [pageId, setPageId] = useState(CATALOG[0].pages[0].id)
  const [online, setOnline] = useState(navigator.onLine)
  const [progress, setProgress] = useState<DocProgress | null>(null)
  const [url, setUrl] = useState('')
  const [crawl, setCrawl] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [trying, setTrying] = useState(false)
  const [code, setCode] = useState(CATALOG[0].practice.starter)
  const [output, setOutput] = useState('')
  const [checkNote, setCheckNote] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [keyOpen, setKeyOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectSummary, setProjectSummary] = useState('')
  const [projectLibs, setProjectLibs] = useState<string[]>(['flask'])
  const [pasted, setPasted] = useState('')
  const [note, setNote] = useState<ErrorNote | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [showSimplified, setShowSimplified] = useState(true)

  const builtIn = CATALOG.find((library) => library.id === (selection.kind === 'library' ? selection.id : '')) ?? null
  const added = imported.find((library) => library.id === (selection.kind === 'library' ? selection.id : '')) ?? null
  const project = projects.find((item) => selection.kind === 'project' && item.id === selection.id) ?? null

  const activeModules: DocModule[] = useMemo(() => {
    if (builtIn) return modulesOf(builtIn)
    if (added) {
      if (added.modules && added.modules.length > 0 && showSimplified) {
        return added.modules
      }
      return [
        {
          id: 'raw-pages',
          title: 'Raw Scraped Pages',
          sections: (added.articles ?? []).map((article) => ({
            id: article.id,
            title: article.title,
            body: article.body,
            tryIt: article.tryIt
          }))
        }
      ]
    }
    return []
  }, [builtIn, added, showSimplified])

  const pages: StudyPage[] = useMemo(() => {
    if (builtIn) return builtIn.pages
    if (added) {
      return activeModules.flatMap((module) => module.sections)
    }
    return []
  }, [builtIn, added, activeModules])

  const page = pages.find((item) => item.id === pageId) ?? pages[0] ?? null

  useEffect(() => {
    void listImportedLibraries().then(setImported).catch(() => undefined)
    void loadProjects().then(setProjects).catch(() => undefined)
    void hasApiKey().then(setHasKey).catch(() => undefined)
    const marks = loadMarks()
    setBookmarks(marks.bookmarks)
    setHighlights(marks.highlights)
    let stop: () => void = () => undefined
    void watchDocProgress(setProgress).then((unlisten) => {
      stop = unlisten
    })
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      stop()
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  function openLibrary(library: CatalogLibrary | Library) {
    setSelection({ kind: 'library', id: library.id })
    const isSimplified = 'modules' in library && Boolean(library.modules && library.modules.length > 0)
    const first = 'pages' in library
      ? library.pages[0]
      : isSimplified && library.modules && library.modules.length > 0
      ? library.modules[0].sections[0]
      : library.articles[0]
    setPageId(first?.id ?? '')
    setError('')
    setOutput('')
    setCheckNote('')
    setTrying(false)
    setPasted('')
    setNote(null)
    if ('practice' in library) setCode(library.practice.starter)
  }

  async function saveUrl(event: React.FormEvent) {
    event.preventDefault()
    if (!online) {
      setError('Saving a new document needs an active connection. Already saved documents still open.')
      return
    }
    if (!url.trim()) {
      setError('Paste a documentation URL first.')
      return
    }
    setBusy('import')
    setError('')
    try {
      const library = await importLibrary(url.trim(), crawl)
      setImported((current) => [...current.filter((item) => item.id !== library.id), library])
      openLibrary(library)
      setUrl('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That document was not saved.')
    } finally {
      setBusy('')
      setProgress(null)
    }
  }

  async function handleSimplify() {
    if (!added) return
    if (!online || !hasKey) {
      setError('Simplifying documentation with AI needs an internet connection and an API key.')
      return
    }
    setBusy('simplify')
    setError('')
    try {
      const updated = await simplifyLibrary(added.id)
      setImported((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setShowSimplified(true)
      if (updated.modules && updated.modules.length > 0) {
        setPageId(updated.modules[0].sections[0]?.id ?? '')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The documentation could not be simplified.')
    } finally {
      setBusy('')
    }
  }

  function checkPractice() {
    if (!builtIn) return
    const missing = builtIn.practice.checks.find((item) => !code.includes(item.includes))
    setCheckNote(missing ? missing.message : 'The required pieces are present in the file. Read through before moving on.')
  }

  async function runExample() {
    if (!builtIn || builtIn.practice.language !== 'python') return
    setBusy('run')
    setOutput('')
    try {
      setOutput(await runPractice('python', code))
    } catch (reason) {
      setOutput(reason instanceof Error ? reason.message : 'The example did not run.')
    } finally {
      setBusy('')
    }
  }

  async function persist(next: StudyProject[]) {
    await storeProjects(next)
    setProjects(next)
  }

  async function createProject(event: React.FormEvent) {
    event.preventDefault()
    if (!projectName.trim() || projectLibs.length === 0) {
      setError('Name the project and choose at least one documentation set.')
      return
    }
    const next: StudyProject = {
      id: projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'project',
      name: projectName.trim(),
      summary: projectSummary.trim(),
      libraryIds: projectLibs,
      steps: [],
      note: null
    }
    setError('')
    setBusy('project')
    try {
      const without = projects.filter((item) => item.id !== next.id)
      await persist([...without, next])
      setSelection({ kind: 'project', id: next.id })
      setProjectName('')
      setProjectSummary('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The project was not saved.')
    } finally {
      setBusy('')
    }
  }

  async function writePlan() {
    if (!project) return
    if (!online || !hasKey) {
      setError('A new plan needs a connection and an API key. An already saved plan still opens.')
      return
    }
    setBusy('plan')
    setError('')
    try {
      const steps = await draftPlan({
        name: project.name,
        summary: project.summary,
        libraryIds: project.libraryIds,
        notes: notesFor(project.libraryIds)
      })
      await persist(projects.map((item) => (item.id === project.id ? { ...item, steps } : item)))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The plan was not written.')
    } finally {
      setBusy('')
    }
  }

  async function attachFolder() {
    if (!project) return
    if (!online || !hasKey) {
      setError('A new reading needs a connection and an API key. The last note still stays here.')
      return
    }
    setBusy('review')
    setError('')
    try {
      const report = await scanProject()
      const files = [
        ...report.files,
        ...report.findings.map((finding) => ({ path: finding.path, text: `Line ${finding.line}: ${finding.message}` }))
      ]
      const note = await reviewReading({ docs: docsFor(project.libraryIds), files })
      await persist(projects.map((item) => (item.id === project.id ? { ...item, note } : item)))
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'The folder was not read.'
      if (message !== 'cancelled') setError(message)
    } finally {
      setBusy('')
    }
  }

  const preview = useMemo(() => (builtIn?.practice.language === 'html' ? code : ''), [builtIn, code])
  const fraction = progress && progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0

  return (
    <div className="desk">
      <a className="skip" href="#document">
        Skip to main content
      </a>

      {/* LEFT SIDEBAR: SHELF */}
      <aside className="shelf" aria-label="Documentation shelf">
        <header className="desk-brand">
          <div className="desk-brand-header">
            <h1>
              <BookOpen size={20} color="#22c55e" />
              Gladian
            </h1>
            <span className="badge">v0.1.0</span>
          </div>
          <p>Read the documentation, then write every line of practice yourself.</p>
        </header>

        <h2 className="shelf-heading">Built-in Guides</h2>
        {CATALOG.map((library) => {
          const isSelected = builtIn?.id === library.id
          return (
            <button
              key={library.id}
              className={`shelf-btn ${isSelected ? 'active' : ''}`}
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => openLibrary(library)}
            >
              <strong>{library.name}</strong>
              <span className="shelf-btn-tag">Guide</span>
            </button>
          )
        })}

        {imported.length > 0 && <h2 className="shelf-heading">Saved from URL</h2>}
        {imported.map((library) => {
          const isSelected = added?.id === library.id
          const isSimplified = Boolean(library.modules && library.modules.length > 0)
          return (
            <button
              key={library.id}
              className={`shelf-btn ${isSelected ? 'active' : ''}`}
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => openLibrary(library)}
            >
              <strong>{library.name}</strong>
              <span className="shelf-btn-tag">{isSimplified ? 'AI Guide' : `${library.articles.length}p`}</span>
            </button>
          )
        })}

        <form className="shelf-form" onSubmit={(event) => void saveUrl(event)}>
          <h2 className="shelf-heading" style={{ margin: '0 0 4px' }}>Add Documentation</h2>
          <label>
            Docs URL
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://docs.example.com"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', fontWeight: 400, cursor: 'pointer' }}>
            <input type="checkbox" checked={crawl} onChange={(event) => setCrawl(event.target.checked)} />
            Include up to 30 nearby pages
          </label>
          <button className="shelf-btn-submit" type="submit" disabled={!online || busy === 'import'}>
            {busy === 'import' ? 'Saving…' : 'Save for Offline'}
          </button>
          {!online && <span style={{ fontSize: '11px', color: '#626c77' }}>Adding a new URL needs an active connection.</span>}
        </form>

        <h2 className="shelf-heading">Projects</h2>
        {projects.map((item) => {
          const isSelected = project?.id === item.id
          return (
            <button
              key={item.id}
              className={`shelf-btn ${isSelected ? 'active' : ''}`}
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => setSelection({ kind: 'project', id: item.id })}
            >
              <strong>{item.name}</strong>
              <span className="shelf-btn-tag">{item.libraryIds.length} libs</span>
            </button>
          )
        })}

        <form className="shelf-form" onSubmit={(event) => void createProject(event)}>
          <h2 className="shelf-heading" style={{ margin: '0 0 4px' }}>New Study Project</h2>
          <label>
            Project Name
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. My API Server" />
          </label>
          <label>
            What you are building
            <textarea
              value={projectSummary}
              onChange={(event) => setProjectSummary(event.target.value)}
              rows={2}
              placeholder="Short description of your goal"
            />
          </label>
          <button className="shelf-btn-submit" type="submit" disabled={busy === 'project'}>
            Create Project
          </button>
        </form>
      </aside>

      {/* CENTER: READER */}
      <main className="reader" id="document">
        {project ? (
          <div className="reader-body">
            <p className="reader-eyebrow">Study Project</p>
            <h1 className="reader-title">{project.name}</h1>
            <p className="reader-desc">{project.summary || 'A project that guides you through your attached documentation.'}</p>
            <div style={{ marginTop: '24px' }}>
              {project.steps.length === 0 ? (
                <p className="doc-paragraph" style={{ color: '#8b949e' }}>
                  No plan is saved yet. Draft one while online using your API key, then study it completely offline.
                </p>
              ) : (
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {project.steps.map((step) => (
                    <li key={`${step.docId}-${step.title}`} style={{ color: '#f0f6fc' }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{step.title}</h3>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#8b949e' }}>{step.detail}</p>
                      <button
                        className="guide-action-btn"
                        type="button"
                        onClick={() => {
                          const library = CATALOG.find((item) => item.id === step.libraryId)
                          if (!library) return
                          openLibrary(library)
                          setPageId(step.docId || library.pages[0].id)
                        }}
                      >
                        <ExternalLink size={12} />
                        Open {step.libraryId || 'the document'}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : pages.length > 0 ? (
          <>
            {/* Sticky Header with Title and Scrollable Module Navigation */}
            <div className="reader-header">
              <p className="reader-eyebrow">
                <FileCode2 size={14} />
                {builtIn
                  ? `${builtIn.name} Reference`
                  : added?.modules && added.modules.length > 0 && showSimplified
                  ? `${added.name} · AI Simplified Guide`
                  : `${added?.name} · Raw Documentation`}
              </p>
              <h1 className="reader-title">{builtIn?.name ?? added?.name}</h1>
              <p className="reader-desc">
                {builtIn?.summary ??
                  (added?.modules && added.modules.length > 0 && showSimplified
                    ? `Structured learning modules with code examples generated from ${added.sourceUrl || 'documentation'}. Cached offline.`
                    : `Saved raw documentation pages from ${added?.sourceUrl || 'URL'}. Cached on this computer.`)}
              </p>
              <nav className="module-nav" aria-label="Modules navigation">
                {activeModules.map((module) => (
                  <a key={module.id} href={`#${module.id}`} className="module-nav-pill">
                    {module.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Document Body */}
            <div className="reader-body">
              {activeModules.map((module) => (
                <section key={module.id} id={module.id} className="module">
                  <h2 className="module-header">{module.title}</h2>
                  {module.sections.map((item) => {
                    const currentLibId = builtIn?.id ?? added?.id ?? ''
                    const marked = highlights
                      .filter((entry) => entry.libraryId === currentLibId && entry.sectionId === item.id)
                      .map((entry) => entry.text)
                    const saved = bookmarks.some((entry) => entry.libraryId === currentLibId && entry.sectionId === item.id)

                    return (
                      <article className="guide-block" id={item.id} key={item.id}>
                        <div className="guide-tools">
                          <h3>{item.title}</h3>
                          <div className="guide-actions">
                            <button
                              className={`guide-action-btn ${saved ? 'active' : ''}`}
                              type="button"
                              onClick={() => {
                                const next = toggleBookmark({
                                  libraryId: currentLibId,
                                  sectionId: item.id,
                                  title: `${builtIn?.name ?? added?.name}: ${item.title}`
                                })
                                setBookmarks(next.bookmarks)
                              }}
                            >
                              <BookmarkIcon size={12} />
                              {saved ? 'Bookmarked' : 'Bookmark'}
                            </button>
                            <button
                              className="guide-action-btn"
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                const text = window.getSelection()?.toString() ?? ''
                                const next = addHighlight({ libraryId: currentLibId, sectionId: item.id, text })
                                setHighlights(next.highlights)
                              }}
                            >
                              Highlight
                            </button>
                          </div>
                        </div>

                        {/* Beautifully Formatted Markdown Content */}
                        <DocContent body={item.body} marked={marked} />

                        {/* Try It Callout */}
                        {item.tryIt && (
                          <div className="try-callout">
                            <Zap size={16} className="try-callout-icon" />
                            <p className="try-callout-text">
                              <strong>Try this:</strong> {item.tryIt}
                            </p>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </section>
              ))}

              {builtIn && (
                <p style={{ marginTop: '40px', fontSize: '13px', color: '#656d76', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  Authored for Gladian so you can master {builtIn.name} offline. Official reference is available at{' '}
                  <a href={builtIn.docsUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>
                    {builtIn.docsUrl}
                  </a>
                  .
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="reader-body">
            <h2 className="reader-title">Select a Document</h2>
            <p className="reader-desc">Choose a guide from the shelf on the left, or add a custom docs URL for offline study.</p>
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR: PRACTICE & TOOLS */}
      <aside className="practice" aria-label="Practice and tools">
        {project ? (
          <div className="practice-section">
            <h3>Project Coaching</h3>
            <p>Draft an offline study plan or attach a local folder to scan against documentation patterns.</p>
            <div className="practice-actions">
              <button
                className="practice-btn-primary"
                type="button"
                disabled={busy === 'plan'}
                onClick={() => void writePlan()}
              >
                <Sparkles size={14} />
                {busy === 'plan' ? 'Drafting…' : 'Draft Offline Plan'}
              </button>
            </div>
            <button
              className="practice-btn-secondary"
              type="button"
              disabled={busy === 'review'}
              onClick={() => void attachFolder()}
            >
              <FolderCode size={14} />
              {busy === 'review' ? 'Reading…' : 'Scan Sample Folder'}
            </button>
            {project.note && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="practice-note">
                  <strong>Matches:</strong> {project.note.matches}
                </div>
                <div className="practice-error">
                  <strong>Weak pattern:</strong> {project.note.weakPattern}
                </div>
                <div className="practice-note" style={{ color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.08)' }}>
                  <strong>Practice:</strong> {project.note.practice}
                </div>
              </div>
            )}
            <button
              className="practice-btn-secondary"
              style={{ marginTop: '8px' }}
              type="button"
              onClick={() => setKeyOpen(true)}
            >
              <Key size={13} />
              {hasKey ? 'API Key Configured' : 'Configure API Key'}
            </button>
          </div>
        ) : builtIn ? (
          <>
            {/* Error Explainer Card */}
            <form
              className="practice-section"
              onSubmit={(event) => {
                event.preventDefault()
                const next = explainError(
                  modulesOf(builtIn).flatMap((module) => module.sections),
                  pasted
                )
                setNote(next)
                if (next) document.getElementById(next.pageId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              <h3>Error Explainer</h3>
              <p>Paste a terminal or browser error to lookup the matching documentation.</p>
              <textarea
                value={pasted}
                onChange={(event) => setPasted(event.target.value)}
                rows={3}
                placeholder="Paste the error message here…"
                spellCheck={false}
                style={{
                  background: '#080c10',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  color: '#f0f6fc',
                  fontSize: '13px',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '8px 10px',
                  resize: 'vertical'
                }}
              />
              <button className="practice-btn-secondary" type="submit">
                Explain from Guide
              </button>
              {note && (
                <div className="practice-note" style={{ marginTop: '6px' }}>
                  <strong>{note.title}:</strong> {note.why}
                </div>
              )}
            </form>

            {/* Bookmarks Section */}
            {bookmarks.filter((item) => item.libraryId === builtIn.id).length > 0 && (
              <div className="practice-section">
                <h3>Bookmarks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {bookmarks
                    .filter((item) => item.libraryId === builtIn.id)
                    .map((item) => (
                      <button
                        key={item.sectionId}
                        className="shelf-btn"
                        style={{ padding: '6px 8px', fontSize: '13px' }}
                        type="button"
                        onClick={() => document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      >
                        {item.title}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Interactive Monaco Editor Practice */}
            <div className="practice-section">
              <h3>{builtIn.practice.title}</h3>
              <p>{builtIn.practice.brief}</p>
              <button
                className={trying ? 'practice-btn-secondary' : 'practice-btn-primary'}
                type="button"
                onClick={() => setTrying((current) => !current)}
              >
                {trying ? 'Close Editor' : 'Open Practice Editor'}
              </button>

              {trying && (
                <div>
                  <div className="practice-editor-wrap">
                    <div className="practice-editor-bar">
                      <span>{builtIn.practice.fileName}</span>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#656d76' }}>
                        {builtIn.practice.language}
                      </span>
                    </div>
                    <Editor
                      height="230px"
                      language={builtIn.practice.language === 'python' ? 'python' : 'javascript'}
                      theme="vs-dark"
                      value={code}
                      onChange={(value) => setCode(value ?? '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13.5,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 8, bottom: 8 },
                        lineNumbersMinChars: 3
                      }}
                    />
                  </div>

                  <div className="practice-actions">
                    <button className="practice-btn-secondary" type="button" onClick={checkPractice}>
                      Check Code
                    </button>
                    {builtIn.practice.language === 'python' && (
                      <button
                        className="practice-btn-primary"
                        type="button"
                        disabled={busy === 'run'}
                        onClick={() => void runExample()}
                      >
                        <Play size={13} />
                        {busy === 'run' ? 'Running…' : 'Run Python'}
                      </button>
                    )}
                  </div>

                  {(builtIn.practice.language === 'html' || code.includes('<')) && (
                    <iframe
                      style={{
                        width: '100%',
                        height: '140px',
                        border: '1px solid var(--border-default)',
                        borderRadius: '6px',
                        background: '#ffffff',
                        marginTop: '8px'
                      }}
                      title="Practice preview"
                      sandbox="allow-scripts"
                      srcDoc={builtIn.practice.language === 'html' ? preview : code}
                    />
                  )}

                  {checkNote && <div className="practice-note" style={{ marginTop: '8px' }}>{checkNote}</div>}
                  {output && <pre className="practice-output">{output}</pre>}
                </div>
              )}
            </div>
          </>
        ) : added ? (
          <div className="practice-section">
            <h3>{added.name}</h3>
            <p>Saved from {added.sourceUrl || 'URL'}. Cached on this computer.</p>
            {added.modules && added.modules.length > 0 ? (
              <div>
                <p style={{ color: '#4ade80', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> Simplified & cached offline
                </p>
                <div style={{ display: 'flex', gap: '6px', margin: '10px 0' }}>
                  <button
                    className={showSimplified ? 'practice-btn-primary' : 'practice-btn-secondary'}
                    type="button"
                    onClick={() => setShowSimplified(true)}
                  >
                    Simplified Guide
                  </button>
                  <button
                    className={!showSimplified ? 'practice-btn-primary' : 'practice-btn-secondary'}
                    type="button"
                    onClick={() => setShowSimplified(false)}
                  >
                    Raw ({added.articles.length}p)
                  </button>
                </div>
                {online && hasKey && (
                  <button
                    className="practice-btn-secondary"
                    type="button"
                    disabled={busy === 'simplify'}
                    onClick={() => void handleSimplify()}
                  >
                    <RefreshCw size={13} />
                    {busy === 'simplify' ? 'Re-simplifying…' : 'Re-simplify with AI'}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: '#8b949e', margin: '0 0 10px' }}>
                  Contains {added.articles.length} raw scraped pages. Convert them into structured lessons with runnable code examples.
                </p>
                <button
                  className="practice-btn-primary"
                  type="button"
                  disabled={!online || !hasKey || busy === 'simplify'}
                  onClick={() => void handleSimplify()}
                >
                  <Sparkles size={14} />
                  {busy === 'simplify' ? 'Simplifying with AI…' : 'Simplify with AI'}
                </button>
                {!hasKey && (
                  <p style={{ fontSize: '11px', color: '#656d76', marginTop: '6px' }}>
                    Add an API key below to enable AI simplification.
                  </p>
                )}
              </div>
            )}
            <button
              className="practice-btn-secondary"
              style={{ marginTop: '10px' }}
              type="button"
              onClick={() => setKeyOpen(true)}
            >
              <Key size={13} />
              {hasKey ? 'API Key Saved' : 'Add API Key'}
            </button>
          </div>
        ) : (
          <div className="practice-section">
            <h3>Documentation Tools</h3>
            <p>Select a guide to view exercises, bookmarks, and error lookup.</p>
          </div>
        )}

        {error && <div className="practice-error">{error}</div>}
      </aside>

      {/* FOOTER: STATUS BAR */}
      <footer className="status" role="contentinfo">
        <div className="status-indicator">
          <span className={`status-dot ${online ? '' : 'offline'}`} />
          <span>{online ? 'Online (Ready to save URLs)' : 'Offline (Saved docs active)'}</span>
        </div>

        {progress && busy === 'import' ? (
          <div className="meter-wrap">
            <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
              <span style={{ width: `${fraction}%` }} />
            </div>
            <span>
              Saving {progress.title}: page {progress.done} of {progress.total}
            </span>
          </div>
        ) : busy === 'simplify' ? (
          <span style={{ color: '#38bdf8' }}>Simplifying documentation with AI… this may take a moment</span>
        ) : (
          <span>{page?.title ?? project?.name ?? 'Gladian'}</span>
        )}
      </footer>

      {/* API KEY CONFIGURATION MODAL */}
      {keyOpen && (
        <form
          className="key-sheet"
          onSubmit={(event) => {
            event.preventDefault()
            void saveApiKey(apiKey)
              .then(() => {
                setHasKey(true)
                setApiKey('')
                setKeyOpen(false)
              })
              .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The key was not saved.'))
          }}
        >
          <h2>Configure Anthropic API Key</h2>
          <p>
            Your API key stays encrypted locally on this computer. It powers AI doc simplification and study plans.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-ant-api..."
            autoComplete="off"
            spellCheck={false}
          />
          <div className="key-sheet-actions">
            <button className="practice-btn-primary" type="submit">
              Save Key
            </button>
            <button
              className="practice-btn-secondary"
              type="button"
              onClick={() => {
                void forgetApiKey().then(() => setHasKey(false))
                setKeyOpen(false)
              }}
            >
              Remove
            </button>
            <button className="practice-btn-secondary" type="button" onClick={() => setKeyOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
