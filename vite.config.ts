import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(root, 'src') },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        render: resolve(root, 'render.html'),
      },
    },
  },
})
