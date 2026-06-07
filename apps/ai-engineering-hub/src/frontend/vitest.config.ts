import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFile: './test/setup.ts',
    include: ['**/__tests__/**/*.test.ts?(x)'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html'],
    },
  },
});