import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The dashboard talks to the Django API through this dev-server proxy, so the
// browser only ever uses same-origin relative URLs (works behind the Arena
// live-preview proxy too).
//
// VITE_BASE_PATH lets the deployed dashboard live on an unguessable path
// (e.g. /fh-console-7x2k9/) instead of a predictable /admin. It is baked in at
// build time; React Router reads the same value from src/config.ts.
//
// loadEnv() is used rather than process.env so a value set in a .env file and
// a value set in the real environment are seen identically. Reading process.env
// here while src/config.ts reads import.meta.env would let the two disagree —
// assets served from / while the router expects /fh-console-.../ — which is a
// blank screen with no error.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const cleaned = (env.VITE_BASE_PATH || '/').replace(/^\/+|\/+$/g, '')
  const base = '/' + cleaned + (cleaned ? '/' : '')

  return {
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
  }
})
