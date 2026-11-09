import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // The app is served from https://koroksengupta.github.io/inventomaitree/
  // so every file path must start with /inventomaitree/. If you ever rename
  // the GitHub repository, change this line to match the new name.
  base: '/inventomaitree/',
  plugins: [react(), tailwindcss()],
})
