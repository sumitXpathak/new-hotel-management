import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The build goes into ../public so the Express server serves the React app.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '../public', emptyOutDir: true },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
