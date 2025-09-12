// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Configura o Vite, a ferramenta de build
export default defineConfig({
  // Adiciona plugins para funcionalidades específicas
  plugins: [
    // Habilita o plugin do React, que inclui o suporte ao Fast Refresh
    react()
  ],
})