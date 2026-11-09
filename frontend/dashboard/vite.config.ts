import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dashboard talks to the Django API through this dev-server proxy, so the
// browser only ever uses same-origin relative URLs (works behind the Arena
// live-preview proxy too).
//
// VITE_BASE_PATH lets the deployed dashboard live on an unguessable path
// (e.g. /fh-console-7x2k9/) instead of a predictable /admin. It is baked in at
// build time; React Router reads the same value from src/config.ts.
const rawBase = process.env.VITE_BASE_PATH || '/'
const base = '/' + rawBase.replace(/^\/+|\/+$/g, '') + (rawBase.replace(/^\/+|\/+$/g, '') ? '/' : '')

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
})
