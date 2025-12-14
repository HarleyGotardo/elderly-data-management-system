import { defineConfig } from 'vite';
import commonjs from '@rollup/plugin-commonjs';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    commonjs()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@config': path.resolve(__dirname, 'src/config')
    }
  },
  build: {
    rollupOptions: {
      external: [
        'better-sqlite3', 
        'electron-squirrel-startup', 
        '@supabase/supabase-js',
        'crypto',
        'fs',
        'path',
        'os',
        'uuid'
      ],
      output: {
        format: 'cjs',
        inlineDynamicImports: true // Bundle all dynamic imports into main.js
      }
    }
  }
});
