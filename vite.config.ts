import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve('src/renderer'),
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: resolve('dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve('src/renderer/src')
    }
  },
  plugins: [tailwindcss(), react()]
})
