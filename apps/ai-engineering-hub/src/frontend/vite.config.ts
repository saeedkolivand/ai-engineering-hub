import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'shared-ui': path.resolve(__dirname, 'src/components/shared-ui'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
