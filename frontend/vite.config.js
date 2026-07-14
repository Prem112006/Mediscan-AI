import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.basename(process.cwd()) === 'frontend' ? 'dist' : '../dist',
    emptyOutDir: true,
  }
})