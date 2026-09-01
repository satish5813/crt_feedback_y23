import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Local dev: proxy API calls to the backend.
    // VITE_PROXY_TARGET lets us point at a tunnel/live backend; default is the local backend on :3001.
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:3001', changeOrigin: true },
    },
  },
});
