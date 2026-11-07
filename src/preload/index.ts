import { contextBridge, ipcRenderer } from 'electron'

const api = {
  bootstrap: () => ipcRenderer.invoke('bootstrap'),
  writeFile: (projectId: string, filePath: string, content: string) =>
    ipcRenderer.invoke('write-file', projectId, filePath, content),
  setProgress: (progress: unknown) => ipcRenderer.invoke('set-progress', progress),
  importUrl: (url: string, crawl: boolean) => ipcRenderer.invoke('import-url', url, crawl),
  savePack: (pack: unknown) => ipcRenderer.invoke('save-pack', pack),
  setKey: (key: string) => ipcRenderer.invoke('set-key', key),
  clearKey: () => ipcRenderer.invoke('clear-key'),
  draftPack: (input: unknown) => ipcRenderer.invoke('draft-pack', input),
  explain: (input: unknown) => ipcRenderer.invoke('explain', input),
  runCommand: (projectId: string, command: string) => ipcRenderer.invoke('run-command', projectId, command)
}

contextBridge.exposeInMainWorld('gladian', api)
