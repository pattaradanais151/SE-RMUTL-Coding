import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'hero.png'],
      manifest: {
        name: 'SE Job RMUTL',
        short_name: 'SE Job',
        description: 'ระบบจัดการภาระงานและตารางเรียน',
        theme_color: '#ffffff',
        icons: [
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      }
    })
  ],
})