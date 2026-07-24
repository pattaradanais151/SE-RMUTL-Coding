import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.PNG', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'SE-JOB RMUTL',
        short_name: 'SE-JOB',
        description: 'ระบบจัดการงานและตารางเรียนสำหรับนักศึกษา SE RMUTL',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo.PNG',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.PNG',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});