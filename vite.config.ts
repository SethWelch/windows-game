import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /*
   * Relative asset URLs, so the built page works wherever it is served from.
   *
   * The default is `/`, which emits `<script src="/assets/index-abc.js">` — correct only at
   * the root of a domain. On GitHub Pages a project site lives at `/<repo>/`, so every asset
   * 404s and you get a white screen. Hardcoding `base: '/windows-game/'` fixes that and then
   * breaks the root case, `npm run preview`, and opening `dist/index.html` directly.
   *
   * `./` sidesteps the question: paths resolve against the page, so the same build works at
   * a domain root, under a subpath, or behind a custom domain, with nothing to keep in step
   * with the repo name. Nothing here reads a URL from the address bar, so there is no router
   * to confuse.
   */
  base: './',
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
