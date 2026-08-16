import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Offline-first scanner: cache the app shell so gate staff can keep
      // scanning even when the venue Wi-Fi drops (queued syncs handled in
      // src via Dexie/IndexedDB, wired up in Tuần 6).
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'QR Attendance — Scanner',
        short_name: 'QR Scanner',
        description: 'Ứng dụng quét QR check-in sự kiện, hoạt động offline.',
        theme_color: '#0F1320',
        background_color: '#0F1320',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
