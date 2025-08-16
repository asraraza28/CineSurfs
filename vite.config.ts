import { defineConfig } from 'vite';         // ✅ REQUIRED!
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  base: '', // For Netlify, use empty string or remove this line
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
