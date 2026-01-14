import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true // Para build de produccion
  },
  css: {
    devSourcemap: true // Importante si debuggeas estilos
  },
  // Agrega esto especificamente para el modo DEV
  server: {
    sourcemapIgnoreList: false, 
  },
  plugins: [vue()],
})
