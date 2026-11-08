import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  // 5173 belongs to the CodeBite dev server on this machine; fail loudly rather than drift to another port.
  server: { port: 5174, strictPort: true },
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
