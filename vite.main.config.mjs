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
        'sql.js',
        'electron',
        'electron-squirrel-startup', 
        '@supabase/supabase-js',
        'crypto',
        'fs',
        'path',
        'os',
        'uuid',
        /^node:.*/  // Externalize all Node.js built-in modules
      ],
      output: {
        format: 'cjs',
        inlineDynamicImports: false, // Don't inline dynamic imports
        manualChunks: undefined
      }
    },
    commonjsOptions: {
      ignoreDynamicRequires: false
    }
  }
});
