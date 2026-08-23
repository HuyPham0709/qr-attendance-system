import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cổng riêng 5175 — khác client-admin (8443/5173) và client-scanner (5174),
// khớp với CLIENT_ATTENDEE_ORIGIN trong server/.env.example.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175
  }
})
