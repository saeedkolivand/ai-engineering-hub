import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared-types': resolve(__dirname, '../../packages/shared-types/src'),
      '@shared-events': resolve(__dirname, '../../packages/shared-events/src'),
      '@shared-api-contracts': resolve(__dirname, '../../packages/shared-api-contracts/src')
    }
  },
  server: {
    port: 3000,
  }
});