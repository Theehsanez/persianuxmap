import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

/**
 * Two builds from one codebase:
 * - default: TanStack Start full-stack app (SSR shell + oRPC API backed by Drizzle/SQLite).
 * - VITE_STATIC_DEMO=1: a static SPA for GitHub Pages; the API contract runs in the browser instead.
 */
const staticDemo = process.env.VITE_STATIC_DEMO === '1'
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    tanstackStart({
      srcDirectory: 'src',
      ...(staticDemo ? { spa: { enabled: true, prerender: { outputPath: '/index.html', crawlLinks: false } } } : {}),
    }),
    react(),
    tailwindcss(),
  ],
  server: { host: true },
  // MapLibre spawns its worker via new URL(..., import.meta.url); pre-bundling breaks that path in dev.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  ssr: { external: ['better-sqlite3'] },
})
