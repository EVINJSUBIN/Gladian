import * as acorn from 'acorn'
import type { Article } from './content'

export type CoachCard = {
  praise: string
  suggestion: string
  docId: string
  issueId: string
  line: number
}

export type Hint = { id: string; includes: string; suggestion: string; articleId: string }

function scriptsOf(path: string, content: string) {
  if (path.endsWith('.js')) return [content]
  if (!path.endsWith('.html')) return []
  return [...content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1])
}

function syntaxIssue(code: string) {
  const trimmed = code.trim()
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('<!--')) return null
  try {
    acorn.parse(trimmed, { ecmaVersion: 'latest', sourceType: 'script' })
    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The script has a syntax error.'
    const line = 'loc' in (error as object) ? Number((error as { loc?: { line?: number } }).loc?.line ?? 1) : 1
    return { message: message.replace(/\s*\(\d+:\d+\)$/, ''), line }
  }
}

export function audit(path: string, content: string, hints: Hint[]): CoachCard {
  let praise = 'You are writing this file yourself. That is the whole practice.'
  if (/<h1[\s>]/i.test(content)) praise = 'The page has a heading. People can tell what it is.'
  else if (/function\s+\w+/.test(content)) praise = 'That function has a name. You can call it when you need it.'
  else if (/<button[\s>]/i.test(content)) praise = 'The button is on the page, ready for a behavior.'

  const scripts = scriptsOf(path, content)
  for (const script of scripts) {
    const issue = syntaxIssue(script)
    if (issue) {
      return {
        praise,
        suggestion: `The script does not parse yet. ${issue.message} Look at the line and close the token that is still open.`,
        docId: 'js-values',
        issueId: `syntax:${path}`,
        line: issue.line
      }
    }
  }

  if (/<img\b(?![^>]*\balt=)/i.test(content)) {
    return {
      praise,
      suggestion: 'An image is missing alt text. Add alt with a short description of the picture.',
      docId: 'html-images',
      issueId: `alt:${path}`,
      line: 1
    }
  }

  if (/\bvar\s+/.test(content)) {
    return {
      praise,
      suggestion: 'var still runs, and let or const will tell you whether the name is allowed to change.',
      docId: 'js-values',
      issueId: `var:${path}`,
      line: 1
    }
  }

  const hint = hints.find((item) => item.includes && content.includes(item.includes))
  if (hint) {
    return {
      praise,
      suggestion: hint.suggestion || 'Compare this part with the article, then change it yourself.',
      docId: hint.articleId || 'js-values',
      issueId: `hint:${hint.id}`,
      line: 1
    }
  }

  if (/<button\b/i.test(content) && content.includes('<script') && !content.includes('addEventListener')) {
    return {
      praise,
      suggestion: 'The button is visible. It still needs a click listener before it can do anything.',
      docId: 'js-events',
      issueId: `click:${path}`,
      line: 1
    }
  }

  return {
    praise,
    suggestion: '',
    docId: '',
    issueId: '',
    line: 1
  }
}

export function articleById(articles: Article[], id: string) {
  return articles.find((article) => article.id === id) ?? null
}
