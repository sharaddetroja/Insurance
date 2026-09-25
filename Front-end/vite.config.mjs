import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    {
      name: 'copy-vanilla-assets',
      closeBundle() {
        if (fs.existsSync('app.js')) {
          fs.copyFileSync('app.js', 'dist/app.js');
        }
        if (fs.existsSync('data')) {
          if (!fs.existsSync('dist/data')) {
            fs.mkdirSync('dist/data', { recursive: true });
          }
          fs.cpSync('data', 'dist/data', { recursive: true, force: true });
        }
      },
    },
  ],
});
