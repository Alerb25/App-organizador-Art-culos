import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite que DDEV se conecte al contenedor
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'drupal-webcorporativa.ddev.site'
    ],
    hmr: {
      host: 'drupal-webcorporativa.ddev.site',
      protocol: 'wss' // Esto es para que el refresco automático funcione con HTTPS
    }
  },
})
