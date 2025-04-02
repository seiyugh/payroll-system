import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import fs from 'fs';

// Dynamically find all React page components
const pageFiles = fs.readdirSync(resolve(__dirname, 'resources/js/pages'))
  .filter(file => file.endsWith('.tsx'))
  .map(file => `resources/js/pages/${file}`);

export default defineConfig({
  plugins: [
    laravel({
      input: [
        'resources/css/app.css',
        'resources/js/app.tsx',
        ...pageFiles // Include all page components
      ],
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
    }),
    react({
      jsxImportSource: 'react',
      babel: {
        plugins: ['babel-plugin-macros'],
      },
    }),
    tailwindcss({
      config: resolve(__dirname, 'tailwind.config.js'),
    }),
  ],
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
      '@': resolve(__dirname, 'resources/js'),
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['lodash', 'axios'],
        },
      },
    },
  },
});