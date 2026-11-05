import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'TravelEz',
        short_name: 'TravelEz',
        description: 'Copy real trips from real travelers and make them yours.',
        theme_color: '#004d51',
        background_color: '#fbf6ee',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  server: {
    // Used by `npm run dev:phone` only. The live backend only accepts listed
    // web addresses, so requests from a phone on your Wi-Fi go through this dev
    // server instead. Not part of the built site.
    proxy: {
      '/phone-api': {
        target: 'https://travelez-8rz7.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/phone-api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (request) => request.removeHeader('origin'))
        },
      },
    },
  },
})
