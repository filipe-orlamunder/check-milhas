import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // --- Configurações de Cobertura de Testes ---
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'src/generated/**',
        'src/data/store.ts',      
        'src/utils/asyncHandler.ts', 
        '**/__tests__/**',        
        'node_modules/**',     
        'dist/**',
        // Excluir arquivos de configuração do Vitest do relatório de cobertura
        'vitest.config.ts',
        'vitest.config.js',
        '**/vitest.config.*',
      ],
    },
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.spec.ts'],
  },
});