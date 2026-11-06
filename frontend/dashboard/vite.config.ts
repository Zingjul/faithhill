import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dashboard talks to the Django API through this dev-server proxy, so the
// browser only ever uses same-origin relative URLs (works behind the Arena
// live-preview proxy too).
export default defineConfig({
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
