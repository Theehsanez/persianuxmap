import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true },
  // MapLibre spawns its worker via new URL(..., import.meta.url); pre-bundling breaks that path in dev.
  optimizeDeps: { exclude: ['maplibre-gl'] },
})
