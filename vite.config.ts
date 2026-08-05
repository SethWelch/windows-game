import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Port 2600 after XP's build number (5.1.2600), and well clear of Vite's
  // default 5173 so this can never wander onto another project's port.
  // strictPort makes a collision fail loudly instead of silently hopping to 2601.
  server: { port: 2600, strictPort: true },
  preview: { port: 2601, strictPort: true },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
