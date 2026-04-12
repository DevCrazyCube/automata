import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config. The dev server runs on port 5173 to avoid clashing with the
// backend on port 3000. Socket.io connects directly to the backend URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: true
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
});
