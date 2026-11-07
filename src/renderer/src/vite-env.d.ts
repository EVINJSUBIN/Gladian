/// <reference types="vite/client" />

interface GladianBridge {
  bootstrap: () => Promise<import('./api').Workspace>
  writeFile: (projectId: string, filePath: string, content: string) => Promise<void>
  setProgress: (progress: import('./api').Progress) => Promise<void>
  importUrl: (url: string, crawl: boolean) => Promise<import('./api').Library>
  savePack: (pack: unknown) => Promise<{ library: import('./api').Library; project: import('./api').Project | null }>
  setKey: (key: string) => Promise<void>
  clearKey: () => Promise<void>
  draftPack: (input: unknown) => Promise<import('./api').DraftPack>
  explain: (input: { code: string; file: string }) => Promise<{ encouragement: string; meaning: string; tryNext: string }>
  runCommand: (projectId: string, command: string) => Promise<{ stdout: string; stderr: string; code: number }>
}

interface Window {
  gladian?: GladianBridge
}
