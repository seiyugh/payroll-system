import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    laravel({
      input: [
        'resources/css/app.css',
        'resources/js/app.tsx',
        'resources/js/pages/Welcome.tsx' // Explicit entry
      ],
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'resources/js'),
    },
  },
  build: {
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'resources/js/app.tsx'),
        welcome: resolve(__dirname, 'resources/js/pages/Welcome.tsx'),
      },
    },
  },
});