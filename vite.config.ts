/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Las pruebas y sus utilidades no cuentan; main.tsx solo monta la app.
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
      reporter: ['text', 'json-summary', 'html'],
      // Mínimo igual al de la API: si baja de 70 %, el CI falla.
      thresholds: { lines: 70, statements: 70, functions: 70, branches: 70 },
    },
  },
})