import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'WargaCheck — Asisten AI Dokumen Kependudukan',
        short_name: 'WargaCheck',
        description: 'Cek kelengkapan berkas dan tanya prosedur dokumen kependudukan Indonesia dengan AI',
        theme_color: '#E63946',
        background_color: '#FAF8F5',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' rx=\'10\' fill=\'%23E63946\'/%3E%3Crect x=\'11\' y=\'7\' width=\'18\' height=\'24\' rx=\'3\' fill=\'rgba(255,255,255,0.15)\' stroke=\'rgba(255,255,255,0.25)\' stroke-width=\'1\'/%3E%3Cline x1=\'15\' y1=\'14\' x2=\'25\' y2=\'14\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Cline x1=\'15\' y1=\'18\' x2=\'22\' y2=\'18\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Ccircle cx=\'26\' cy=\'26\' r=\'9\' fill=\'white\'/%3E%3Cpath d=\'M22 26.5L24.5 29L30 23.5\' stroke=\'%23E63946\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' rx=\'10\' fill=\'%23E63946\'/%3E%3Crect x=\'11\' y=\'7\' width=\'18\' height=\'24\' rx=\'3\' fill=\'rgba(255,255,255,0.15)\' stroke=\'rgba(255,255,255,0.25)\' stroke-width=\'1\'/%3E%3Cline x1=\'15\' y1=\'14\' x2=\'25\' y2=\'14\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Cline x1=\'15\' y1=\'18\' x2=\'22\' y2=\'18\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3Ccircle cx=\'26\' cy=\'26\' r=\'9\' fill=\'white\'/%3E%3Cpath d=\'M22 26.5L24.5 29L30 23.5\' stroke=\'%23E63946\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-motion': ['motion'],
        },
      },
    },
  },
  server: {
    // Proxy API calls to the Express backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Ensure SSE streaming works properly (no proxy buffering)
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req) => {
            if (req.url?.includes('/chat/stream')) {
              proxyRes.headers['cache-control'] = 'no-cache';
              proxyRes.headers['x-accel-buffering'] = 'no';
            }
          });
        },
      },
    },
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
