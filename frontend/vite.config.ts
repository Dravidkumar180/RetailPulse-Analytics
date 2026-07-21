import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api': {
        // RetailPulse's local API runs on 8001. Keep this configurable for
        // environments that expose the backend at another address.
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    // Always resolve hooks and the renderer through the frontend's React copy.
    dedupe: ['react', 'react-dom'],
  },
})
