import type { StudyPage } from './catalog'

export type ErrorNote = {
  why: string
  pageId: string
  title: string
}

const PATTERNS: { test: RegExp; why: string; words: string[] }[] = [
  {
    test: /modulenotfounderror|no module named/i,
    why: 'Python looked for that library and did not find it. The guide on this computer is still here. The package is missing from the Python on your machine.',
    words: ['install', 'library', 'import']
  },
  {
    test: /syntaxerror/i,
    why: 'The file stops being readable at the line named in the error. A quote, a parenthesis, or a colon is still open.',
    words: ['route', 'function', 'return']
  },
  {
    test: /indentationerror|unexpected indent/i,
    why: 'Python uses spaces to show which lines belong together. This line is not lined up with the block above it.',
    words: ['function', 'return']
  },
  {
    test: /nameerror/i,
    why: 'A name is used before it exists, or the spelling does not match the name you created.',
    words: ['function', 'name', 'route']
  },
  {
    test: /404|not found/i,
    why: 'The address you opened does not match a path written in the file. The function can be fine and still never run.',
    words: ['path', 'route', 'address', 'url']
  },
  {
    test: /address already in use|eaddrinuse/i,
    why: 'Another program is already using that port. Stop it, or choose a different port number.',
    words: ['port', 'listen', 'server']
  },
  {
    test: /connection refused|failed to establish|max retries/i,
    why: 'Nothing answered at that address. The server was not running, or the address was not the one the program printed.',
    words: ['request', 'server', 'address']
  },
  {
    test: /401|403|unauthorized|forbidden/i,
    why: 'The server answered, and it refused the call. It wants permission. Do not put a secret into the file while you figure out which header the docs name.',
    words: ['status', 'request', 'header']
  }
]

function words(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3)
}

function bestPage(pages: StudyPage[], hints: string[]) {
  let best = pages[0]
  let score = -1
  for (const page of pages) {
    const hay = `${page.title} ${page.body} ${page.tryIt}`.toLowerCase()
    const next = hints.reduce((total, word) => total + (hay.includes(word) ? 1 : 0), 0)
    if (next > score) {
      score = next
      best = page
    }
  }
  return best
}

export function explainError(pages: StudyPage[], pasted: string): ErrorNote | null {
  const text = pasted.trim()
  if (!text || pages.length === 0) return null
  const pattern = PATTERNS.find((item) => item.test.test(text))
  const page = bestPage(pages, [...words(text), ...(pattern?.words ?? [])])
  const why = pattern
    ? pattern.why
    : 'This is the guide whose words sit closest to what you pasted. Read that section, then look at the line number in the error.'
  return { why, pageId: page.id, title: page.title }
}
