import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['endearing-enjoyment-production-ebfc.up.railway.app'],
    host: '0.0.0.0',
  },
  preview: {
    allowedHosts: ['endearing-enjoyment-production-ebfc.up.railway.app'],
    host: '0.0.0.0',
  },
})
