import { useMemo, useState } from 'react'
import { CATALOG, type CatalogLibrary } from '../catalog'
import type { Library } from '../api'

type LibrarySearchProps = {
  online: boolean
  imported: Library[]
  onImport: (url: string, crawl: boolean) => Promise<void>
  onInstall: (packages: string[]) => Promise<string>
}

export function LibrarySearch({ online, imported, onImport, onInstall }: LibrarySearchProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(CATALOG[0].id)
  const [url, setUrl] = useState('')
  const [crawl, setCrawl] = useState(false)
  const [note, setNote] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const needle = query.trim().toLowerCase()
  const packs = useMemo(
    () =>
      CATALOG.filter((pack) =>
        !needle
          ? true
          : `${pack.name} ${pack.summary}`.toLowerCase().includes(needle)
      ),
    [needle]
  )
  const added = useMemo(
    () =>
      imported.filter((library) =>
        !needle ? true : `${library.name} ${library.sourceUrl ?? ''}`.toLowerCase().includes(needle)
      ),
    [imported, needle]
  )
  const selected = packs.find((pack) => pack.id === selectedId) ?? null
  const addedSelected = imported.find((library) => library.id === selectedId) ?? null

  async function install(pack: CatalogLibrary, packages: string[]) {
    if (!online) {
      setError('Install needs a connection. The guide is already on this computer.')
      return
    }
    setError('')
    setOutput('')
    setBusy(packages.join(','))
    try {
      const text = await onInstall(packages)
      setOutput(text)
      setNote(`${pack.name} install finished. The lesson is still yours to write.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The install did not finish.')
    } finally {
      setBusy('')
    }
  }

  async function submitUrl(event: React.FormEvent) {
    event.preventDefault()
    if (!online) {
      setError('Adding a URL needs a connection. Flask, Django, Pygame, and the other guides still open.')
      return
    }
    if (!url.trim()) {
      setError('Paste the docs URL.')
      return
    }
    setError('')
    setBusy('import')
    try {
      await onImport(url.trim(), crawl)
      setUrl('')
      setNote('Saved on this computer. Search can find it offline now.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That URL was not saved.')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="library-view" aria-label="Library search">
      <header className="library-head">
        <div>
          <h1>Study a library</h1>
          <p className="measure">
            The guides for these languages and libraries stay on this computer. Search one, read the steps, and write the example yourself. Install only needs a connection the first time.
          </p>
        </div>
        <p className={online ? 'ok' : 'muted'}>{online ? 'Online. Install and new URLs are available.' : 'Offline. Saved guides still open. Install waits.'}</p>
      </header>
      <div className="library-grid">
        <div className="stack">
          <label>
            Search libraries
            <input
              value={query}
              onChange={(event) => {
                const value = event.target.value
                setQuery(value)
                const nextNeedle = value.trim().toLowerCase()
                const nextPacks = CATALOG.filter((pack) =>
                  !nextNeedle ? true : `${pack.name} ${pack.summary}`.toLowerCase().includes(nextNeedle)
                )
                const nextAdded = imported.filter((library) =>
                  !nextNeedle ? true : `${library.name} ${library.sourceUrl ?? ''}`.toLowerCase().includes(nextNeedle)
                )
                const stillVisible = nextPacks.some((pack) => pack.id === selectedId) || nextAdded.some((library) => library.id === selectedId)
                if (!stillVisible && nextPacks[0]) setSelectedId(nextPacks[0].id)
                else if (!stillVisible && nextAdded[0]) setSelectedId(nextAdded[0].id)
              }}
              placeholder="Flask, Django, Pygame"
            />
          </label>
          {packs.map((pack) => (
            <button
              key={pack.id}
              className="file"
              type="button"
              aria-current={pack.id === selected?.id ? 'true' : undefined}
              onClick={() => {
                setSelectedId(pack.id)
                setOutput('')
                setError('')
              }}
            >
              <strong>{pack.name}</strong>
              <span className="muted">On this computer</span>
            </button>
          ))}
          {added.length > 0 && <h2>Added from a URL</h2>}
          {added.map((library) => (
            <button
              key={library.id}
              className="file"
              type="button"
              aria-current={library.id === selectedId ? 'true' : undefined}
              onClick={() => setSelectedId(library.id)}
            >
              <strong>{library.name}</strong>
              <span className="muted">Saved page</span>
            </button>
          ))}
          {packs.length === 0 && added.length === 0 && <p>No library matches that search. The guides are still installed with the app.</p>}
          <form className="card stack" onSubmit={(event) => void submitUrl(event)}>
            <h2>Add a docs URL</h2>
            <label>
              Docs URL
              <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} />
              <span className="help">The page is saved as text. Gladian does not run commands it finds there.</span>
            </label>
            <label>
              <span>
                <input type="checkbox" checked={crawl} onChange={(event) => setCrawl(event.target.checked)} /> Include up to 30 nearby pages on the same path
              </span>
            </label>
            <button className="btn" type="submit" disabled={!online || busy === 'import'}>
              {busy === 'import' ? 'Saving…' : 'Save for offline'}
            </button>
          </form>
        </div>
        <article className="card stack measure">
          {selected && (
            <>
              <h2>{selected.name}</h2>
              <p>{selected.summary}</p>
              <p className="help">
                <a href={selected.docsUrl} target="_blank" rel="noreferrer">
                  Official docs
                </a>
              </p>
              <ol className="guide-steps">
                {selected.pages.map((step) => (
                  <li key={step.id}>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
          {addedSelected && (
            <>
              <h2>{addedSelected.name}</h2>
              <p className="help">{addedSelected.sourceUrl}</p>
              {(addedSelected.articles ?? []).slice(0, 3).map((article) => (
                <section key={article.id}>
                  <h3>{article.title}</h3>
                  <p>{article.body.slice(0, 700)}</p>
                </section>
              ))}
            </>
          )}
          {!selected && !addedSelected && <p>Pick a library to open its guide.</p>}
          {note && <p className="ok">{note}</p>}
          {error && <p className="error">{error}</p>}
          {output && <pre>{output}</pre>}
        </article>
      </div>
    </section>
  )
}
