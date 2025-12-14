import { defineConfig } from 'vite';
import commonjs from '@rollup/plugin-commonjs';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    commonjs()
  ],
  build: {
    rollupOptions: {
      external: ['better-sqlite3', 'electron-squirrel-startup', '@supabase/supabase-js'],
      output: {
        format: 'cjs'
      }
    }
  }
});
