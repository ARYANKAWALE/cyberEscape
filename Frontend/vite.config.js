import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo at /cyberEscape/; local `npm run dev` stays at /.
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
})
