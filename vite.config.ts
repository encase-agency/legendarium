import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Set VITE_BASE=/legendarium/ for GitHub Pages (the site then lives in a sub-folder).
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
