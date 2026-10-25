import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative paths: GitHub Pages serves the site under /<repo>/, not at the domain root.
  base: './',
  plugins: [react()],
})
