// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

console.log("🔧 Variáveis carregadas pelo Vite:");
console.log(process.env.VITE_API_URL);

// https://vitejs.dev/config/
// Configura o Vite, a ferramenta de build
export default defineConfig({
  // Adiciona plugins para funcionalidades específicas
  plugins: [
    // Habilita o plugin do React, que inclui o suporte ao Fast Refresh
    react()
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/types/**',
        'src/api.ts',
      ],
    },
  },
})