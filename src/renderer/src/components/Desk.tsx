import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
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
      setError('Saving a new document needs a connection. Pages already on this computer still open.')
      return
    }
    if (!url.trim()) {
      setError('Paste the documentation URL.')
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
    setCheckNote(missing ? missing.message : 'The pieces are in the file. Read them back before you call this done.')
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
      setError('A new plan needs a connection and an API key. A plan already saved still opens.')
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
        Skip to the document
      </a>
      <aside className="shelf">
        <header className="desk-brand">
          <h1>Gladian</h1>
          <p>Read a library, then try one small piece of it.</p>
        </header>
        <h2>Documents</h2>
        {CATALOG.map((library) => (
          <button key={library.id} className="file" type="button" aria-current={builtIn?.id === library.id ? 'true' : undefined} onClick={() => openLibrary(library)}>
            <strong>{library.name}</strong>
          </button>
        ))}
        {imported.length > 0 && <h2>Saved from a URL</h2>}
        {imported.map((library) => {
          const isSimplified = Boolean(library.modules && library.modules.length > 0)
          return (
            <button key={library.id} className="file" type="button" aria-current={added?.id === library.id ? 'true' : undefined} onClick={() => openLibrary(library)}>
              <strong>{library.name}</strong>
              <span className="muted">{isSimplified ? 'AI Guide · Offline' : `${library.articles.length} raw pages`}</span>
            </button>
          )
        })}
        <form className="stack add-doc" onSubmit={(event) => void saveUrl(event)}>
          <h2>Add documentation</h2>
          <label>
            Docs URL
            <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" />
          </label>
          <label className="check">
            <input type="checkbox" checked={crawl} onChange={(event) => setCrawl(event.target.checked)} /> Include up to 30 nearby pages
          </label>
          <button className="btn" type="submit" disabled={!online || busy === 'import'}>
            {busy === 'import' ? 'Saving…' : 'Save for offline'}
          </button>
          {!online && <p className="help">Pages already saved still open. A new URL waits for a connection.</p>}
        </form>
        <h2>Projects</h2>
        {projects.map((item) => (
          <button key={item.id} className="file" type="button" aria-current={project?.id === item.id ? 'true' : undefined} onClick={() => setSelection({ kind: 'project', id: item.id })}>
            <strong>{item.name}</strong>
            <span className="muted">{item.libraryIds.join(', ')}</span>
          </button>
        ))}
        <form className="stack add-doc" onSubmit={(event) => void createProject(event)}>
          <label>
            Project name
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          </label>
          <label>
            What you are building
            <textarea value={projectSummary} onChange={(event) => setProjectSummary(event.target.value)} rows={3} />
          </label>
          <fieldset>
            <legend>Documentation this project uses</legend>
            {CATALOG.map((library) => (
              <label key={library.id} className="check">
                <input
                  type="checkbox"
                  checked={projectLibs.includes(library.id)}
                  onChange={(event) =>
                    setProjectLibs((current) => (event.target.checked ? [...current, library.id] : current.filter((id) => id !== library.id)))
                  }
                />
                {library.name}
              </label>
            ))}
          </fieldset>
          <button className="btn" type="submit" disabled={busy === 'project'}>
            Create project
          </button>
        </form>
      </aside>
      <main className="reader" id="document">
        {project ? (
          <article className="page measure">
            <h2>{project.name}</h2>
            <p>{project.summary || 'A project that studies the documents you attached.'}</p>
            {project.steps.length === 0 ? (
              <p>No plan is saved yet. Draft one while you are online, then it stays on this computer.</p>
            ) : (
              <ol className="plan">
                {project.steps.map((step) => (
                  <li key={`${step.docId}-${step.title}`}>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => {
                        const library = CATALOG.find((item) => item.id === step.libraryId)
                        if (!library) return
                        openLibrary(library)
                        setPageId(step.docId || library.pages[0].id)
                      }}
                    >
                      Open {step.libraryId || 'the document'}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </article>
        ) : pages.length > 0 ? (
          <article className="page" key={builtIn?.id ?? added?.id}>
            <p className="eyebrow">
              {builtIn
                ? builtIn.name
                : added?.modules && added.modules.length > 0 && showSimplified
                ? `${added.name} · AI Simplified Guide`
                : `${added?.name} · Raw Documentation`}
            </p>
            <h2>{builtIn?.name ?? added?.name}</h2>
            <p>
              {builtIn?.summary ??
                (added?.modules && added.modules.length > 0 && showSimplified
                  ? `Structured learning modules with runnable code snippets generated from ${added.sourceUrl || 'documentation'}. Cached offline.`
                  : `Saved raw documentation pages from ${added?.sourceUrl || 'URL'}. Cached on this computer.`)}
            </p>
            <nav className="module-nav" aria-label="Modules">
              {activeModules.map((module) => (
                <a key={module.id} href={`#${module.id}`}>
                  {module.title}
                </a>
              ))}
            </nav>
            {activeModules.map((module) => (
              <section key={module.id} id={module.id} className="module">
                <h2>{module.title}</h2>
                {module.sections.map((item) => {
                  const currentLibId = builtIn?.id ?? added?.id ?? ''
                  const marked = highlights.filter((entry) => entry.libraryId === currentLibId && entry.sectionId === item.id).map((entry) => entry.text)
                  const saved = bookmarks.some((entry) => entry.libraryId === currentLibId && entry.sectionId === item.id)
                  return (
                    <section className="guide-block" id={item.id} key={item.id}>
                      <div className="guide-tools">
                        <h3>{item.title}</h3>
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => {
                            const next = toggleBookmark({ libraryId: currentLibId, sectionId: item.id, title: `${builtIn?.name ?? added?.name}: ${item.title}` })
                            setBookmarks(next.bookmarks)
                          }}
                        >
                          {saved ? 'Bookmarked' : 'Bookmark'}
                        </button>
                        <button
                          className="ghost"
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
                      {item.body.split('\n\n').map((paragraph, pIdx) => {
                        const trimmed = paragraph.trim()
                        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
                          const lines = trimmed.split('\n')
                          const codeBody = lines.slice(1, lines.length - 1).join('\n')
                          return (
                            <pre key={pIdx}>
                              <code>{codeBody}</code>
                            </pre>
                          )
                        }
                        return (
                          <p key={pIdx}>
                            {paint(paragraph, marked).map((part, index) =>
                              typeof part === 'string' ? <span key={index}>{part}</span> : <mark key={index}>{part.mark}</mark>
                            )}
                          </p>
                        )
                      })}
                      <p className="try-line">{item.tryIt}</p>
                    </section>
                  )
                })}
              </section>
            ))}
            {builtIn && (
              <p className="help">
                Written for this desk so you can study {builtIn.name} offline. The official site is still{' '}
                <a href={builtIn.docsUrl} target="_blank" rel="noreferrer">
                  here
                </a>
                .
              </p>
            )}
          </article>
        ) : (
          <article className="page">
            <h2>Choose a document</h2>
            <p>The shelf keeps the libraries that ship with Gladian, and any pages you save from a URL.</p>
          </article>
        )}
      </main>
      <aside className="practice">
        {project ? (
          <div className="stack">
            <h2>Plan and reading</h2>
            <p>The plan points at documents on this computer. The reading note looks at a folder you attach and does not change it.</p>
            <button className="btn" type="button" disabled={busy === 'plan'} onClick={() => void writePlan()}>
              {busy === 'plan' ? 'Drafting…' : 'Draft an offline plan'}
            </button>
            <button className="ghost" type="button" disabled={busy === 'review'} onClick={() => void attachFolder()}>
              {busy === 'review' ? 'Reading the folder…' : 'Attach a sample folder'}
            </button>
            {!online && <p className="help">A new plan or reading needs a connection. What is already saved still opens.</p>}
            {project.note && (
              <section className="flat">
                <h3>What matches the docs</h3>
                <p>{project.note.matches}</p>
                <h3>One weak pattern</h3>
                <p>{project.note.weakPattern}</p>
                <h3>Practice this</h3>
                <p>{project.note.practice}</p>
              </section>
            )}
            <button className="ghost" type="button" onClick={() => setKeyOpen(true)}>
              {hasKey ? 'API key saved' : 'Add API key'}
            </button>
          </div>
        ) : builtIn ? (
          <div className="stack">
            <form
              className="stack"
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
              <label>
                Paste an error
                <textarea value={pasted} onChange={(event) => setPasted(event.target.value)} rows={4} placeholder="The message from the terminal or the browser" />
              </label>
              <button className="btn" type="submit">
                Explain from the guide
              </button>
              <p className="help">This stays on this computer. It matches your message to the open guide.</p>
            </form>
            {note && (
              <section className="flat">
                <h3>Why this happened</h3>
                <p>{note.why}</p>
                <p>Related guide: {note.title}</p>
              </section>
            )}
            {bookmarks.filter((item) => item.libraryId === builtIn.id).length > 0 && (
              <section className="flat">
                <h3>Bookmarks</h3>
                {bookmarks
                  .filter((item) => item.libraryId === builtIn.id)
                  .map((item) => (
                    <button key={item.sectionId} className="ghost" type="button" onClick={() => document.getElementById(item.sectionId)?.scrollIntoView({ block: 'start' })}>
                      {item.title}
                    </button>
                  ))}
              </section>
            )}
            <h2>{builtIn.practice.title}</h2>
            <p>{builtIn.practice.brief}</p>
            <button className="btn" type="button" onClick={() => setTrying((current) => !current)}>
              {trying ? 'Close the try area' : 'Try this'}
            </button>
            {trying && (
              <div className="try">
                <p className="help">{builtIn.practice.fileName}</p>
                <Editor
                  height="240px"
                  language={builtIn.practice.language === 'python' ? 'python' : 'javascript'}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value ?? '')}
                  options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', scrollBeyondLastLine: false }}
                />
                <button className="ghost" type="button" onClick={checkPractice}>
                  Check the pieces
                </button>
                {builtIn.practice.language === 'python' && (
                  <button className="ghost" type="button" disabled={busy === 'run'} onClick={() => void runExample()}>
                    {busy === 'run' ? 'Running…' : 'Run with Python'}
                  </button>
                )}
                {(builtIn.practice.language === 'html' || code.includes('<')) && (
                  <iframe className="try-preview" title="Example preview" sandbox="allow-scripts" srcDoc={builtIn.practice.language === 'html' ? preview : code} />
                )}
                {checkNote && <p className="ok">{checkNote}</p>}
                {output && <pre>{output}</pre>}
              </div>
            )}
          </div>
        ) : added ? (
          <div className="stack">
            <h2>{added.name}</h2>
            <p>Saved from {added.sourceUrl || 'URL'}. Available offline.</p>
            {added.modules && added.modules.length > 0 ? (
              <section className="flat">
                <h3>AI Simplified Guide</h3>
                <p className="ok">Simplified with AI & cached offline.</p>
                <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
                  <button
                    className={showSimplified ? 'btn' : 'ghost'}
                    type="button"
                    onClick={() => setShowSimplified(true)}
                  >
                    Simplified Guide
                  </button>
                  <button
                    className={!showSimplified ? 'btn' : 'ghost'}
                    type="button"
                    onClick={() => setShowSimplified(false)}
                  >
                    Raw Pages ({added.articles.length})
                  </button>
                </div>
                {online && hasKey && (
                  <button
                    className="ghost"
                    type="button"
                    disabled={busy === 'simplify'}
                    onClick={() => void handleSimplify()}
                  >
                    {busy === 'simplify' ? 'Re-simplifying with AI…' : 'Re-simplify with AI'}
                  </button>
                )}
              </section>
            ) : (
              <section className="flat">
                <h3>AI Simplification</h3>
                <p>This documentation currently has {added.articles.length} raw scraped page{added.articles.length === 1 ? '' : 's'}. Use your Claude API key to convert them into structured, easy-to-read learning modules with code snippets and exercises.</p>
                <button
                  className="btn"
                  type="button"
                  disabled={!online || !hasKey || busy === 'simplify'}
                  onClick={() => void handleSimplify()}
                >
                  {busy === 'simplify' ? 'Simplifying with AI…' : 'Simplify with AI'}
                </button>
                {!hasKey && (
                  <p className="help">
                    Add an API key below to unlock AI documentation simplification.
                  </p>
                )}
                {!online && (
                  <p className="help">
                    Simplification requires internet access. Once converted, the guide works offline.
                  </p>
                )}
              </section>
            )}
            <button className="ghost" type="button" onClick={() => setKeyOpen(true)}>
              {hasKey ? 'API key saved' : 'Add API key'}
            </button>
          </div>
        ) : (
          <div className="stack">
            <h2>Saved pages</h2>
            <p>This document was saved from a URL. It stays readable offline.</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </aside>
      <footer className="status">
        <span>{online ? 'Online. New documents can be saved.' : 'Offline. Saved documents still open.'}</span>
        {progress && busy === 'import' ? (
          <span className="meter-wrap">
            <span className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
              <span style={{ width: `${fraction}%` }} />
            </span>
            <span>
              Saving {progress.title}, page {progress.done} of {progress.total}
            </span>
          </span>
        ) : busy === 'simplify' ? (
          <span>Simplifying documentation with AI… this may take a moment</span>
        ) : (
          <span>{page?.title ?? project?.name ?? 'Gladian'}</span>
        )}
      </footer>
      {keyOpen && (
        <form
          className="key-sheet stack"
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
          <h2>API key</h2>
          <p>The key stays on this computer. Plans, reading notes, and AI doc simplification need it. Saved documents open without it.</p>
          <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" />
          <button className="btn" type="submit">
            Save key
          </button>
          <button
            className="ghost"
            type="button"
            onClick={() => {
              void forgetApiKey().then(() => setHasKey(false))
              setKeyOpen(false)
            }}
          >
            Remove key
          </button>
          <button className="ghost" type="button" onClick={() => setKeyOpen(false)}>
            Close
          </button>
        </form>
      )}
    </div>
  )
}
