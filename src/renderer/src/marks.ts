export type Bookmark = { libraryId: string; sectionId: string; title: string }
export type Highlight = { libraryId: string; sectionId: string; text: string }

const KEY = 'gladian-doc-marks'

type Store = { bookmarks: Bookmark[]; highlights: Highlight[] }

function read(): Store {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '') as Store
    return {
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : []
    }
  } catch {
    return { bookmarks: [], highlights: [] }
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function loadMarks() {
  return read()
}

export function toggleBookmark(bookmark: Bookmark) {
  const store = read()
  const exists = store.bookmarks.some((item) => item.libraryId === bookmark.libraryId && item.sectionId === bookmark.sectionId)
  store.bookmarks = exists
    ? store.bookmarks.filter((item) => !(item.libraryId === bookmark.libraryId && item.sectionId === bookmark.sectionId))
    : [bookmark, ...store.bookmarks]
  write(store)
  return store
}

export function addHighlight(highlight: Highlight) {
  const text = highlight.text.trim()
  if (text.length < 2 || text.length > 240) return read()
  const store = read()
  const exists = store.highlights.some(
    (item) => item.libraryId === highlight.libraryId && item.sectionId === highlight.sectionId && item.text === text
  )
  if (!exists) store.highlights = [{ ...highlight, text }, ...store.highlights].slice(0, 80)
  write(store)
  return store
}

export function removeHighlight(highlight: Highlight) {
  const store = read()
  store.highlights = store.highlights.filter(
    (item) => !(item.libraryId === highlight.libraryId && item.sectionId === highlight.sectionId && item.text === highlight.text)
  )
  write(store)
  return store
}
