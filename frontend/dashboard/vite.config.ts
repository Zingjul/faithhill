import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dashboard talks to the Django API through this dev-server proxy, so the
// browser only ever uses same-origin relative URLs (works behind the Arena
// live-preview proxy too).
//
// The app is always served from the site root. A static host publishes dist/ at
// "/", so base must match — otherwise index.html requests assets from a
// sub-path that does not exist and the page loads blank.
export default defineConfig({
  base: '/',
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
