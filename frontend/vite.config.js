import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://smartbudget-ai-production-d837.up.railway.app',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    allowedHosts: 'all',
    host: '0.0.0.0',
  }
})
