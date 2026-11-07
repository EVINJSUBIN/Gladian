import { useState } from 'react'
import { audit } from '../coach'
import { scanProject, type ScanReport } from '../api'

type Row = {
  path: string
  line: number
  message: string
  docId: string
}

type FolderScanProps = {
  onOpenDoc: (id: string) => void
}

export function FolderScan({ onOpenDoc }: FolderScanProps) {
  const [report, setReport] = useState<ScanReport | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function openFolder() {
    setError('')
    setBusy(true)
    try {
      const next = await scanProject()
      const reviewed = reviewReport(next)
      setReport(next)
      setRows(reviewed)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'The folder was not scanned.'
      if (message !== 'cancelled') setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="library-view" aria-label="Project scan">
      <header className="library-head">
        <div>
          <h1>Scan a project</h1>
          <p className="measure">
            Open a folder on this computer. Gladian reads the source files and reports one error at a time. It does not change the files.
          </p>
        </div>
        <button className="btn" type="button" disabled={busy} onClick={() => void openFolder()}>
          {busy ? 'Scanning…' : 'Open project folder'}
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      {report && (
        <article className="card stack measure">
          <h2>{report.folder}</h2>
          <p>
            Checked {report.checked} source files.
            {report.skipped > 0 ? ` Skipped ${report.skipped} dependency or unreadable paths.` : ''}
          </p>
          {report.note && <p className="help">{report.note}</p>}
          {rows.length === 0 ? (
            <p className="ok">Nothing in these files failed the scan. The next step is still yours to write.</p>
          ) : (
            <ol className="guide-steps">
              {rows.slice(0, 12).map((row) => (
                <li key={`${row.path}:${row.line}:${row.message}`}>
                  <h3>
                    {row.path}:{row.line}
                  </h3>
                  <p>{row.message}</p>
                  {row.docId && (
                    <button className="ghost" type="button" onClick={() => onOpenDoc(row.docId)}>
                      Open the matching doc
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
          {rows.length > 12 && <p className="help">Showing the first 12. Fix one, then scan the folder again.</p>}
        </article>
      )}
    </section>
  )
}

export function reviewReport(report: ScanReport): Row[] {
  const fromPython = report.findings.map((finding) => ({
    path: finding.path,
    line: finding.line,
    message: finding.message,
    docId: ''
  }))
  const fromScripts = report.files.flatMap((file) => {
    const card = audit(file.path, file.text, [])
    if (!card.suggestion) return []
    return [{ path: file.path, line: card.line, message: card.suggestion, docId: card.docId }]
  })
  return [...fromPython, ...fromScripts]
}
