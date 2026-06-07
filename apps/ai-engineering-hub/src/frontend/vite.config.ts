import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared-types': path.resolve(__dirname, '../../shared-types/src'),
      '@shared-events': path.resolve(__dirname, '../../shared-events/src'),
      '@shared-api-contracts': path.resolve(__dirname, '../../shared-api-contracts/src')
    }
  },
  server: {
    // The backend will proxy to this port; placeholder for dev
    port: 5173,
    strictPort: true,
  }
});